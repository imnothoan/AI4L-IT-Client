import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import { CheatWarning } from '@/types';

/**
 * Anti-Cheat Computer Vision Service
 * Monitors student behavior during exams
 */

export class AntiCheatService {
  private model: blazeface.BlazeFaceModel | null = null;
  private isInitialized = false;
  private lastFacePosition: { x: number; y: number } | null = null;
  private warningThreshold = 3; // Number of violations before warning
  private violationCount = 0;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await tf.ready();
      this.model = await blazeface.load();
      this.isInitialized = true;
      console.log('Anti-cheat model loaded successfully');
    } catch (error) {
      console.error('Error loading anti-cheat model:', error);
      throw error;
    }
  }

  /**
   * Analyze video frame for cheating behavior
   */
  async analyzeFrame(
    videoElement: HTMLVideoElement,
    attemptId: string
  ): Promise<CheatWarning | null> {
    if (!this.model || !this.isInitialized) {
      console.warn('Model not initialized');
      return null;
    }

    try {
      const predictions = await this.model.estimateFaces(videoElement, false);

      // No face detected
      if (predictions.length === 0) {
        this.violationCount++;
        if (this.violationCount >= this.warningThreshold) {
          this.violationCount = 0;
          return this.createWarning(attemptId, 'no-face', 'high');
        }
        return null;
      }

      // Multiple faces detected
      if (predictions.length > 1) {
        return this.createWarning(attemptId, 'multiple-faces', 'high');
      }

      // Check for head movement (looking away)
      const face = predictions[0];
      const faceCenter = this.getFaceCenter(face);
      
      if (this.lastFacePosition) {
        const movement = this.calculateMovement(this.lastFacePosition, faceCenter);
        
        // Significant horizontal movement (looking left/right)
        if (Math.abs(movement.x) > 100) {
          this.violationCount++;
          if (this.violationCount >= this.warningThreshold) {
            this.violationCount = 0;
            const direction = movement.x > 0 ? 'right' : 'left';
            return this.createWarning(
              attemptId,
              'look-away',
              'medium',
              `Student looked ${direction}`
            );
          }
        } else {
          // Reset violation count if behavior is normal
          this.violationCount = Math.max(0, this.violationCount - 0.5);
        }
      }

      this.lastFacePosition = faceCenter;
      return null;
    } catch (error) {
      console.error('Error analyzing frame:', error);
      return null;
    }
  }

  /**
   * Get center point of face bounding box
   */
  private getFaceCenter(face: any): { x: number; y: number } {
    const start = face.topLeft as number[];
    const end = face.bottomRight as number[];
    return {
      x: (start[0] + end[0]) / 2,
      y: (start[1] + end[1]) / 2,
    };
  }

  /**
   * Calculate movement between two positions
   */
  private calculateMovement(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): { x: number; y: number } {
    return {
      x: to.x - from.x,
      y: to.y - from.y,
    };
  }

  /**
   * Create a cheat warning
   */
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
    };
  }

  /**
   * Capture snapshot from video element
   */
  captureSnapshot(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    
    return '';
  }

  /**
   * Reset tracking state
   */
  reset(): void {
    this.lastFacePosition = null;
    this.violationCount = 0;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.model) {
      this.model = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const antiCheatService = new AntiCheatService();
