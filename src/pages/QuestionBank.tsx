import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { firebaseService } from '@/services/firebaseService';
import { aiQuestionGenerator } from '@/services/aiQuestionGenerator';
import { Question } from '@/types';
import { LibraryIcon, RobotIcon } from '@/components/icons/AcademicIcons';
import { Plus, Check, Trash2 } from 'lucide-react';

/**
 * Question Bank Management
 * Manage, search, and organize questions for exams
 */

export default function QuestionBank() {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterType, setFilterType] = useState('');
  const [topics, setTopics] = useState<string[]>([]);

  // New question form
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 0.5,
    topic: '',
    points: 10,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'instructor') {
      navigate('/login');
    } else {
      loadQuestions();
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, filterTopic, filterType]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions = await firebaseService.searchQuestions({});
      setQuestions(allQuestions);

      // Extract unique topics
      const uniqueTopics = Array.from(new Set(allQuestions.map(q => q.topic)));
      setTopics(uniqueTopics);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTopic) {
      filtered = filtered.filter(q => q.topic === filterTopic);
    }

    if (filterType) {
      filtered = filtered.filter(q => q.type === filterType);
    }

    setFilteredQuestions(filtered);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question || !newQuestion.topic) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const question: Question = {
        id: `q-${Date.now()}`,
        type: newQuestion.type as 'multiple-choice' | 'essay',
        question: newQuestion.question,
        options: newQuestion.type === 'multiple-choice' ? newQuestion.options : undefined,
        correctAnswer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : undefined,
        difficulty: newQuestion.difficulty || 0.5,
        topic: newQuestion.topic,
        points: newQuestion.points || 10,
        version: 1,
      };

      await firebaseService.createQuestion(question);
      await loadQuestions();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    const topic = prompt('Enter topic for AI question generation:');
    if (!topic) return;

    setLoading(true);
    try {
      const generated = await aiQuestionGenerator.generateQuestions(topic, 5, 0.5, 'multiple-choice');

      for (const q of generated) {
        await firebaseService.createQuestion(q);
      }

      await loadQuestions();
      alert(`Successfully generated ${generated.length} questions!`);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    setLoading(true);
    try {
      await firebaseService.deleteQuestion(questionId);
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 0.5,
      topic: '',
      points: 10,
    });
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty < 0.3) return { label: 'Easy', color: 'bg-green-100 text-green-800' };
    if (difficulty < 0.7) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Hard', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <LibraryIcon className="text-academic-700" size={28} />
                Question Bank
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and organize your exam questions
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
        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="essay">Essay</option>
            </select>
            <button
              onClick={handleGenerateQuestions}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <RobotIcon className="inline-block mr-1" size={16} />
              Generate with AI
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2 inline" /> Add Question
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Questions</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{questions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Topics</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{topics.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Multiple Choice</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {questions.filter(q => q.type === 'multiple-choice').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Essay</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {questions.filter(q => q.type === 'essay').length}
            </p>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Questions ({filteredQuestions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No questions found. Add some questions to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredQuestions.map((question, index) => {
                const diffInfo = getDifficultyLabel(question.difficulty);
                return (
                  <div key={question.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${diffInfo.color}`}>
                            {diffInfo.label}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {question.topic}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {question.type}
                          </span>
                          <span className="text-xs text-gray-500">{question.points} pts</span>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">{question.question}</p>
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option, i) => (
                              <div key={i} className="flex items-center">
                                <span className={`text-sm ${i === question.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                  {i === question.correctAnswer && <Check className="w-3 h-3 inline mr-1" />}
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Question</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {newQuestion.type === 'multiple-choice' && (
                <>
                  {newQuestion.options?.map((option, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option {i + 1} {i === newQuestion.correctAnswer && '(Correct)'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const opts = [...(newQuestion.options || [])];
                            opts[i] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                          className={`px-4 py-2 rounded-lg ${i === newQuestion.correctAnswer ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                <input
                  type="text"
                  value={newQuestion.topic}
                  onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty (0-1)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
