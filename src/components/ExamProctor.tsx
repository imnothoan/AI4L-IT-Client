import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { antiCheatService } from '../services/antiCheatService';
import { websocketService } from '../services/websocketService';
import { AlertTriangle, Eye, Smartphone, Users } from 'lucide-react';
import { CheatWarning } from '@/types';

interface ExamProctorProps {
    examId: string;
    attemptId: string;
    onCheatWarning?: (warning: CheatWarning) => void;
}

export const ExamProctor: React.FC<ExamProctorProps> = ({ examId, attemptId, onCheatWarning }) => {
    const webcamRef = useRef<Webcam>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [lastWarningTime, setLastWarningTime] = useState(0);

    useEffect(() => {
        const init = async () => {
            await antiCheatService.initialize();
            setIsMonitoring(true);

            // Ensure WebSocket is connected for this exam
            if (!websocketService.getConnectionStatus()) {
                websocketService.connect(examId);
            }
        };
        init();

        return () => {
            antiCheatService.dispose();
        };
    }, [examId]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (isMonitoring) {
            intervalId = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                    const video = webcamRef.current.video;

                    // Run Anti-Cheat Analysis
                    const warning = await antiCheatService.analyzeFrame(video, attemptId);

                    if (warning) {
                        setWarnings(prev => [warning.message || warning.type, ...prev].slice(0, 3));

                        // Notify Parent
                        if (onCheatWarning) {
                            onCheatWarning(warning);
                        }

                        // Report to Server (Throttle: max 1 warning per 5 seconds)
                        if (Date.now() - lastWarningTime > 5000) {
                            websocketService.reportCheatWarning({
                                attemptId,
                                warning
                            });
                            setLastWarningTime(Date.now());
                        }
                    } else {
                        // Clear warnings if safe (optional, or keep history)
                        // setWarnings([]); 
                    }
                }
            }, 1000); // Check every second
        }

        return () => clearInterval(intervalId);
    }, [isMonitoring, attemptId, lastWarningTime, onCheatWarning]);

    // Tab Switching & Fullscreen Detection
    useEffect(() => {
        if (!isMonitoring) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const warningMsg = 'Tab switch detected';
                setWarnings(prev => [warningMsg, ...prev]);

                const warning: CheatWarning = {
                    id: crypto.randomUUID(),
                    attemptId,
                    type: 'tab-switch',
                    severity: 'high',
                    message: warningMsg,
                    timestamp: new Date()
                };

                if (onCheatWarning) onCheatWarning(warning);
                websocketService.reportCheatWarning({ attemptId, warning });
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                const warningMsg = 'Exited fullscreen mode';
                setWarnings(prev => [warningMsg, ...prev]);

                const warning: CheatWarning = {
                    id: crypto.randomUUID(),
                    attemptId,
                    type: 'fullscreen-exit',
                    severity: 'high',
                    message: warningMsg,
                    timestamp: new Date()
                };

                if (onCheatWarning) onCheatWarning(warning);
                websocketService.reportCheatWarning({ attemptId, warning });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isMonitoring, attemptId, onCheatWarning]);

    const enterFullscreen = () => {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    };

    return (
        <>
            {/* Fullscreen Enforcement Modal */}
            {isMonitoring && !document.fullscreenElement && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white p-8 text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold mb-2">CẢNH BÁO VI PHẠM</h2>
                    <p className="text-xl mb-8 max-w-md">
                        Bạn đã thoát khỏi chế độ toàn màn hình. Vui lòng quay lại ngay lập tức để tiếp tục bài thi.
                    </p>
                    <button
                        onClick={enterFullscreen}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 shadow-lg flex items-center gap-3"
                    >
                        <Users className="w-6 h-6" />
                        QUAY LẠI BÀI THI
                    </button>
                </div>
            )}

            <div className="fixed bottom-4 right-4 w-64 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 z-50">
                <div className="bg-gray-900 text-white px-3 py-2 text-sm font-medium flex justify-between items-center">
                    <span>AI Proctor Active</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>

                <div className="relative h-48 bg-black">
                    <Webcam
                        ref={webcamRef}
                        audio={false}
                        className="w-full h-full object-cover"
                        screenshotFormat="image/jpeg"
                    />

                    {/* Warning Overlay */}
                    {warnings.length > 0 && (
                        <div className="absolute inset-0 bg-red-500/50 flex flex-col items-center justify-center text-white p-2 text-center animate-pulse">
                            <AlertTriangle className="w-8 h-8 mb-2" />
                            <p className="text-xs font-bold">{warnings[0]}</p>
                        </div>
                    )}
                </div>

                <div className="p-2 bg-gray-50 text-xs text-gray-500">
                    <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-3 h-3" /> Gaze: {warnings.some(w => w.includes('look-away') || w.includes('phone')) ? '⚠️ Off-screen' : '✓ On-screen'}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-3 h-3" /> Face: {warnings.some(w => w.includes('multiple')) ? '⚠️ Multiple' : warnings.some(w => w.includes('no-face')) ? '⚠️ None' : '✓ Single'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-3 h-3" /> Objects: {warnings.some(w => w.includes('forbidden')) ? '⚠️ Detected' : '✓ Clear'}
                    </div>
                </div>
            </div>
        </>
    );
};
