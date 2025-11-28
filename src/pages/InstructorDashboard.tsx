import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import {
  UserTeacherIcon, BuildingIcon, FileTextIcon, ChartBarIcon, ActivityIcon,
  ZapIcon, PlusCircleIcon, EyeIcon, LibraryIcon, VideoIcon
} from '@/components/icons/AcademicIcons';
import { Plus, BookOpen, Cloud, School, FileText, Video, Check, RefreshCw } from 'lucide-react';

const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, classes, exams, examAttempts, createClass, loadClassesByInstructor, loadExamsByInstructor, loadInstructorAttempts, isLoading } = useStore();
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load classes, exams, and attempts on mount
  React.useEffect(() => {
    if (currentUser) {
      loadClassesByInstructor(currentUser.id);
      loadExamsByInstructor(currentUser.id);
      loadInstructorAttempts();
    }
  }, [currentUser, loadClassesByInstructor, loadExamsByInstructor, loadInstructorAttempts]);

  const handleRefreshClasses = async () => {
    if (currentUser) {
      setIsRefreshing(true);
      await loadClassesByInstructor(currentUser.id);
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateClass = async () => {
    if (!currentUser || !className) return;
    setCreateError(null);

    try {
      await createClass({
        name: className,
        description: classDescription,
        instructorId: currentUser.id,
        students: [],
        exams: [],
      });
      setShowCreateClass(false);
      setClassName('');
      setClassDescription('');
      setCreateError(null);
      // Refresh list after creation
      await loadClassesByInstructor(currentUser.id);
    } catch (error: any) {
      console.error('Error creating class:', error);
      setCreateError(error.message || 'Không thể tạo lớp học. Vui lòng thử lại.');
    }
  };

  const instructorExams = exams.filter(exam => exam.instructorId === currentUser?.id);
  // Use classes directly from store as they should be loaded for this instructor
  const instructorClasses = classes;

  // Calculate statistics
  const totalStudents = instructorClasses.reduce((sum, cls) => sum + cls.students.length, 0);
  const totalExams = instructorExams.length;
  const totalAttempts = examAttempts.filter(attempt =>
    instructorExams.some(exam => exam.id === attempt.examId)
  ).length;
  const activeExams = examAttempts.filter(attempt =>
    attempt.status === 'in-progress' &&
    instructorExams.some(exam => exam.id === attempt.examId)
  ).length;

  // Fetch AI status on mount
  // React.useEffect(() => {
  //   useStore.getState().loadAnticheatStatus();
  // }, []);

  // const { anticheatStatus } = useStore();
  const activeAIModels = 0; // anticheatStatus?.models ? Object.keys(anticheatStatus.models).length : 0;

  return (
    <div className="min-h-screen bg-academic-50">
      {/* Academic Header */}
      <header className="bg-white border-b border-academic-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-academic-900 text-white w-12 h-12 rounded-lg flex items-center justify-center">
                <UserTeacherIcon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-academic-900">
                  Bảng Điều Khiển Giảng Viên
                </h1>
                <p className="text-academic-600 text-sm mt-0.5">Xin chào, {currentUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="academic-button-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Tài Khoản
              </button>
              <button
                onClick={() => navigate('/guide')}
                className="academic-button-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Trợ Giúp
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-academic-900 text-white rounded-lg hover:bg-academic-800 font-medium transition"
              >
                Đăng Xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {/* Total Classes */}
          <div className="academic-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-academic-100 rounded-lg">
                <BuildingIcon className="text-academic-700" size={20} />
              </div>
              <div className="text-academic-400 text-sm">Lớp Học</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-academic-900">{instructorClasses.length}</p>
              <p className="text-academic-600 text-sm">{totalStudents} sinh viên</p>
            </div>
          </div>

          {/* Total Exams */}
          <div className="academic-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-academic-100 rounded-lg">
                <FileTextIcon className="text-academic-700" size={20} />
              </div>
              <div className="text-academic-400 text-sm">Đề Thi</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-academic-900">{totalExams}</p>
              <p className="text-academic-600 text-sm">Đã tạo</p>
            </div>
          </div>

          {/* Total Attempts */}
          <div className="academic-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-academic-100 rounded-lg">
                <ChartBarIcon className="text-academic-700" size={20} />
              </div>
              <div className="text-academic-400 text-sm">Lượt Thi</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-academic-900">{totalAttempts}</p>
              <p className="text-academic-600 text-sm">Tổng số</p>
            </div>
          </div>

          {/* Active Now */}
          <div className="academic-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ActivityIcon className="text-red-600" size={20} />
              </div>
              <div className="text-academic-400 text-sm">Đang Thi</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-academic-900">{activeExams}</p>
              <p className="text-academic-600 text-sm">Đang hoạt động</p>
            </div>
          </div>

          {/* AI Models Status (NEW) */}
          <div className="academic-card p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Video className="text-green-600" size={20} />
              </div>
              <div className="text-academic-400 text-sm">AI Anticheat</div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-academic-900">{activeAIModels}</p>
              <p className="text-green-600 text-sm font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Operational
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-academic-900 flex items-center gap-2">
              <ZapIcon className="text-academic-700" size={20} />
              Hành Động Nhanh
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <button
              onClick={() => navigate('/instructor/exam/create')}
              className="academic-card-hover p-5 text-left"
            >
              <div className="p-3 bg-academic-100 rounded-lg inline-flex mb-3">
                <PlusCircleIcon className="text-academic-700" size={24} />
              </div>
              <h3 className="text-base font-semibold text-academic-900 mb-2">Tạo Đề Thi</h3>
              <p className="text-academic-600 text-sm">
                Tạo bài kiểm tra mới với AI hoặc thủ công
              </p>
            </button>

            <button
              onClick={() => navigate('/instructor/question-bank')}
              className="academic-card-hover p-5 text-left"
            >
              <div className="p-3 bg-academic-100 rounded-lg inline-flex mb-3">
                <LibraryIcon className="text-academic-700" size={24} />
              </div>
              <h3 className="text-base font-semibold text-academic-900 mb-2">Ngân Hàng Câu Hỏi</h3>
              <p className="text-academic-600 text-sm">
                Quản lý và tổ chức kho câu hỏi của bạn
              </p>
            </button>

            <button
              onClick={() => navigate('/instructor/monitoring')}
              className="academic-card-hover p-5 text-left"
            >
              <div className="p-3 bg-academic-100 rounded-lg inline-flex mb-3">
                <EyeIcon className="text-academic-700" size={24} />
              </div>
              <h3 className="text-base font-semibold text-academic-900 mb-2">Giám Sát</h3>
              <p className="text-academic-600 text-sm">
                Theo dõi bài thi trực tiếp và phát hiện gian lận
              </p>
            </button>

            <button
              onClick={() => navigate('/instructor/analytics')}
              className="academic-card-hover p-5 text-left"
            >
              <div className="p-3 bg-academic-100 rounded-lg inline-flex mb-3">
                <ChartBarIcon className="text-academic-700" size={24} />
              </div>
              <h3 className="text-base font-semibold text-academic-900 mb-2">Phân Tích</h3>
              <p className="text-academic-600 text-sm">
                Xem báo cáo và thống kê chi tiết
              </p>
            </button>
          </div>
        </section>

        {/* Secondary Actions */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setShowCreateClass(true)}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 text-left transform transition hover:scale-105 hover:border-indigo-500"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Tạo Lớp Học</h3>
                  <p className="text-sm text-gray-600">Thiết lập lớp học mới cho sinh viên</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/guide')}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 text-left transform transition hover:scale-105 hover:border-yellow-500"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Hướng Dẫn</h3>
                  <p className="text-sm text-gray-600">Tìm hiểu các tính năng của hệ thống</p>
                </div>
              </div>
            </button>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl shadow-lg border-2 border-green-200 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 text-white w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cloud className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Trạng Thái</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">Đồng bộ đám mây</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Classes Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white w-10 h-10 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </span>
              Lớp Học Của Tôi
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshClasses}
                disabled={isRefreshing || isLoading}
                className={`p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition ${isRefreshing ? 'animate-spin' : ''}`}
                title="Làm mới danh sách"
              >
                <RefreshCw size={20} />
              </button>
              {instructorClasses.length > 0 && (
                <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {instructorClasses.length} lớp
                </span>
              )}
            </div>
          </div>

          {instructorClasses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-100 p-4 rounded-full">
                  <School className="w-16 h-16 text-purple-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có lớp học</h3>
              <p className="text-gray-600 mb-6">
                Tạo lớp học đầu tiên để bắt đầu quản lý sinh viên và đề thi
              </p>
              <button
                onClick={() => setShowCreateClass(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" /> Tạo Lớp Học Ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transform transition hover:scale-105 hover:shadow-2xl cursor-pointer"
                  onClick={() => navigate(`/instructor/class/${cls.id}`)}
                >
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-5 text-white">
                    <h3 className="text-xl font-bold mb-2">
                      {cls.name}
                    </h3>
                    <p className="text-purple-100 text-sm line-clamp-2">
                      {cls.description}
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="font-semibold text-gray-900">{cls.students.length}</span>
                        <span>SV</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-gray-900">{cls.exams.length}</span>
                        <span>Thi</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Exams Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white w-10 h-10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </span>
              Đề Thi Của Tôi
            </h2>
            {instructorExams.length > 0 && (
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                {instructorExams.length} đề thi
              </span>
            )}
          </div>

          {instructorExams.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <FileText className="w-16 h-16 text-blue-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đề thi</h3>
              <p className="text-gray-600 mb-6">
                Tạo đề thi đầu tiên để bắt đầu đánh giá sinh viên
              </p>
              <button
                onClick={() => navigate('/instructor/exam/create')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" /> Tạo Đề Thi Ngay
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tiêu Đề</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Số Câu Hỏi</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thời Gian</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">CAT</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Anti-Cheat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {instructorExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{exam.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{exam.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-semibold">{exam.questions.length}</span>
                          <span className="text-gray-500 text-sm ml-1">câu</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-semibold">{exam.duration}</span>
                          <span className="text-gray-500 text-sm ml-1">phút</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${exam.isAdaptive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {exam.isAdaptive ? <><Check className="w-3 h-3 inline mr-1" /> Có</> : 'Không'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${exam.antiCheatEnabled ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {exam.antiCheatEnabled ? <><Video className="w-3 h-3 inline mr-1" /> Có</> : 'Không'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4" onClick={() => setShowCreateClass(false)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus className="w-8 h-8" />
                Tạo Lớp Học Mới
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {createError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên Lớp Học
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
                  placeholder="Ví dụ: Toán Cao Cấp A1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô Tả
                </label>
                <textarea
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition resize-none"
                  rows={4}
                  placeholder="Mô tả ngắn về lớp học này..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateClass}
                  disabled={!className}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 shadow-lg transition transform hover:scale-105 disabled:transform-none"
                >
                  Tạo Lớp
                </button>
                <button
                  onClick={() => {
                    setShowCreateClass(false);
                    setClassName('');
                    setClassDescription('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-600 text-sm">
          <p>Nền Tảng Khảo Thí Thông Minh © 2024 - Dành cho Giảng Viên</p>
        </div>
      </footer>
    </div>
  );
};

export default InstructorDashboard;
