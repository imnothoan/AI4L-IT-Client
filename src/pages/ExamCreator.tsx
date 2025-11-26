import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Question } from '@/types';
import { geminiService } from '@/services/geminiService';

import { aiQuestionGenerator } from '@/services/aiQuestionGenerator';
import { Sparkles } from 'lucide-react';

const ExamCreator: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, createExam, classes } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [classId, setClassId] = useState('');
  const [isAdaptive, setIsAdaptive] = useState(true);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTopic, setGenerationTopic] = useState('');
  const [generationCount, setGenerationCount] = useState(10);
  const [generationDifficulty, setGenerationDifficulty] = useState(0.5);
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'essay'>('multiple-choice');

  const instructorClasses = classes.filter(
    cls => cls.instructorId === currentUser?.id
  );

  const handleGenerateQuestions = async () => {
    if (!generationTopic) {
      alert('Please enter a topic for question generation');
      return;
    }

    // Check if AI service is available
    if (!geminiService.isAvailable()) {
      const proceed = window.confirm(
        'Gemini API Key is missing or invalid. The system will use mock questions instead. Do you want to proceed?'
      );
      if (!proceed) return;
    }

    setIsGenerating(true);
    try {
      const generated = await aiQuestionGenerator.generateQuestions(
        generationTopic,
        generationCount,
        generationDifficulty,
        questionType
      );

      if (generated.length === 0) {
        throw new Error('No questions were generated. Please try a different topic.');
      }

      setQuestions([...questions, ...generated]);
      setGenerationTopic('');
    } catch (error) {
      console.error('Error generating questions:', error);
      alert(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualQuestion = () => {
    const newQuestion: Question = {
      id: `manual-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 0.5,
      topic: 'General',
      points: 10,
      version: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateExam = async () => {
    if (!title || !classId || questions.length === 0) {
      alert('Please fill in all required fields and add at least one question');
      return;
    }

    try {
      await createExam({
        title,
        description,
        instructorId: currentUser?.id || '',
        classId,
        questions,
        duration,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        isAdaptive,
        antiCheatEnabled,
      });
      navigate('/instructor');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Không thể tạo đề thi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Exam
            </h1>
            <button
              onClick={() => navigate('/instructor')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Midterm Exam - Chapter 1-5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of the exam"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class *
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a class</option>
                      {instructorClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Question Generation */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 inline mr-2" /> AI Question Generation
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={generationTopic}
                    onChange={(e) => setGenerationTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Linear Algebra, World History, Python Programming"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Count
                    </label>
                    <input
                      type="number"
                      value={generationCount}
                      onChange={(e) => setGenerationCount(parseInt(e.target.value))}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={generationDifficulty}
                      onChange={(e) => setGenerationDifficulty(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="0.2">Easy</option>
                      <option value="0.5">Medium</option>
                      <option value="0.8">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {isGenerating ? 'Generating...' : 'Generate Questions with AI'}
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Questions ({questions.length})
                </h2>
                <button
                  onClick={handleAddManualQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Manual Question
                </button>
              </div>

              {questions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No questions yet. Generate with AI or add manually.
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-700">
                          Question {index + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(index, { question: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                        placeholder="Question text"
                      />
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctAnswer === optIndex}
                                onChange={() => handleUpdateQuestion(index, { correctAnswer: optIndex })}
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options!];
                                  newOptions[optIndex] = e.target.value;
                                  handleUpdateQuestion(index, { options: newOptions });
                                }}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder={`Option ${optIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Exam Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAdaptive}
                    onChange={(e) => setIsAdaptive(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-medium">CAT Algorithm</div>
                    <div className="text-sm text-gray-600">
                      Enable adaptive testing
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antiCheatEnabled}
                    onChange={(e) => setAntiCheatEnabled(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-medium">Anti-Cheat</div>
                    <div className="text-sm text-gray-600">
                      Enable camera monitoring
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleCreateExam}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              Create Exam
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamCreator;
