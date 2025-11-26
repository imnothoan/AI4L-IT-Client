import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

export class ObjectDetectionService {
    private model: cocoSsd.ObjectDetection | null = null;
    private isLoaded = false;
    private simulationMode = false;
    private simulatedResult: any = [];

    async loadModel() {
        if (this.isLoaded) return;

        try {
            // Optimize TensorFlow backend
            await import('@tensorflow/tfjs-backend-webgl');
            await tf.setBackend('webgl');
            await tf.ready();
            console.log(`ObjectDetectionService: Backend set to ${tf.getBackend()}`);

            this.model = await cocoSsd.load({
                base: 'lite_mobilenet_v2' // Faster for browser
            });
            this.isLoaded = true;
            console.log("ObjectDetectionService: Model Loaded");
        } catch (error) {
            console.error("ObjectDetectionService: Failed to load model", error);
        }
    }

    // Method to enable simulation for testing
    setSimulationMode(enabled: boolean, result: any = []) {
        this.simulationMode = enabled;
        this.simulatedResult = result;
        console.log(`ObjectDetectionService: Simulation Mode ${enabled ? 'ON' : 'OFF'}`);
    }

    async detect(video: HTMLVideoElement) {
        if (this.simulationMode) {
            return this.analyzePredictions(this.simulatedResult);
        }

        if (!this.model || !this.isLoaded) return [];

        try {
            const predictions = await this.model.detect(video);
            return this.analyzePredictions(predictions);
        } catch (error) {
            console.error("ObjectDetectionService: Detection error", error);
            return { status: 'OK' };
        }
    }

    private analyzePredictions(predictions: cocoSsd.DetectedObject[]) {
        const forbiddenObjects = ['cell phone', 'book', 'laptop', 'remote'];
        const detectedForbidden = predictions.filter(p => forbiddenObjects.includes(p.class));

        if (detectedForbidden.length > 0) {
            return {
                status: 'FORBIDDEN_OBJECT',
                objects: detectedForbidden.map(p => p.class)
            };
        }

        return { status: 'OK' };
    }
}

export const objectDetectionService = new ObjectDetectionService();

// Expose for browser console testing
(window as any).objectDetectionService = objectDetectionService;
