import React, { useEffect, useState } from 'react';
import { websocketService } from '../services/websocketService';
import { AlertTriangle, CheckCircle, User } from 'lucide-react';

interface ProctorStreamProps {
    examId: string;
}

interface StudentStatus {
    studentId: string;
    name: string; // In a real app, we'd fetch this
    status: 'active' | 'disconnected' | 'flagged';
    lastWarning?: string;
    lastUpdate: number;
}

export const ProctorStream: React.FC<ProctorStreamProps> = ({ examId }) => {
    const [students, setStudents] = useState<Map<string, StudentStatus>>(new Map());

    useEffect(() => {
        // Subscribe to updates
        websocketService.subscribeToExamMonitoring(examId, (update) => {
            setStudents(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(update.studentId) || {
                    studentId: update.studentId,
                    name: `Student ${update.studentId.substring(0, 4)}`, // Placeholder
                    status: 'active',
                    lastUpdate: Date.now()
                };

                existing.lastUpdate = Date.now();
                existing.status = 'active';
                newMap.set(update.studentId, existing);
                return newMap;
            });
        });

        websocketService.subscribeToCheatWarnings(examId, (warningUpdate) => {
            // We need studentId in warning update, assuming it's there or we can derive it
            // For now, let's assume the backend sends studentId in the warning wrapper
            // But the interface CheatWarningUpdate only has attemptId. 
            // We might need to fetch attempt details to get studentId, or update the backend to send studentId.
            // For this demo, we'll ignore mapping to specific student if ID is missing, 
            // but ideally we update the backend.

            console.log("Cheat Warning Received:", warningUpdate);
        });

        return () => {
            // Cleanup subscriptions if method exists
        };
    }, [examId]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Live Proctoring
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(students.values()).map(student => (
                    <div key={student.studentId} className={`p-4 rounded-lg border ${student.status === 'flagged' ? 'border-red-300 bg-red-50' :
                        student.status === 'disconnected' ? 'border-gray-300 bg-gray-50' :
                            'border-green-300 bg-green-50'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{student.name}</span>
                            {student.status === 'flagged' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            {student.status === 'active' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>

                        <div className="text-xs text-gray-500">
                            ID: {student.studentId}
                        </div>

                        {student.lastWarning && (
                            <div className="mt-2 text-xs text-red-600 bg-red-100 p-1 rounded">
                                {student.lastWarning}
                            </div>
                        )}
                    </div>
                ))}

                {students.size === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                        Waiting for students to join...
                    </div>
                )}
            </div>
        </div>
    );
};
