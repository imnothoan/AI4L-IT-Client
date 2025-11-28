import * as ort from 'onnxruntime-web';
import { CheatWarning } from '@/types';

/**
 * Anti-Cheat Service using YOLO11 (Object Detection) + L2CS-Net (Gaze Estimation)
 * Detects: Person, Phone, Book, Paper, Looking Away
 */

export class AntiCheatService {
  private session: ort.InferenceSession | null = null;
  private gazeSession: ort.InferenceSession | null = null;
  private isInitialized = false;
  private violationCount = 0;
  private gazeViolationCount = 0;
  private warningThreshold = 3;

  // Model Config
  private modelPath = '/models/anticheat_yolo11s.onnx';
  private gazeModelPath = '/models/l2cs_net_gaze.onnx'; // User needs to place file here
  private inputSize = 640;
  private gazeInputSize = 448; // L2CS-Net standard
  private confThreshold = 0.4;
  private iouThreshold = 0.45;

  // Class Names (Must match training)
  private classNames = ['person', 'phone', 'book', 'paper'];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set wasm paths (important for Vite)
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/";

      const options: ort.InferenceSession.SessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      };

      // Load YOLO
      this.session = await ort.InferenceSession.create(this.modelPath, options);
      console.log('✅ Anti-Cheat YOLO Model loaded!');

      // Load L2CS-Net
      try {
        this.gazeSession = await ort.InferenceSession.create(this.gazeModelPath, options);
        console.log('✅ Anti-Cheat Gaze Model loaded!');
      } catch (gazeError) {
        console.warn('⚠️ Gaze Model not found. Gaze detection disabled.', gazeError);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to load Anti-Cheat Models:', error);
      console.warn('Make sure models are in public/models/');
    }
  }

  async analyzeFrame(
    videoElement: HTMLVideoElement,
    attemptId: string
  ): Promise<CheatWarning | null> {
    if (!this.session || !this.isInitialized) return null;

    try {
      // 1. YOLO Preprocess & Inference
      const { tensor, scale, xRatio, yRatio } = this.preprocess(videoElement);
      const feeds = { images: tensor };
      const results = await this.session.run(feeds);
      const output = results[this.session.outputNames[0]].data as Float32Array;
      const predictions = this.postprocess(output, scale, xRatio, yRatio);

      // 2. Gaze Inference (if available)
      let gaze: { pitch: number, yaw: number } | null = null;
      if (this.gazeSession) {
        gaze = await this.runGazeInference(videoElement);
      }

      // 3. Logic Check
      return this.checkRules(predictions, gaze, attemptId);

    } catch (error) {
      console.error('Inference Error:', error);
      return null;
    }
  }

  private preprocess(source: HTMLVideoElement) {
    const w = source.videoWidth;
    const h = source.videoHeight;

    const canvas = document.createElement('canvas');
    canvas.width = this.inputSize;
    canvas.height = this.inputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("No context");

    ctx.drawImage(source, 0, 0, this.inputSize, this.inputSize);
    const imageData = ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const { data } = imageData;

    const input = new Float32Array(1 * 3 * this.inputSize * this.inputSize);

    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      input[i] = data[i * 4] / 255.0;       // R
      input[this.inputSize * this.inputSize + i] = data[i * 4 + 1] / 255.0; // G
      input[2 * this.inputSize * this.inputSize + i] = data[i * 4 + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor('float32', input, [1, 3, this.inputSize, this.inputSize]);
    return { tensor, scale: 1, xRatio: w / this.inputSize, yRatio: h / this.inputSize };
  }

  private async runGazeInference(source: HTMLVideoElement): Promise<{ pitch: number, yaw: number } | null> {
    if (!this.gazeSession) return null;

    // Preprocess for L2CS (448x448, Normalized Mean/Std usually)
    // Assuming standard normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    const w = this.gazeInputSize;
    const h = this.gazeInputSize;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(source, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const { data } = imageData;

    const input = new Float32Array(1 * 3 * w * h);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < w * h; i++) {
      // R
      input[i] = ((data[i * 4] / 255.0) - mean[0]) / std[0];
      // G
      input[w * h + i] = ((data[i * 4 + 1] / 255.0) - mean[1]) / std[1];
      // B
      input[2 * w * h + i] = ((data[i * 4 + 2] / 255.0) - mean[2]) / std[2];
    }

    const tensor = new ort.Tensor('float32', input, [1, 3, w, h]);

    try {
      const results = await this.gazeSession.run({ images: tensor });
      // L2CS outputs: output_pitch, output_yaw (usually bins)
      // Let's assume output names are 'output_pitch' and 'output_yaw' or index 0 and 1
      const outputNames = this.gazeSession.outputNames;
      const pitchOutput = results[outputNames[0]].data as Float32Array;
      const yawOutput = results[outputNames[1]].data as Float32Array;

      const pitch = this.softmaxToAngle(pitchOutput);
      const yaw = this.softmaxToAngle(yawOutput);

      return { pitch, yaw };
    } catch (e) {
      console.error('Gaze Inference Failed:', e);
      return null;
    }
  }

  private softmaxToAngle(logits: Float32Array): number {
    // Softmax
    let maxLogit = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i] > maxLogit) maxLogit = logits[i];
    }

    let sumExp = 0;
    const exps = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      exps[i] = Math.exp(logits[i] - maxLogit);
      sumExp += exps[i];
    }

    // Expectation: sum(prob * idx)
    let expectedIdx = 0;
    for (let i = 0; i < logits.length; i++) {
      const prob = exps[i] / sumExp;
      expectedIdx += prob * i;
    }

    // Convert idx to angle (assuming 90 bins for -90 to 90)
    // Angle = expectedIdx * 2 - 90 (approx)
    // Or usually L2CS is trained with specific bin mapping. 
    // Let's assume standard L2CS: 90 bins, range [-90, 90]
    return expectedIdx * 2 - 90; // 45 * 2 - 90 = 0
  }

  private postprocess(output: Float32Array, _scale: number, xRatio: number, yRatio: number): any[] {
    const boxes: any[] = [];
    const numClasses = this.classNames.length;
    const numAnchors = 8400;

    for (let i = 0; i < numAnchors; i++) {
      let maxScore = 0;
      let classId = -1;

      for (let c = 0; c < numClasses; c++) {
        const score = output[(4 + c) * numAnchors + i];
        if (score > maxScore) {
          maxScore = score;
          classId = c;
        }
      }

      if (maxScore > this.confThreshold) {
        const xc = output[0 * numAnchors + i];
        const yc = output[1 * numAnchors + i];
        const w = output[2 * numAnchors + i];
        const h = output[3 * numAnchors + i];

        const x1 = (xc - w / 2) * xRatio;
        const y1 = (yc - h / 2) * yRatio;
        const x2 = (xc + w / 2) * xRatio;
        const y2 = (yc + h / 2) * yRatio;

        boxes.push({
          x1, y1, x2, y2,
          score: maxScore,
          classId,
          label: this.classNames[classId]
        });
      }
    }

    return this.nms(boxes);
  }

  private nms(boxes: any[]): any[] {
    if (boxes.length === 0) return [];

    boxes.sort((a, b) => b.score - a.score);
    const selected: any[] = [];
    const active = new Array(boxes.length).fill(true);

    for (let i = 0; i < boxes.length; i++) {
      if (!active[i]) continue;
      selected.push(boxes[i]);

      for (let j = i + 1; j < boxes.length; j++) {
        if (active[j]) {
          const iou = this.calculateIoU(boxes[i], boxes[j]);
          if (iou > this.iouThreshold) {
            active[j] = false;
          }
        }
      }
    }
    return selected;
  }

  private calculateIoU(boxA: any, boxB: any): number {
    const xA = Math.max(boxA.x1, boxB.x1);
    const yA = Math.max(boxA.y1, boxB.y1);
    const xB = Math.min(boxA.x2, boxB.x2);
    const yB = Math.min(boxA.y2, boxB.y2);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = (boxA.x2 - boxA.x1) * (boxA.y2 - boxA.y1);
    const boxBArea = (boxB.x2 - boxB.x1) * (boxB.y2 - boxB.y1);

    return interArea / (boxAArea + boxBArea - interArea);
  }

  private checkRules(predictions: any[], gaze: { pitch: number, yaw: number } | null, attemptId: string): CheatWarning | null {
    // Count objects
    const personCount = predictions.filter(p => p.label === 'person').length;
    const phoneCount = predictions.filter(p => p.label === 'phone').length;
    const bookCount = predictions.filter(p => p.label === 'book').length;
    const paperCount = predictions.filter(p => p.label === 'paper').length;

    // Rule 1: Multiple People
    if (personCount > 1) {
      return this.createWarning(attemptId, 'multiple-faces', 'high', `Detected ${personCount} people`);
    }

    // Rule 2: No Person (Absence)
    if (personCount === 0) {
      this.violationCount++;
      if (this.violationCount >= this.warningThreshold) {
        this.violationCount = 0;
        return this.createWarning(attemptId, 'no-face', 'high', 'No person detected');
      }
      return null;
    }

    // Rule 3: Prohibited Objects (Phone)
    if (phoneCount > 0) {
      return this.createWarning(attemptId, 'forbidden-object', 'high', 'Phone detected');
    }

    // Rule 4: Prohibited Objects (Book/Paper)
    if (bookCount > 0 || paperCount > 0) {
      return this.createWarning(attemptId, 'forbidden-object', 'medium', 'Book/Paper detected');
    }

    // Rule 5: Gaze Detection (Looking Away)
    // Thresholds: Yaw > 30 or < -30, Pitch > 25 or < -25
    if (gaze) {
      if (Math.abs(gaze.yaw) > 30 || Math.abs(gaze.pitch) > 25) {
        this.gazeViolationCount++;
        if (this.gazeViolationCount >= 5) { // Require 5 consecutive frames to avoid jitter
          this.gazeViolationCount = 0;
          return this.createWarning(attemptId, 'look-away', 'medium', `Looking away (Y:${gaze.yaw.toFixed(0)}, P:${gaze.pitch.toFixed(0)})`);
        }
      } else {
        this.gazeViolationCount = Math.max(0, this.gazeViolationCount - 1);
      }
    }

    // Reset violation count if normal
    this.violationCount = Math.max(0, this.violationCount - 0.5);
    return null;
  }

  private createWarning(
    attemptId: string,
    type: CheatWarning['type'],
    severity: CheatWarning['severity'],
    _details?: string
  ): CheatWarning {
    return {
      id: `warning-${Date.now()}`,
      attemptId,
      type,
      timestamp: new Date(),
      severity,
      message: _details
    };
  }

  reset(): void {
    this.violationCount = 0;
    this.gazeViolationCount = 0;
  }

  dispose(): void {
    this.session = null;
    this.gazeSession = null;
    this.isInitialized = false;
  }
}

export const antiCheatService = new AntiCheatService();
