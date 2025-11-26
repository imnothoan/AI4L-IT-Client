import React, { useState } from 'react';

interface QuestionFlaggingProps {
    questionId: string;
    onFlag: (questionId: string, flagged: boolean) => void;
    initialFlagged?: boolean;
}

export const QuestionFlagging: React.FC<QuestionFlaggingProps> = ({
    questionId,
    onFlag,
    initialFlagged = false
}) => {
    const [flagged, setFlagged] = useState(initialFlagged);

    const toggleFlag = () => {
        const newFlagged = !flagged;
        setFlagged(newFlagged);
        onFlag(questionId, newFlagged);
    };

    return (
        <button
            onClick={toggleFlag}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${flagged
                    ? 'border-yellow-500 bg-yellow-100 text-yellow-700'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-yellow-300'
                }`}
            title="Flag for review (F)"
        >
            <span className="text-lg">{flagged ? '🚩' : '⚐'}</span>
            <span className="text-sm font-medium">{flagged ? 'Flagged' : 'Flag'}</span>
        </button>
    );
};

interface ConfidenceSliderProps {
    value: number;
    onChange: (confidence: number) => void;
}

export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({ value, onChange }) => {
    const getConfidenceLabel = (val: number): string => {
        if (val < 25) return 'Đoán mò';
        if (val < 50) return 'Không chắc';
        if (val < 75) return 'Khá chắc';
        return 'Rất chắc';
    };

    const getConfidenceColor = (val: number): string => {
        if (val < 25) return 'text-red-600';
        if (val < 50) return 'text-orange-600';
        if (val < 75) return 'text-blue-600';
        return 'text-green-600';
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Độ tự tin:</label>
                <span className={`text-sm font-semibold ${getConfidenceColor(value)}`}>
                    {value}% - {getConfidenceLabel(value)}
                </span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                    background: `linear-gradient(to right, #EF4444 0%, #F59E0B 33%, #3B82F6 66%, #10B981 100%)`
                }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Đoán</span>
                <span>Khá chắc</span>
                <span>Chắc chắn</span>
            </div>
        </div>
    );
};

interface DifficultyStarsProps {
    difficulty: number; // IRT b parameter (-3 to +3)
}

export const DifficultyStars: React.FC<DifficultyStarsProps> = ({ difficulty }) => {
    // Map b parameter to 1-5 stars
    // -3 to -1.5 = 1 star (very easy)
    // -1.5 to -0.5 = 2 stars (easy)
    // -0.5 to +0.5 = 3 stars (medium)
    // +0.5 to +1.5 = 4 stars (hard)
    // +1.5 to +3.0 = 5 stars (very hard)

    const getStarCount = (): number => {
        if (difficulty < -1.5) return 1;
        if (difficulty < -0.5) return 2;
        if (difficulty < 0.5) return 3;
        if (difficulty < 1.5) return 4;
        return 5;
    };

    const stars = getStarCount();
    const label = ['Rất dễ', 'Dễ', 'Trung bình', 'Khó', 'Rất khó'][stars - 1];

    return (
        <div className="flex items-center gap-2">
            <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                    <span
                        key={i}
                        className={`text-lg ${i < stars ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        ⭐
                    </span>
                ))}
            </div>
            <span className="text-xs text-gray-600">{label}</span>
        </div>
    );
};

interface ProficiencyLevelProps {
    theta: number;
}

export const ProficiencyLevel: React.FC<ProficiencyLevelProps> = ({ theta }) => {
    const getLevel = (): { label: string; color: string; description: string } => {
        if (theta < -1.5) return {
            label: 'Beginner',
            color: 'bg-red-100 text-red-700 border-red-300',
            description: 'Cần học thêm kiến thức cơ bản'
        };
        if (theta < -0.5) return {
            label: 'Developing',
            color: 'bg-orange-100 text-orange-700 border-orange-300',
            description: 'Đang tiến bộ, cần luyện tập nhiều hơn'
        };
        if (theta < 0.5) return {
            label: 'Intermediate',
            color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            description: 'Nắm vững kiến thức trung bình'
        };
        if (theta < 1.5) return {
            label: 'Advanced',
            color: 'bg-blue-100 text-blue-700 border-blue-300',
            description: 'Kiến thức tốt, sẵn sàng thử thách'
        };
        return {
            label: 'Expert',
            color: 'bg-green-100 text-green-700 border-green-300',
            description: 'Xuất sắc, thuộc top học sinh giỏi'
        };
    };

    const level = getLevel();

    return (
        <div className={`inline-flex flex-col items-center px-4 py-2 rounded-lg border-2 ${level.color}`}>
            <span className="text-sm font-semibold">{level.label}</span>
            <span className="text-xs opacity-75">{level.description}</span>
        </div>
    );
};

interface KeyboardShortcutsProps {
    onNext?: () => void;
    onFlag?: () => void;
    onSubmit?: () => void;
    onSelectOption?: (index: number) => void;
}

export const useKeyboardShortcuts = ({
    onNext,
    onFlag,
    onSubmit,
    onSelectOption
}: KeyboardShortcutsProps) => {
    React.useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'n':
                    onNext?.();
                    break;
                case 'f':
                    onFlag?.();
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onSubmit?.();
                    }
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    onSelectOption?.(parseInt(e.key) - 1);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onNext, onFlag, onSubmit, onSelectOption]);
};

export const KeyboardShortcutsHelp: React.FC = () => {
    const [show, setShow] = useState(false);

    return (
        <>
            <button
                onClick={() => setShow(!show)}
                className="fixed bottom-4 right-4 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-all"
                title="Keyboard shortcuts (?)"
            >
                ?
            </button>

            {show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Phím tắt</h3>
                            <button
                                onClick={() => setShow(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-gray-200 rounded">N</kbd>
                                <span className="text-gray-700">Câu tiếp theo</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-gray-200 rounded">F</kbd>
                                <span className="text-gray-700">Đánh dấu cần xem lại</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl+S</kbd>
                                <span className="text-gray-700">Nộp bài</span>
                            </div>
                            <div className="flex justify-between">
                                <kbd className="px-2 py-1 bg-gray-200 rounded">1-4</kbd>
                                <span className="text-gray-700">Chọn đáp án</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
