// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'instructor' | 'student';
  avatar?: string;
  createdAt: Date;
}

// Enhanced metadata types for better question organization
export interface GradeLevel {
  system: 'elementary' | 'middle-school' | 'high-school' | 'university' | 'other';
  grade: number | null; // 1-12 for K-12, null for university
  semester?: 1 | 2 | null;
}

export interface SubjectInfo {
  main: string; // Toán, Lý, Hóa, Văn, Anh, etc.
  chapter?: string; // Chương 1, Chương 2, etc.
  lesson?: string; // Bài 1, Bài 2, etc.
  topic?: string; // Đạo hàm, Tích phân, etc.
}

export interface CognitiveLevel {
  // Based on Bloom's Taxonomy - mapped to Vietnamese education system
  // Note: Vietnamese education system typically uses 4 levels:
  // - Nhận biết (Remember/Knowledge)
  // - Thông hiểu (Understand/Comprehension)
  // - Vận dụng (Apply/Application)
  // - Vận dụng cao (Analyze/Higher-order thinking - includes Analyze, Evaluate, Create)
  level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  vietnameseLabel: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
}

// Exam types
export interface Question {
  id: string;
  type: 'multiple-choice' | 'essay' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  difficulty: number; // 0-1 scale for CAT algorithm
  topic: string;
  points: number;

  // Enhanced metadata for better organization and AI generation
  gradeLevel?: GradeLevel;
  subject?: SubjectInfo;
  cognitiveLevel?: CognitiveLevel;
  tags?: string[]; // Custom tags for filtering
  keywords?: string[]; // For searchability
  source?: string; // SGK, Đề thi chính thức, AI generated, etc.
  explanation?: string; // Detailed explanation for the answer

  // IRT Parameters (from trained models)
  irtParameters?: {
    discrimination: number;  // 'a' parameter - how well it differentiates
    difficultyIRT: number;   // 'b' parameter - actual IRT difficulty
    guessing: number;         // 'c' parameter - probability of guessing
  };

  // Performance Analytics
  analytics?: {
    timesUsed: number;
    avgScore: number;
    facility: number;        // % who got it right
    discriminationIndex: number;  // how well it separates high/low performers
    lastUsed?: Date;
  };

  // Organization
  folderId?: string;
  folder?: string;         // For hierarchy: "Math/Calculus/Derivatives"
  version: number;
  author?: string;
  reviewStatus?: 'draft' | 'reviewed' | 'approved';

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

// Enhanced exam configuration with detailed options
export interface ExamSyllabus {
  chapters: string[]; // ['Chương 1', 'Chương 2']
  topics: string[]; // ['Đạo hàm', 'Tích phân']
  focus?: string; // Detailed description of exam scope
  excludedTopics?: string[]; // Topics to exclude
}

export interface QuestionDistribution {
  // Distribution by cognitive level (Bloom's Taxonomy)
  cognitiveDistribution?: {
    remember: number; // % of questions at 'remember' level
    understand: number; // % of questions at 'understand' level
    apply: number; // % of questions at 'apply' level
    analyze: number; // % of questions at 'analyze' level
  };

  // Distribution by difficulty
  difficultyDistribution?: {
    easy: number; // % of easy questions (0.0-0.3)
    medium: number; // % of medium questions (0.3-0.7)
    hard: number; // % of hard questions (0.7-1.0)
  };

  // Distribution by question type
  typeDistribution?: {
    multipleChoice: number;
    essay: number;
    trueFalse?: number;
    fillBlank?: number;
  };
}

export interface ExamTargetAudience {
  gradeLevel: 'elementary' | 'middle-school' | 'high-school' | 'university' | 'other';
  grades: number[]; // [10, 11, 12] for high school, or specific grade
  subject: string; // Main subject
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  classId: string;
  questions: Question[];
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  isAdaptive: boolean; // CAT enabled
  antiCheatEnabled: boolean;
  createdAt: Date;

  // NEW: Enhanced metadata for better exam creation
  targetAudience?: ExamTargetAudience;
  syllabus?: ExamSyllabus;
  questionDistribution?: QuestionDistribution;
  totalPoints?: number;
  passingScore?: number; // Minimum score to pass (%)
  allowReview?: boolean; // Allow students to review after submission
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

// Class types
export interface Class {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  students: string[]; // student IDs
  exams: string[]; // exam IDs
  createdAt: Date;
}

// Exam attempt types
export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  score?: number;
  startTime: Date;
  endTime?: Date;
  status: 'in-progress' | 'completed' | 'flagged';
  warnings: CheatWarning[];
}

// Anti-cheat types
export interface CheatWarning {
  id: string;
  attemptId: string;
  type: 'look-away' | 'multiple-faces' | 'no-face' | 'tab-switch' | 'forbidden-object' | 'fullscreen-exit';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  message?: string;
  snapshot?: string; // base64 image
}

// CAT Algorithm types
export interface CATState {
  currentDifficulty: number;
  estimatedAbility: number;
  standardError: number;
  questionsAsked: number;
  maxQuestions: number;
}

export interface QuestionResponse {
  questionId: string;
  correct: boolean;
  timeSpent: number;
}
