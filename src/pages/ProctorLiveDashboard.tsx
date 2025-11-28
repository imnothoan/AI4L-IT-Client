import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { apiClient } from '../services/apiClient';

interface StudentSession {
    id: string;
    studentName: string;
    examTitle: string;
    currentTheta: number;
    standardError: number;
    questionsAnswered: number;
    cheatWarnings: number;
    webcamStatus: 'active' | 'inactive' | 'blocked';
    screenStatus: 'normal' | 'tab-switch' | 'fullscreen-exit';
    startedAt: string;
    lastActivity: string;
}

interface CheatEvent {
    studentId: string;
    studentName: string;
    type: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
}

export const ProctorLiveDashboard: React.FC = () => {
    const [activeSessions, setActiveSessions] = useState<StudentSession[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<CheatEvent[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'flagged'>('all');
    const [sortBy, setSortBy] = useState<'theta' | 'warnings' | 'time'>('warnings');

    useEffect(() => {
        // WebSocket connection for real-time updates
        const ws = new WebSocket(`ws://localhost:3001/ws`);

        ws.onopen = () => {
            console.log('Proctor dashboard connected');
            ws.send(JSON.stringify({ type: 'subscribe_proctor', role: 'instructor' }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'session_update':
                    setActiveSessions(prev => {
                        const index = prev.findIndex(s => s.id === data.session.id);
                        if (index >= 0) {
                            const updated = [...prev];
                            updated[index] = data.session;
                            return updated;
                        }
                        return [...prev, data.session];
                    });
                    break;

                case 'cheat_warning':
                    setRecentAlerts(prev => [data.alert, ...prev].slice(0, 50));
                    // Update session warning count
                    setActiveSessions(prev => prev.map(s =>
                        s.id === data.alert.studentId
                            ? { ...s, cheatWarnings: s.cheatWarnings + 1 }
                            : s
                    ));
                    break;

                case 'session_ended':
                    setActiveSessions(prev => prev.filter(s => s.id !== data.sessionId));
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Cleanup
        return () => {
            ws.close();
        };
    }, []);

    // Fetch initial sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const sessions = await apiClient.getAllActiveSessions();
                setActiveSessions(sessions);
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            }
        };

        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const filteredSessions = activeSessions
        .filter(s => filterStatus === 'all' || s.cheatWarnings > 0)
        .sort((a, b) => {
            switch (sortBy) {
                case 'theta':
                    return b.currentTheta - a.currentTheta;
                case 'warnings':
                    return b.cheatWarnings - a.cheatWarnings;
                case 'time':
                    return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
                default:
                    return 0;
            }
        });

    const getThetaColor = (theta: number): string => {
        if (theta < -1) return 'text-red-600 bg-red-100';
        if (theta < 0.5) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Proctoring Dashboard</h1>
                <p className="text-gray-600">
                    Monitoring {activeSessions.length} active exam sessions in real-time
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Active Sessions</div>
                    <div className="text-2xl font-bold text-blue-600">{activeSessions.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Alerts (24h)</div>
                    <div className="text-2xl font-bold text-yellow-600">{recentAlerts.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Flagged Students</div>
                    <div className="text-2xl font-bold text-red-600">
                        {activeSessions.filter(s => s.cheatWarnings > 2).length}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 mb-1">Avg Theta</div>
                    <div className="text-2xl font-bold text-green-600">
                        {(activeSessions.reduce((sum, s) => sum + s.currentTheta, 0) / activeSessions.length || 0).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-4 items-center">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="all">All Students</option>
                            <option value="flagged">Flagged Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="warnings">Warnings (High to Low)</option>
                            <option value="theta">Ability (High to Low)</option>
                            <option value="time">Start Time (Oldest First)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {filteredSessions.map(session => (
                    <div
                        key={session.id}
                        className={`bg-white rounded-lg shadow p-4 border-l-4 ${session.cheatWarnings > 3 ? 'border-red-500' :
                            session.cheatWarnings > 0 ? 'border-yellow-500' : 'border-green-500'
                            }`}
                    >
                        {/* Student Info */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{session.studentName}</h3>
                                <p className="text-sm text-gray-600">{session.examTitle}</p>
                            </div>
                            {session.cheatWarnings > 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                    {session.cheatWarnings} ⚠️
                                </span>
                            )}
                        </div>

                        {/* Theta Display */}
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getThetaColor(session.currentTheta)}`}>
                            θ = {session.currentTheta.toFixed(2)} ± {session.standardError.toFixed(2)}
                        </div>

                        {/* Progress */}
                        <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{session.questionsAnswered} questions</span>
                                <span>SE: {session.standardError.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(session.questionsAnswered / 20) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex gap-2 text-xs">
                            <span className={`px-2 py-1 rounded ${session.webcamStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                📹 {session.webcamStatus}
                            </span>
                            <span className={`px-2 py-1 rounded ${session.screenStatus === 'normal' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                🖥️ {session.screenStatus}
                            </span>
                        </div>

                        {/* Last Activity */}
                        <div className="mt-3 text-xs text-gray-500">
                            Last activity: {new Date(session.lastActivity).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Alerts Panel */}
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentAlerts.slice(0, 20).map((alert, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded border-l-4"
                            style={{ borderColor: getSeverityColor(alert.severity) }}
                        >
                            <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                            <div className="flex-1">
                                <span className="font-medium text-gray-900">{alert.studentName}</span>
                                <span className="text-gray-600"> - {alert.type}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
