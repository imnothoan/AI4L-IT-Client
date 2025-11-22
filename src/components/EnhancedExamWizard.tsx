import React, { useState } from 'react';
import { Question } from '@/types';
import { geminiService } from '@/services/geminiService';

interface EnhancedExamWizardProps {
  onQuestionsGenerated: (questions: Question[]) => void;
  onClose?: () => void;
}

type WizardStep = 'basic' | 'audience' | 'syllabus' | 'distribution' | 'generate';

const EnhancedExamWizard: React.FC<EnhancedExamWizardProps> = ({ 
  onQuestionsGenerated,
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [isGenerating, setIsGenerating] = useState(false);

  // Basic info
  const [subject, setSubject] = useState('Toán');
  const [questionCount, setQuestionCount] = useState(10);
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'essay'>('multiple-choice');

  // Target audience
  const [gradeSystem, setGradeSystem] = useState<'elementary' | 'middle-school' | 'high-school' | 'university'>('high-school');
  const [selectedGrades, setSelectedGrades] = useState<number[]>([11]);

  // Syllabus
  const [chapters, setChapters] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [syllabusDescription, setSyllabusDescription] = useState('');
  const [newChapter, setNewChapter] = useState('');
  const [newTopic, setNewTopic] = useState('');

  // Distribution
  const [rememberPercent, setRememberPercent] = useState(30);
  const [understandPercent, setUnderstandPercent] = useState(40);
  const [applyPercent, setApplyPercent] = useState(20);
  const [analyzePercent, setAnalyzePercent] = useState(10);
  
  const [easyPercent, setEasyPercent] = useState(30);
  const [mediumPercent, setMediumPercent] = useState(50);
  const [hardPercent, setHardPercent] = useState(20);

  const subjects = ['Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Văn', 'Anh', 'Lịch Sử', 'Địa Lý', 'GDCD'];
  
  const gradesBySystem = {
    'elementary': [1, 2, 3, 4, 5],
    'middle-school': [6, 7, 8, 9],
    'high-school': [10, 11, 12],
    'university': []
  };

  const cognitiveDistributionValid = () => {
    const total = rememberPercent + understandPercent + applyPercent + analyzePercent;
    return Math.abs(total - 100) < 0.1;
  };

  const difficultyDistributionValid = () => {
    const total = easyPercent + mediumPercent + hardPercent;
    return Math.abs(total - 100) < 0.1;
  };

  const handleAddChapter = () => {
    if (newChapter.trim() && !chapters.includes(newChapter.trim())) {
      setChapters([...chapters, newChapter.trim()]);
      setNewChapter('');
    }
  };

  const handleRemoveChapter = (chapter: string) => {
    setChapters(chapters.filter(c => c !== chapter));
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleGenerate = async () => {
    if (!cognitiveDistributionValid() || !difficultyDistributionValid()) {
      // TODO: Replace with toast notification system for better UX
      alert('Tổng phân bố phải bằng 100%');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate questions based on distribution
      const allQuestions: Question[] = [];

      // Calculate question counts for each cognitive level
      const cogLevels = [
        { level: 'Nhận biết', percent: rememberPercent, difficulty: 0.25 },
        { level: 'Thông hiểu', percent: understandPercent, difficulty: 0.45 },
        { level: 'Vận dụng', percent: applyPercent, difficulty: 0.65 },
        { level: 'Vận dụng cao', percent: analyzePercent, difficulty: 0.85 }
      ];

      for (const cogLevel of cogLevels) {
        const count = Math.round((cogLevel.percent / 100) * questionCount);
        if (count > 0) {
          const gradeLabel = gradeSystem === 'university' 
            ? 'Đại học' 
            : `Lớp ${selectedGrades.join(', ')}`;

          const questions = await geminiService.generateQuestionsWithContext({
            subject,
            gradeLevel: gradeLabel,
            chapter: chapters.length > 0 ? chapters.join(', ') : undefined,
            topics: topics.length > 0 ? topics : undefined,
            count,
            difficulty: cogLevel.difficulty,
            cognitiveLevel: cogLevel.level,
            type: questionType,
            language: 'vi',
            additionalContext: syllabusDescription || undefined
          });
          
          allQuestions.push(...questions);
        }
      }

      onQuestionsGenerated(allQuestions);
      // TODO: Replace with toast notification for better UX
      alert(`Đã tạo thành công ${allQuestions.length} câu hỏi!`);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error generating questions:', error);
      // TODO: Replace with proper error notification system
      alert('Có lỗi xảy ra khi tạo câu hỏi. Vui lòng kiểm tra API key và thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Bước 1: Thông Tin Cơ Bản</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Môn học <span className="text-red-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng câu hỏi <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Khuyến nghị: 10-30 câu</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại câu hỏi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={questionType === 'multiple-choice'}
                    onChange={() => setQuestionType('multiple-choice')}
                    className="mr-2"
                  />
                  Trắc nghiệm
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={questionType === 'essay'}
                    onChange={() => setQuestionType('essay')}
                    className="mr-2"
                  />
                  Tự luận
                </label>
              </div>
            </div>
          </div>
        );

      case 'audience':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Bước 2: Đối Tượng Học Sinh</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cấp học <span className="text-red-500">*</span>
              </label>
              <select
                value={gradeSystem}
                onChange={(e) => {
                  const system = e.target.value as typeof gradeSystem;
                  setGradeSystem(system);
                  setSelectedGrades(system === 'university' ? [] : [gradesBySystem[system][0]]);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="elementary">Tiểu học (Lớp 1-5)</option>
                <option value="middle-school">THCS (Lớp 6-9)</option>
                <option value="high-school">THPT (Lớp 10-12)</option>
                <option value="university">Đại học</option>
              </select>
            </div>

            {gradeSystem !== 'university' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khối lớp cụ thể <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {gradesBySystem[gradeSystem].map(grade => (
                    <label
                      key={grade}
                      className="flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50"
                      style={{
                        borderColor: selectedGrades.includes(grade) ? '#3B82F6' : '#D1D5DB',
                        backgroundColor: selectedGrades.includes(grade) ? '#EFF6FF' : 'white'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGrades([...selectedGrades, grade]);
                          } else {
                            setSelectedGrades(selectedGrades.filter(g => g !== grade));
                          }
                        }}
                        className="mr-2"
                      />
                      Lớp {grade}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'syllabus':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Bước 3: Đề Cương Chi Tiết</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chương (Tùy chọn)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChapter()}
                  placeholder="VD: Chương 1: Đạo hàm"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddChapter}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Thêm
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {chapters.map(chapter => (
                  <span
                    key={chapter}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {chapter}
                    <button
                      onClick={() => handleRemoveChapter(chapter)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chủ đề cụ thể (Tùy chọn)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                  placeholder="VD: Đạo hàm cơ bản, Ứng dụng đạo hàm"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTopic}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Thêm
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {topics.map(topic => (
                  <span
                    key={topic}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {topic}
                    <button
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả phạm vi chi tiết (Tùy chọn)
              </label>
              <textarea
                value={syllabusDescription}
                onChange={(e) => setSyllabusDescription(e.target.value)}
                rows={4}
                placeholder="VD: Tập trung vào các bài tập cơ bản, không có phần nâng cao. Bao gồm cả lý thuyết và bài tập áp dụng..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'distribution':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Bước 4: Phân Bố Câu Hỏi</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Phân bố theo mức độ nhận thức</h4>
              <div className="space-y-3">
                {[
                  { label: 'Nhận biết', value: rememberPercent, setter: setRememberPercent, description: 'Nhớ, nhận biết khái niệm' },
                  { label: 'Thông hiểu', value: understandPercent, setter: setUnderstandPercent, description: 'Hiểu, giải thích' },
                  { label: 'Vận dụng', value: applyPercent, setter: setApplyPercent, description: 'Áp dụng vào bài tập' },
                  { label: 'Vận dụng cao', value: analyzePercent, setter: setAnalyzePercent, description: 'Phân tích, tổng hợp' }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                        <span className="text-xs text-gray-500 ml-2">({item.description})</span>
                      </span>
                      <span className="text-sm font-bold text-blue-600">{item.value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.value}
                      onChange={(e) => item.setter(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm">
                <span className={cognitiveDistributionValid() ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  Tổng: {rememberPercent + understandPercent + applyPercent + analyzePercent}%
                  {!cognitiveDistributionValid() && ' - Phải bằng 100%'}
                </span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">Phân bố theo độ khó</h4>
              <div className="space-y-3">
                {[
                  { label: 'Dễ', value: easyPercent, setter: setEasyPercent, description: '0.0 - 0.3' },
                  { label: 'Trung bình', value: mediumPercent, setter: setMediumPercent, description: '0.3 - 0.7' },
                  { label: 'Khó', value: hardPercent, setter: setHardPercent, description: '0.7 - 1.0' }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                        <span className="text-xs text-gray-500 ml-2">({item.description})</span>
                      </span>
                      <span className="text-sm font-bold text-green-600">{item.value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.value}
                      onChange={(e) => item.setter(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm">
                <span className={difficultyDistributionValid() ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  Tổng: {easyPercent + mediumPercent + hardPercent}%
                  {!difficultyDistributionValid() && ' - Phải bằng 100%'}
                </span>
              </div>
            </div>
          </div>
        );

      case 'generate':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Bước 5: Xác Nhận và Tạo Câu Hỏi</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Môn học:</p>
                  <p className="font-semibold">{subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số câu hỏi:</p>
                  <p className="font-semibold">{questionCount} câu</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loại câu hỏi:</p>
                  <p className="font-semibold">{questionType === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Khối lớp:</p>
                  <p className="font-semibold">
                    {gradeSystem === 'university' ? 'Đại học' : `Lớp ${selectedGrades.join(', ')}`}
                  </p>
                </div>
              </div>

              {chapters.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Chương:</p>
                  <p className="font-semibold">{chapters.join(', ')}</p>
                </div>
              )}

              {topics.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Chủ đề:</p>
                  <p className="font-semibold">{topics.join(', ')}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Mức độ nhận thức:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Nhận biết: {rememberPercent}%</li>
                    <li>• Thông hiểu: {understandPercent}%</li>
                    <li>• Vận dụng: {applyPercent}%</li>
                    <li>• Vận dụng cao: {analyzePercent}%</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Độ khó:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Dễ: {easyPercent}%</li>
                    <li>• Trung bình: {mediumPercent}%</li>
                    <li>• Khó: {hardPercent}%</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Quá trình tạo câu hỏi có thể mất 30-60 giây. 
                Hệ thống sẽ sử dụng AI để tạo câu hỏi dựa trên thông tin bạn đã cung cấp.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps: WizardStep[] = ['basic', 'audience', 'syllabus', 'distribution', 'generate'];
  const stepLabels = {
    'basic': '1. Cơ Bản',
    'audience': '2. Đối Tượng',
    'syllabus': '3. Đề Cương',
    'distribution': '4. Phân Bố',
    'generate': '5. Xác Nhận'
  };

  const currentStepIndex = steps.indexOf(currentStep);
  const canGoNext = () => {
    switch (currentStep) {
      case 'basic':
        return subject && questionCount > 0;
      case 'audience':
        return gradeSystem === 'university' || selectedGrades.length > 0;
      case 'syllabus':
        return true; // Optional step
      case 'distribution':
        return cognitiveDistributionValid() && difficultyDistributionValid();
      case 'generate':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Tạo Câu Hỏi Với AI 🤖</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center"
                style={{ flex: index < steps.length - 1 ? '1' : 'none' }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${index <= currentStepIndex 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-600'}`}
                  >
                    {index + 1}
                  </div>
                  <span className={`mt-2 text-xs ${index <= currentStepIndex ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                    {stepLabels[step]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`h-1 flex-1 mx-2 ${index < currentStepIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                    style={{ marginTop: '-24px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={() => {
              const prevIndex = currentStepIndex - 1;
              if (prevIndex >= 0) {
                setCurrentStep(steps[prevIndex]);
              }
            }}
            disabled={currentStepIndex === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Quay lại
          </button>

          {currentStep === 'generate' ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !canGoNext()}
              className="px-8 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Đang tạo...
                </>
              ) : (
                '✨ Tạo Câu Hỏi'
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < steps.length) {
                  setCurrentStep(steps[nextIndex]);
                }
              }}
              disabled={!canGoNext()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp theo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedExamWizard;
