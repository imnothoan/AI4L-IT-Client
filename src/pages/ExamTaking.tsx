import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ExamProctor } from '../components/ExamProctor';
// import { ThetaChart } from '../components/ThetaChart';
import CATAlgorithm from '../algorithms/CATAlgorithm';
// import { apiClient } from '../services/apiClient';
import { Question, CheatWarning } from '@/types';
import {
  FileTextIcon, ZapIcon, BookOpenIcon, ChartBarIcon, LightbulbIcon,
  AlertCircleIcon
} from '@/components/icons/AcademicIcons';
import { ClipboardList, AlertTriangle, Check, Keyboard, Rocket, Star } from 'lucide-react';

const ExamTaking: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const [theta, setTheta] = useState<number>(0);
  // const [standardError, setStandardError] = useState<number>(1.0);
  // const [thetaHistory, setThetaHistory] = useState<number[]>([]);
  // webcamRef and monitoringIntervalRef removed as they are handled in ExamProctor

  const { currentUser, exams, startExamAttempt, updateExamAttempt, submitExamAttempt } = useStore();

  const exam = exams.find(e => e.id === examId);
  const [attempt, setAttempt] = useState<any>(null);

  const [catAlgorithm] = useState(
    exam ? new CATAlgorithm(exam.questions, exam.isAdaptive ? 15 : exam.questions.length) : null
  );

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [warnings, setWarnings] = useState<CheatWarning[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(exam?.duration ? exam.duration * 60 : 0);
  // const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // New state for enhanced features
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Initialize exam attempt
  useEffect(() => {
    if (exam && currentUser && !attempt) {
      startExamAttempt(exam.id)
        .then(newAttempt => {
          setAttempt(newAttempt);
        })
        .catch(error => {
          console.error('Failed to start exam attempt:', error);
          alert('Không thể bắt đầu bài thi. Vui lòng thử lại.');
          navigate(-1);
        });
    }
  }, [exam, currentUser, attempt, startExamAttempt, navigate]);

  // Fullscreen management
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Prevent accidental tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (attempt && attempt.status === 'in-progress') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attempt]);

  useEffect(() => {
    // Initialize anti-cheat if enabled
    // Handled by ExamProctor component now

    // Load first question
    if (catAlgorithm && exam) {
      loadNextQuestion();
    }
  }, [attempt]);

  // Timer countdown
  useEffect(() => {
    if (!attempt) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt]);

  // Monitoring functions removed - handled by ExamProctor

  const loadNextQuestion = () => {
    if (!catAlgorithm || !exam) return;

    const nextQuestion = exam.isAdaptive
      ? catAlgorithm.getNextQuestion(askedQuestions)
      : exam.questions.find(q => !askedQuestions.includes(q.id));

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setAskedQuestions([...askedQuestions, nextQuestion.id]);
      setCurrentAnswer('');
      setQuestionStartTime(Date.now());
    } else {
      handleSubmitExam();
    }
  };

  const handleAnswerQuestion = () => {
    if (!currentQuestion || !attempt || !catAlgorithm) return;

    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const isCorrect = currentQuestion.type === 'multiple-choice'
      ? parseInt(currentAnswer) === currentQuestion.correctAnswer
      : false;

    const updatedAnswers = {
      ...attempt.answers,
      [currentQuestion.id]: currentAnswer,
    };

    setAutoSaveStatus('saving');
    updateExamAttempt(attempt.id, { answers: updatedAnswers }).then(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('unsaved'), 2000);
    });

    if (exam?.isAdaptive) {
      catAlgorithm.updateAbilityEstimate(
        { questionId: currentQuestion.id, correct: isCorrect, timeSpent },
        currentQuestion
      );

      if (catAlgorithm.shouldStop()) {
        handleSubmitExam();
        return;
      }
    }

    loadNextQuestion();
  };

  // Auto-save
  useEffect(() => {
    if (!attempt || !currentAnswer || !currentQuestion) return;

    const autoSaveTimer = setTimeout(() => {
      setAutoSaveStatus('saving');
      const updatedAnswers = {
        ...attempt.answers,
        [currentQuestion.id]: currentAnswer,
      };
      updateExamAttempt(attempt.id, { answers: updatedAnswers }).then(() => {
        setAutoSaveStatus('saved');
      });
    }, 5000);

    return () => clearTimeout(autoSaveTimer);
  }, [currentAnswer, attempt, currentQuestion, updateExamAttempt]);

  const toggleBookmark = useCallback(() => {
    if (!currentQuestion) return;
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  }, [currentQuestion]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b') {
          e.preventDefault();
          toggleBookmark();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleBookmark]);

  const handleSubmitExam = async () => {
    if (!attempt) return;

    // stopMonitoring(); // Handled by component unmount
    exitFullscreen();

    try {
      // Submit exam attempt with answers to server
      await submitExamAttempt(attempt.id, attempt.answers);
      navigate('/student');
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  if (!exam || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Đang tải bài thi...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} `;
  };

  const getTimeWarningColor = () => {
    if (timeRemaining < 300) return 'text-red-600 animate-pulse';
    if (timeRemaining < 600) return 'text-orange-600';
    return 'text-white';
  };

  // Instructions Modal Component
  const InstructionsModal = () => {
    if (!showInstructions) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ClipboardList className="w-10 h-10 text-blue-600" />
              Hướng Dẫn Làm Bài Thi
            </h2>

            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <FileTextIcon className="text-blue-600" size={18} />
                  Thông Tin Bài Thi
                </h3>
                <ul className="space-y-1 text-blue-800 text-sm">
                  <li>• Tên: <strong>{exam.title}</strong></li>
                  <li>• Số câu hỏi: <strong>{exam.isAdaptive ? '~15 câu (thích ứng)' : `${exam.questions.length} câu`}</strong></li>
                  <li>• Thời gian: <strong>{exam.duration} phút</strong></li>
                  <li>• Giám sát: <strong>{exam.antiCheatEnabled ? 'Có (Camera bắt buộc)' : 'Không'}</strong></li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" /> Lưu Ý Quan Trọng
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Bài thi sẽ tự động lưu câu trả lời của bạn mỗi 5 giây</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Bài thi sẽ chuyển sang chế độ toàn màn hình để tập trung</span>
                  </li>
                  {exam.antiCheatEnabled && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">!</span>
                      <span>Camera sẽ theo dõi - Luôn nhìn vào màn hình và tránh nhìn ra ngoài</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <ZapIcon className="text-yellow-600 flex-shrink-0" size={18} />
                    <span>Không tắt trang web - Bài thi sẽ bị hủy</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Keyboard className="w-5 h-5" /> Phím Tắt
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-100 p-3 rounded">
                    <kbd className="bg-white px-2 py-1 rounded border shadow-sm">Ctrl/⌘ + B</kbd>
                    <p className="text-gray-600 mt-1">Đánh dấu câu hỏi</p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded">
                    <kbd className="bg-white px-2 py-1 rounded border shadow-sm">ESC</kbd>
                    <p className="text-gray-600 mt-1">Thoát toàn màn hình</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setShowInstructions(false);
                  if (exam.antiCheatEnabled) {
                    enterFullscreen();
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold text-lg shadow-lg transition transform hover:scale-105"
              >
                <Rocket className="w-5 h-5 mr-2 inline" /> Bắt Đầu Làm Bài
              </button>
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn hủy bài thi?')) {
                    navigate('/student');
                  }
                }}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <InstructionsModal />

      <InstructionsModal />

      {/* AI Proctor Component */}
      {exam.antiCheatEnabled && attempt && (
        <ExamProctor examId={exam.id} attemptId={attempt.id} />
      )}

      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-academic-900 text-white w-12 h-12 rounded-lg flex items-center justify-center shadow-lg">
                <FileTextIcon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
                <p className="text-sm text-gray-500">
                  Câu {askedQuestions.length} / {exam.isAdaptive ? '~15' : exam.questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saved' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Đã lưu
                  </span>
                )}
                {autoSaveStatus === 'saving' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </span>
                )}
              </div>

              {/* Timer */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className={`text - xl font - bold ${getTimeWarningColor()} `}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="p-3 hover:bg-gray-100 rounded-xl transition"
                title={isFullscreen ? 'Thoát toàn màn hình (ESC)' : 'Toàn màn hình'}
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{
                  width: `${(askedQuestions.length / (exam.isAdaptive ? 15 : exam.questions.length)) * 100}% `
                }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Question Area */}
          <div className="flex-1">
            {currentQuestion ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Question Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-white/20 px-4 py-2 rounded-lg font-semibold">
                        Câu {askedQuestions.length}
                      </span>
                      <span className="bg-white/20 px-4 py-2 rounded-lg text-sm">
                        {currentQuestion.difficulty < 0.3 ? (
                          <><Star className="w-4 h-4 inline fill-yellow-400" /> Dễ</>
                        ) : currentQuestion.difficulty < 0.7 ? (
                          <><Star className="w-4 h-4 inline fill-orange-400" /> Trung bình</>
                        ) : (
                          <><Star className="w-4 h-4 inline fill-red-400" /> Khó</>
                        )}
                      </span>
                      {currentQuestion.topic && (
                        <span className="bg-white/20 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                          <BookOpenIcon className="text-white" size={16} />
                          {currentQuestion.topic}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={toggleBookmark}
                      className={`p - 2 rounded - lg transition flex - shrink - 0 ${bookmarkedQuestions.has(currentQuestion.id)
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-white/20 text-white hover:bg-white/30'
                        } `}
                      title="Đánh dấu câu hỏi (Ctrl/⌘ + B)"
                    >
                      <svg className="w-6 h-6" fill={bookmarkedQuestions.has(currentQuestion.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
                    {currentQuestion.question}
                  </h2>

                  {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
                    <div className="space-y-4">
                      {currentQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className={`group flex items - start p - 5 border - 2 rounded - xl cursor - pointer transition - all hover: shadow - md ${currentAnswer === String(index)
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            } `}
                        >
                          <div className="flex items-center h-6">
                            <input
                              type="radio"
                              name="answer"
                              value={index}
                              checked={currentAnswer === String(index)}
                              onChange={(e) => setCurrentAnswer(e.target.value)}
                              className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-4 flex-1">
                            <span className={`text - lg ${currentAnswer === String(index) ? 'text-blue-900 font-medium' : 'text-gray-700'
                              } `}>
                              {option}
                            </span>
                          </div>
                          <div className={`ml - 4 text - 2xl transition - opacity ${currentAnswer === String(index) ? 'opacity-100' : 'opacity-0'
                            } `}>
                            ✓
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none text-lg"
                        rows={10}
                        placeholder="Nhập câu trả lời của bạn ở đây..."
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tự luận - Bài làm của bạn sẽ được giảng viên chấm điểm</span>
                        <span>{currentAnswer.length} ký tự</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={handleAnswerQuestion}
                      disabled={!currentAnswer}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-lg transition transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                    >
                      {askedQuestions.length >= (exam.isAdaptive ? 15 : exam.questions.length)
                        ? '✓ Nộp Bài'
                        : 'Câu Tiếp Theo →'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl shadow-xl text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải câu hỏi...</p>
              </div>
            )}
          </div>

          {/* Sidebar - Only visible when not in fullscreen */}
          {!isFullscreen && (
            <div className="lg:w-80 space-y-6">
              {/* Camera Monitor - Replaced by ExamProctor Overlay */}
              {/* {exam.antiCheatEnabled && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                   ... (Legacy Camera UI removed) ...
                </div>
              )} */}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="bg-red-600 p-4 text-white">
                    <h3 className="font-bold flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      Cảnh Báo ({warnings.length})
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                    {warnings.slice(-5).reverse().map((warning) => (
                      <div key={warning.id} className="flex items-start gap-3 text-sm">
                        <div className="flex-shrink-0">
                          {(warning.type === 'look-away' || warning.type === 'multiple-faces' || warning.type === 'no-face') && (
                            <AlertCircleIcon className="text-red-600" size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">
                            {warning.type === 'look-away' && 'Phát hiện nhìn ra ngoài'}
                            {warning.type === 'multiple-faces' && 'Phát hiện nhiều người'}
                            {warning.type === 'no-face' && 'Không phát hiện khuôn mặt'}
                          </p>
                          <p className="text-xs text-red-600">
                            {new Date(warning.timestamp).toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {warnings.length >= 3 && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm text-red-900 font-bold">
                          ⚠️ Bài thi của bạn đã bị đánh dấu để kiểm tra!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CAT Status */}
              {exam.isAdaptive && catAlgorithm && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="bg-blue-600 p-4 text-white">
                    <h3 className="font-bold flex items-center gap-2">
                      <ChartBarIcon className="text-white" size={20} />
                      Kiểm Tra Thích Ứng
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-blue-900 font-semibold">Năng lực ước tính</span>
                        <span className="text-blue-700 font-bold">
                          {Math.round(catAlgorithm.getState().estimatedAbility * 100)}%
                        </span>
                      </div>
                      <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${catAlgorithm.getState().estimatedAbility * 100}% ` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-blue-900 font-semibold">Độ chính xác</span>
                        <span className="text-blue-700 font-bold">
                          {Math.round((1 - catAlgorithm.getState().standardError) * 100)}%
                        </span>
                      </div>
                      <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                          style={{ width: `${(1 - catAlgorithm.getState().standardError) * 100}% ` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-blue-700 bg-blue-100 p-3 rounded-lg flex items-start gap-2">
                      <LightbulbIcon className="text-blue-600 flex-shrink-0" size={16} />
                      <span>Hệ thống đang điều chỉnh độ khó câu hỏi dựa trên khả năng của bạn</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn nộp bài sớm?')) {
                    handleSubmitExam();
                  }
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl hover:from-green-700 hover:to-green-800 font-bold shadow-lg transition transform hover:scale-105"
              >
                ✓ Nộp Bài Sớm
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamTaking;
