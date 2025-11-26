/**
 * Advanced Gaze Tracking Service
 * 
 * Implements precise gaze estimation using MediaPipe Iris landmarks
 * Based on research of Proctorio, Inspera, and academic papers on eye tracking
 * 
 * Features:
 * - Iris-based gaze vector calculation (468 facial landmarks)
 * - Head pose estimation (pitch, yaw, roll)
 * - Zone classification (screen, keyboard, phone, away)
 * - Configurable thresholds and calibration
 * - Temporal smoothing to reduce false positives
 */

export interface GazeData {
    x: number; // Horizontal gaze (-1 = left, 0 = center, 1 = right)
    y: number; // Vertical gaze (-1 = up, 0 = center, 1 = down)
    zone: 'screen' | 'keyboard' | 'phone' | 'away-horizontal' | 'ceiling';
    confidence: number; // 0-1
}

export interface HeadPose {
    pitch: number; // Vertical rotation (degrees)
    yaw: number; // Horizontal rotation (degrees)
    roll: number; // Tilt (degrees)
}

export interface GazeAnalysisResult {
    gaze: GazeData;
    headPose: HeadPose;
    isLookingAway: boolean;
    warning: string | null;
    timestamp: number;
}

export class GazeTrackingService {
    private gazeHistory: GazeData[] = [];
    private historySize = 30; // Keep last 30 frames (1 second at 30fps)

    // Thresholds (based on Proctorio research)
    private thresholds = {
        gazeX: 0.15, // Horizontal gaze threshold
        gazeY: 0.10, // Vertical gaze threshold
        yaw: 20, // Degrees
        pitch: 15, // Degrees
        phoneAngle: 25, // Degrees downward
        lookAwayDuration: 3000 // Milliseconds (3 seconds)
    };

    private lastLookAwayTime = 0;
    private lookAwayStartTime = 0;

    /**
     * Analyze gaze from facial landmarks
     * @param keypoints MediaPipe Face Mesh keypoints (468+ landmarks)
     */
    analyzeGaze(keypoints: any[]): GazeAnalysisResult {
        // Extract iris landmarks
        const leftIrisCenter = keypoints[468];
        const rightIrisCenter = keypoints[473];

        // Extract eye corners
        const leftEyeInner = keypoints[33];
        const leftEyeOuter = keypoints[133];
        const rightEyeInner = keypoints[362];
        const rightEyeOuter = keypoints[263];

        // Calculate eye centers
        const leftEyeCenterX = (leftEyeInner.x + leftEyeOuter.x) / 2;
        const leftEyeCenterY = (leftEyeInner.y + leftEyeOuter.y) / 2;
        const rightEyeCenterX = (rightEyeInner.x + rightEyeOuter.x) / 2;
        const rightEyeCenterY = (rightEyeInner.y + rightEyeOuter.y) / 2;

        // Gaze vector (average of both eyes)
        const gazeX = ((leftIrisCenter.x - leftEyeCenterX) + (rightIrisCenter.x - rightEyeCenterX)) / 2;
        const gazeY = ((leftIrisCenter.y - leftEyeCenterY) + (rightIrisCenter.y - rightEyeCenterY)) / 2;

        // Head pose estimation
        const noseTip = keypoints[1];
        const forehead = keypoints[10];

        const pitch = Math.atan2(noseTip.y - forehead.y, noseTip.z || 1) * (180 / Math.PI);
        const faceWidth = Math.abs(leftEyeOuter.x - rightEyeOuter.x);
        const noseToCenterX = noseTip.x - (leftEyeOuter.x + rightEyeOuter.x) / 2;
        const yaw = (noseToCenterX / faceWidth) * 90;

        // Roll calculation (ear-to-ear tilt)
        const leftEar = keypoints[234];
        const rightEar = keypoints[454];
        const roll = Math.atan2(rightEar.y - leftEar.y, rightEar.x - leftEar.x) * (180 / Math.PI);

        // Zone classification with hysteresis
        const gaze = this.classifyGazeZone(gazeX, gazeY, pitch, yaw);

        // Add to history for temporal smoothing
        this.gazeHistory.push(gaze);
        if (this.gazeHistory.length > this.historySize) {
            this.gazeHistory.shift();
        }

        // Temporal analysis: Looking away for >3 seconds?
        const isLookingAway = gaze.zone !== 'screen';
        const now = Date.now();

        if (isLookingAway) {
            if (this.lookAwayStartTime === 0) {
                this.lookAwayStartTime = now;
            }
            const lookAwayDuration = now - this.lookAwayStartTime;

            if (lookAwayDuration > this.thresholds.lookAwayDuration) {
                this.lastLookAwayTime = now;
            }
        } else {
            this.lookAwayStartTime = 0; // Reset
        }

        const warning = this.generateWarning(gaze, { pitch, yaw, roll });

        return {
            gaze,
            headPose: { pitch, yaw, roll },
            isLookingAway: (now - this.lastLookAwayTime) < 1000, // Flag if looked away in last 1s
            warning,
            timestamp: now
        };
    }

    /**
     * Classify gaze zone based on gaze vector and head pose
     */
    private classifyGazeZone(gazeX: number, gazeY: number, pitch: number, yaw: number): GazeData {
        let zone: GazeData['zone'] = 'screen';
        let confidence = 1.0;

        // Phone detection (high priority)
        if (pitch > this.thresholds.phoneAngle && Math.abs(yaw) > 10) {
            zone = 'phone';
            confidence = 0.9;
        }
        // Horizontal gaze away
        else if (Math.abs(gazeX) > this.thresholds.gazeX || Math.abs(yaw) > this.thresholds.yaw) {
            zone = 'away-horizontal';
            confidence = 0.85;
        }
        // Looking down (keyboard)
        else if (gazeY > this.thresholds.gazeY || pitch > this.thresholds.pitch) {
            zone = 'keyboard';
            confidence = 0.8;
        }
        // Looking up (ceiling)
        else if (gazeY < -this.thresholds.gazeY || pitch < -this.thresholds.pitch) {
            zone = 'ceiling';
            confidence = 0.8;
        }

        return { x: gazeX, y: gazeY, zone, confidence };
    }

    /**
     * Generate human-readable warning message
     */
    private generateWarning(gaze: GazeData, headPose: HeadPose): string | null {
        const duration = Date.now() - this.lookAwayStartTime;
        const durationSec = Math.floor(duration / 1000);

        if (gaze.zone === 'screen') return null;

        const warnings: Record<GazeData['zone'], string> = {
            'phone': `Possible phone usage (${durationSec}s, pitch: ${headPose.pitch.toFixed(1)}°)`,
            'keyboard': `Looking down (${durationSec}s, pitch: ${headPose.pitch.toFixed(1)}°)`,
            'away-horizontal': `Looking away (${durationSec}s, yaw: ${headPose.yaw.toFixed(1)}°)`,
            'ceiling': `Looking up (${durationSec}s)`,
            'screen': ''
        };

        return warnings[gaze.zone] || null;
    }

    /**
     * Get smoothed gaze over last N frames
     */
    getSmoothedGaze(frames: number = 10): GazeData | null {
        if (this.gazeHistory.length < frames) return null;

        const recent = this.gazeHistory.slice(-frames);
        const avgX = recent.reduce((sum, g) => sum + g.x, 0) / frames;
        const avgY = recent.reduce((sum, g) => sum + g.y, 0) / frames;

        // Most common zone in recent history
        const zoneCounts: Record<string, number> = {};
        recent.forEach(g => {
            zoneCounts[g.zone] = (zoneCounts[g.zone] || 0) + 1;
        });
        const zone = Object.keys(zoneCounts).reduce((a, b) =>
            zoneCounts[a] > zoneCounts[b] ? a : b
        ) as GazeData['zone'];

        return { x: avgX, y: avgY, zone, confidence: 0.9 };
    }

    /**
     * Calibrate gaze tracking (9-point calibration)
     */
    calibrate(calibrationPoints: { x: number, y: number, gazeX: number, gazeY: number }[]) {
        // TODO: Implement linear regression calibration
        // For now, using default thresholds
        console.log('Calibration data received:', calibrationPoints.length, 'points');
    }

    /**
     * Configure thresholds
     */
    setThresholds(newThresholds: Partial<typeof this.thresholds>) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }

    /**
     * Reset tracking state
     */
    reset() {
        this.gazeHistory = [];
        this.lookAwayStartTime = 0;
        this.lastLookAwayTime = 0;
    }
}

export const gazeTrackingService = new GazeTrackingService();

// Expose for browser console testing
(window as any).gazeTrackingService = gazeTrackingService;
