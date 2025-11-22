import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { websocketService, MonitoringUpdate, CheatWarningUpdate } from '@/services/websocketService';
import { ExamAttempt, Exam } from '@/types';
import { ActivityIcon } from '@/components/icons/AcademicIcons';

/**
 * Real-time Monitoring Dashboard with WebSocket Integration
 * Allows instructors to monitor exam sessions in real-time
 */

export default function MonitoringDashboard() {
  const navigate = useNavigate();
  const { currentUser, exams, loadAttemptsByExam } = useStore();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [liveAttempts, setLiveAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'instructor') {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Handle monitoring updates via WebSocket
  const handleMonitoringUpdate = useCallback((update: MonitoringUpdate) => {
    setLiveAttempts(prev => {
      const existing = prev.find(a => a.id === update.attemptId);
      if (existing) {
        return prev.map(a => 
          a.id === update.attemptId 
            ? { ...a, currentQuestion: update.currentQuestion, progress: update.progress }
            : a
        );
      }
      return prev;
    });
  }, []);

  // Handle cheat warnings via WebSocket
  const handleCheatWarning = useCallback((warning: CheatWarningUpdate) => {
    // Update the attempt with the new warning
    setLiveAttempts(prev => {
      return prev.map(a => {
        if (a.id === warning.attemptId) {
          return {
            ...a,
            warnings: [...(a.warnings || []), warning.warning]
          };
        }
        return a;
      });
    });
  }, []);

  // Connect/disconnect WebSocket when exam is selected
  useEffect(() => {
    if (!selectedExam) {
      websocketService.disconnect();
      setIsConnected(false);
      return;
    }

    setLoading(true);
    
    // Load initial attempts from API
    loadAttemptsByExam(selectedExam.id).then(() => {
      setLoading(false);
    });

    // Connect WebSocket for real-time updates
    websocketService.connect(selectedExam.id);
    
    // Subscribe to events
    websocketService.on('connected', () => {
      setIsConnected(true);
      console.log('WebSocket connected to exam monitoring');
    });
    
    websocketService.on('disconnected', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });
    
    websocketService.subscribeToExamMonitoring(selectedExam.id, handleMonitoringUpdate);
    websocketService.subscribeToCheatWarnings(selectedExam.id, handleCheatWarning);

    return () => {
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [selectedExam, loadAttemptsByExam, handleMonitoringUpdate, handleCheatWarning]);

  // Sync attempts from store
  useEffect(() => {
    if (selectedExam) {
      const { examAttempts } = useStore.getState();
      const filteredAttempts = examAttempts.filter(
        a => a.examId === selectedExam.id && a.status === 'in-progress'
      );
      setLiveAttempts(filteredAttempts);
    }
  }, [selectedExam]);

  const getWarningBadge = (warningCount: number) => {
    if (warningCount === 0) return 'bg-green-100 text-green-800';
    if (warningCount < 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ActivityIcon className="text-academic-700" size={28} />
                Real-time Monitoring Dashboard
                {selectedExam && (
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-normal text-gray-500">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor exam sessions and student activity in real-time via WebSocket
              </p>
            </div>
            <button
              onClick={() => navigate('/instructor')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Exam to Monitor
          </h2>
          <select
            value={selectedExam?.id || ''}
            onChange={(e) => {
              const exam = exams.find(ex => ex.id === e.target.value);
              setSelectedExam(exam || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose an exam...</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>

        {selectedExam && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {liveAttempts.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">With Warnings</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {liveAttempts.filter(a => a.warnings.length > 0).length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Flagged</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {liveAttempts.filter(a => a.status === 'flagged').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {liveAttempts.length > 0
                        ? Math.round((liveAttempts.reduce((sum, a) => 
                            sum + Object.keys(a.answers).length, 0) / 
                            liveAttempts.length / (selectedExam.questions.length || 1)) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Sessions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Exam Sessions
                </h2>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-2">Loading sessions...</p>
                </div>
              ) : liveAttempts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg font-medium">No active sessions</p>
                  <p className="text-sm mt-1">Students will appear here when they start the exam</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Elapsed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Warnings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {liveAttempts.map(attempt => {
                        const progress = (Object.keys(attempt.answers).length / selectedExam.questions.length) * 100;
                        const elapsed = Math.floor((Date.now() - attempt.startTime.getTime()) / 1000 / 60);
                        
                        return (
                          <tr key={attempt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium">
                                    {attempt.studentId.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    Student {attempt.studentId.substring(0, 8)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {attempt.id.substring(0, 12)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                      <div>
                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                          {Math.round(progress)}%
                                        </span>
                                      </div>
                                    </div>
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                                      <div
                                        style={{ width: `${progress}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {elapsed} min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWarningBadge(attempt.warnings.length)}`}>
                                {attempt.warnings.length} {attempt.warnings.length === 1 ? 'warning' : 'warnings'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                attempt.status === 'flagged' 
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {attempt.status === 'flagged' ? '🚩 Flagged' : '✓ Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
