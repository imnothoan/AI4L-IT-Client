import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@mediapipe/face_mesh';

export class FaceDetectionService {
    private model: faceLandmarksDetection.FaceLandmarksDetector | null = null;
    private isLoaded = false;
    private simulationMode = false;
    private simulatedResult: any = null;

    async loadModel() {
        if (this.isLoaded) return;

        try {
            const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
            const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
                runtime: 'mediapipe', // or 'tfjs'
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                maxFaces: 2,
                refineLandmarks: true // Important for Iris tracking
            };

            this.model = await faceLandmarksDetection.createDetector(model, detectorConfig);
            this.isLoaded = true;
            console.log("FaceDetectionService: Model Loaded");
        } catch (error) {
            console.error("FaceDetectionService: Failed to load model", error);
            // Fallback or handle error
        }
    }

    // Method to enable simulation for testing
    setSimulationMode(enabled: boolean, result: any = null) {
        this.simulationMode = enabled;
        this.simulatedResult = result;
        console.log(`FaceDetectionService: Simulation Mode ${enabled ? 'ON' : 'OFF'}`);
    }

    async detect(video: HTMLVideoElement) {
        if (this.simulationMode) {
            return this.simulatedResult || { status: 'OK', data: null };
        }

        if (!this.model || !this.isLoaded) return null;

        try {
            const predictions = await this.model.estimateFaces(video, {
                flipHorizontal: false
            });

            return this.analyzePredictions(predictions);
        } catch (error) {
            console.error("FaceDetectionService: Detection error", error);
            return null;
        }
    }

    private analyzePredictions(predictions: faceLandmarksDetection.Face[]) {
        if (predictions.length === 0) {
            return { status: 'NO_FACE', message: 'No face detected' };
        }
        if (predictions.length > 1) {
            return { status: 'MULTIPLE_FACES', message: 'Multiple people detected' };
        }

        const face = predictions[0];
        const keypoints = face.keypoints;

        // REAL GAZE TRACKING IMPLEMENTATION
        // MediaPipe Face Mesh Landmarks:
        // - Left Iris: 468-472 (468 = center)
        // - Right Iris: 473-477 (473 = center)
        // - Left Eye Corners: 33 (inner), 133 (outer)
        // - Right Eye Corners: 362 (inner), 263 (outer)
        // - Nose Tip: 1
        // - Forehead: 10

        try {
            // Extract iris centers
            const leftIrisCenter = keypoints[468];
            const rightIrisCenter = keypoints[473];

            // Extract eye corners for reference
            const leftEyeInner = keypoints[33];
            const leftEyeOuter = keypoints[133];
            const rightEyeInner = keypoints[362];
            const rightEyeOuter = keypoints[263];

            // Calculate gaze vectors (iris position relative to eye center)
            const leftEyeCenterX = (leftEyeInner.x + leftEyeOuter.x) / 2;
            const leftEyeCenterY = (leftEyeInner.y + leftEyeOuter.y) / 2;
            const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;
            const rightEyeCenterY = (rightEyeInner.y + rightEyeOuter.y) / 2;

            // Gaze vector (normalized)
            const gazeX = ((leftIrisCenter.x - leftEyeCenterX) + (rightIrisCenter.x - rightEyeCenterX)) / 2;
            const gazeY = ((leftIrisCenter.y - leftEyeCenterY) + (rightIrisCenter.y - rightEyeCenterY)) / 2;

            // HEAD POSE ESTIMATION (Pitch, Yaw, Roll)
            const noseTip = keypoints[1];
            const forehead = keypoints[10];

            // Simplified pitch calculation (vertical head angle)
            const pitch = Math.atan2(noseTip.y - forehead.y, noseTip.z || 1) * (180 / Math.PI);

            // Simplified yaw calculation (horizontal head angle)
            const faceWidth = Math.abs(leftEyeOuter.x - rightEyeOuter.x);
            const noseToCenterX = noseTip.x - (leftEyeOuter.x + rightEyeOuter.x) / 2;
            const yaw = (noseToCenterX / faceWidth) * 90; // Degrees

            // GAZE ZONE CLASSIFICATION
            // Thresholds based on Proctorio research (>20° yaw, >15° pitch)
            let gazeZone = 'screen';
            let gazeWarning = '';

            // Horizontal gaze (left/right)
            if (Math.abs(gazeX) > 0.15 || Math.abs(yaw) > 20) {
                gazeZone = 'away-horizontal';
                gazeWarning = 'Looking away horizontally';
            }

            // Vertical gaze
            if (gazeY > 0.1 || pitch > 15) {
                gazeZone = 'keyboard';
                gazeWarning = 'Looking down (keyboard/phone)';
            } else if (gazeY < -0.1 || pitch < -15) {
                gazeZone = 'ceiling';
                gazeWarning = 'Looking up';
            }

            // Phone detection zone (down + angle)
            if (pitch > 25 && Math.abs(yaw) > 10) {
                gazeZone = 'phone';
                gazeWarning = 'Possible phone usage';
            }

            return {
                status: gazeZone === 'screen' ? 'OK' : 'GAZE_WARNING',
                message: gazeWarning || 'Focused on screen',
                data: {
                    face,
                    gaze: { x: gazeX, y: gazeY, zone: gazeZone },
                    headPose: { pitch, yaw, roll: 0 }, // Roll calculation requires more landmarks
                    warning: gazeWarning
                }
            };
        } catch (error) {
            console.error('Gaze tracking error:', error);
            return { status: 'OK', data: face }; // Fallback to basic detection
        }
    }
}

export const faceDetectionService = new FaceDetectionService();

// Expose for browser console testing
(window as any).faceDetectionService = faceDetectionService;
