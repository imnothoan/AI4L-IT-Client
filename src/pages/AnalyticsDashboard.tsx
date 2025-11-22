import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { analyticsService, ExamStatistics } from '@/services/analyticsService';
import { firebaseService } from '@/services/firebaseService';
import { ExamAttempt, Exam } from '@/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Analytics Dashboard
 * Advanced analytics and reporting for instructors
 */

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { currentUser, exams } = useStore();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examStats, setExamStats] = useState<ExamStatistics | null>(null);
  const [allAttempts, setAllAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'instructor') {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (selectedExam) {
      loadExamAnalytics();
    }
  }, [selectedExam]);

  const loadExamAnalytics = async () => {
    if (!selectedExam) return;

    setLoading(true);
    try {
      const attempts = await firebaseService.getAttemptsByExam(selectedExam.id);
      setAllAttempts(attempts);

      const stats = analyticsService.calculateExamStatistics(selectedExam, attempts);
      setExamStats(stats);

      const trends = analyticsService.generateTrendData(attempts, 30);
      setTrendData(trends);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!examStats) return;

    const data = [
      {
        Metric: 'Total Attempts',
        Value: examStats.totalAttempts,
      },
      {
        Metric: 'Completed',
        Value: examStats.completedAttempts,
      },
      {
        Metric: 'Average Score',
        Value: examStats.averageScore.toFixed(2),
      },
      {
        Metric: 'Highest Score',
        Value: examStats.highestScore,
      },
      {
        Metric: 'Lowest Score',
        Value: examStats.lowestScore,
      },
      {
        Metric: 'Pass Rate (%)',
        Value: examStats.passRate.toFixed(2),
      },
      {
        Metric: 'Avg. Completion Time (min)',
        Value: examStats.averageCompletionTime.toFixed(2),
      },
    ];

    const csv = analyticsService.exportToCSV(data, ['Metric', 'Value']);
    analyticsService.downloadCSV(csv, `exam-${selectedExam?.id}-analytics.csv`);
  };

  const getScoreDistribution = () => {
    if (!allAttempts.length) return [];

    const ranges = [
      { name: '0-20', min: 0, max: 20, count: 0 },
      { name: '21-40', min: 21, max: 40, count: 0 },
      { name: '41-60', min: 41, max: 60, count: 0 },
      { name: '61-80', min: 61, max: 80, count: 0 },
      { name: '81-100', min: 81, max: 100, count: 0 },
    ];

    allAttempts
      .filter(a => a.score !== undefined)
      .forEach(attempt => {
        const score = attempt.score!;
        const range = ranges.find(r => score >= r.min && score <= r.max);
        if (range) range.count++;
      });

    return ranges;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📈 Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Advanced analytics and reporting
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportReport}
                disabled={!examStats}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📥 Export Report
              </button>
              <button
                onClick={() => navigate('/instructor')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Exam
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading analytics...</p>
          </div>
        ) : examStats ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {examStats.totalAttempts}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {examStats.completedAttempts} completed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {examStats.averageScore.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  out of 100
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {examStats.passRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ≥60% passing
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {examStats.averageCompletionTime.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  minutes
                </p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Score Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Score Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getScoreDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance Trend (30 Days)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke="#10B981" 
                      name="Avg Score"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Question Analysis */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Question Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correct Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examStats.questionAnalysis.map((qa, index) => (
                      <tr key={qa.questionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                            {index + 1}. {qa.question}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {qa.topic}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  qa.difficulty < 0.3 ? 'bg-green-500' :
                                  qa.difficulty < 0.7 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${qa.difficulty * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {(qa.difficulty * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            qa.correctRate >= 70 ? 'text-green-600' :
                            qa.correctRate >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {qa.correctRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {qa.totalAttempts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Score Range Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Highest Score</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {examStats.highestScore}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {examStats.averageScore.toFixed(1)}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Lowest Score</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {examStats.lowestScore}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : selectedExam ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900">No data available</p>
            <p className="text-sm text-gray-500 mt-1">
              Students haven't started taking this exam yet
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
