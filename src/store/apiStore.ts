/**
 * Application State Store with Server API Integration
 * 
 * This store uses the API client to communicate with the backend server
 * instead of Firebase directly. It provides a centralized state management
 * solution using Zustand with async API calls.
 */

import { create } from 'zustand';
import { User, Exam, Class, ExamAttempt, Question } from '@/types';
import { apiClient } from '@/services/apiClient';
import { websocketService } from '@/services/websocketService';

interface AppState {
  // User state
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Exams state
  exams: Exam[];
  currentExam: Exam | null;
  
  // Classes state
  classes: Class[];
  currentClass: Class | null;
  
  // Exam attempts state
  examAttempts: ExamAttempt[];
  currentAttempt: ExamAttempt | null;
  
  // Question bank state
  questions: Question[];
  
  // Loading & error states
  isLoading: boolean;
  error: string | null;
  
  // Server connection status
  isServerConnected: boolean;
  
  // Actions
  checkServerConnection: () => Promise<boolean>;
  
  // User actions
  login: (email: string, password: string, role: 'instructor' | 'student') => Promise<void>;
  register: (email: string, password: string, name: string, role: 'instructor' | 'student') => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  
  // Exam actions
  createExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Promise<Exam>;
  getExam: (examId: string) => Promise<Exam>;
  updateExam: (examId: string, updates: Partial<Exam>) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  loadExamsByInstructor: (instructorId: string) => Promise<void>;
  loadAvailableExamsForStudent: (studentId: string) => Promise<void>;
  setCurrentExam: (exam: Exam | null) => void;
  
  // Class actions
  createClass: (classData: Omit<Class, 'id' | 'createdAt'>) => Promise<Class>;
  getClass: (classId: string) => Promise<Class>;
  updateClass: (classId: string, updates: Partial<Class>) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  loadClassesByInstructor: (instructorId: string) => Promise<void>;
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  setCurrentClass: (classData: Class | null) => void;
  
  // Question bank actions
  createQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Question>;
  updateQuestion: (questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  searchQuestions: (filters: any) => Promise<void>;
  
  // Exam attempt actions
  startExamAttempt: (examId: string) => Promise<ExamAttempt>;
  updateExamAttempt: (attemptId: string, updates: Partial<ExamAttempt>) => Promise<void>;
  submitExamAttempt: (attemptId: string, answers: Record<string, string>) => Promise<void>;
  loadAttemptsByExam: (examId: string) => Promise<void>;
  setCurrentAttempt: (attempt: ExamAttempt | null) => void;
  
  // Real-time monitoring
  connectToExamMonitoring: (examId: string) => void;
  disconnectFromMonitoring: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  users: [],
  currentUser: null,
  isAuthenticated: false,
  exams: [],
  currentExam: null,
  classes: [],
  currentClass: null,
  examAttempts: [],
  currentAttempt: null,
  questions: [],
  isLoading: false,
  error: null,
  isServerConnected: false,

  // ============ Server Connection ============

  checkServerConnection: async () => {
    try {
      const isConnected = await apiClient.healthCheck();
      set({ isServerConnected: isConnected });
      return isConnected;
    } catch (error) {
      set({ isServerConnected: false });
      return false;
    }
  },

  // ============ Authentication ============

  login: async (email, password, role) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.login(email, password, role);
      
      set({ 
        currentUser: response.user, 
        isAuthenticated: true, 
        isLoading: false,
        isServerConnected: true,
      });
      
      // Load user's data
      if (role === 'instructor') {
        await get().loadExamsByInstructor(response.user.id);
        await get().loadClassesByInstructor(response.user.id);
      } else {
        await get().loadAvailableExamsForStudent(response.user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
        isServerConnected: false,
      });
      throw error;
    }
  },

  register: async (email, password, name, role) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.register(email, password, name, role);
      
      set({ 
        currentUser: response.user, 
        isAuthenticated: true, 
        isLoading: false,
        isServerConnected: true,
      });
    } catch (error) {
      console.error('Registration error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.logout();
      websocketService.disconnect();
      
      set({ 
        currentUser: null, 
        isAuthenticated: false,
        currentExam: null,
        currentClass: null,
        currentAttempt: null,
        exams: [],
        classes: [],
        examAttempts: [],
        questions: [],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server logout fails
      set({ 
        currentUser: null, 
        isAuthenticated: false,
      });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  updateCurrentUser: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const updatedUser = await apiClient.updateUser(currentUser.id, updates);
      set({ currentUser: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update user' });
      throw error;
    }
  },

  // ============ Exam Operations ============

  createExam: async (examData) => {
    try {
      set({ isLoading: true, error: null });
      
      const exam = await apiClient.createExam(examData);
      
      set((state) => ({ 
        exams: [...state.exams, exam],
        isLoading: false
      }));
      
      return exam;
    } catch (error) {
      console.error('Error creating exam:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create exam',
        isLoading: false
      });
      throw error;
    }
  },

  getExam: async (examId) => {
    try {
      set({ isLoading: true, error: null });
      
      const exam = await apiClient.getExam(examId);
      
      set({ currentExam: exam, isLoading: false });
      return exam;
    } catch (error) {
      console.error('Error getting exam:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get exam',
        isLoading: false
      });
      throw error;
    }
  },

  updateExam: async (examId, updates) => {
    try {
      const updatedExam = await apiClient.updateExam(examId, updates);
      
      set((state) => ({
        exams: state.exams.map(exam => 
          exam.id === examId ? updatedExam : exam
        ),
        currentExam: state.currentExam?.id === examId ? updatedExam : state.currentExam,
      }));
    } catch (error) {
      console.error('Error updating exam:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update exam' });
      throw error;
    }
  },

  deleteExam: async (examId) => {
    try {
      await apiClient.deleteExam(examId);
      
      set((state) => ({
        exams: state.exams.filter(exam => exam.id !== examId),
        currentExam: state.currentExam?.id === examId ? null : state.currentExam,
      }));
    } catch (error) {
      console.error('Error deleting exam:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete exam' });
      throw error;
    }
  },

  loadExamsByInstructor: async (instructorId) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.getExamsByInstructor(instructorId);
      
      set({ exams: response.data, isLoading: false });
    } catch (error) {
      console.error('Error loading exams:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load exams',
        isLoading: false
      });
    }
  },

  loadAvailableExamsForStudent: async (studentId) => {
    try {
      set({ isLoading: true, error: null });
      
      const exams = await apiClient.getAvailableExamsForStudent(studentId);
      
      set({ exams, isLoading: false });
    } catch (error) {
      console.error('Error loading available exams:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load exams',
        isLoading: false
      });
    }
  },

  setCurrentExam: (exam) => set({ currentExam: exam }),

  // ============ Class Operations ============

  createClass: async (classData) => {
    try {
      set({ isLoading: true, error: null });
      
      const newClass = await apiClient.createClass(classData);
      
      set((state) => ({ 
        classes: [...state.classes, newClass],
        isLoading: false
      }));
      
      return newClass;
    } catch (error) {
      console.error('Error creating class:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create class',
        isLoading: false
      });
      throw error;
    }
  },

  getClass: async (classId) => {
    try {
      set({ isLoading: true, error: null });
      
      const classData = await apiClient.getClass(classId);
      
      set({ currentClass: classData, isLoading: false });
      return classData;
    } catch (error) {
      console.error('Error getting class:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get class',
        isLoading: false
      });
      throw error;
    }
  },

  updateClass: async (classId, updates) => {
    try {
      const updatedClass = await apiClient.updateClass(classId, updates);
      
      set((state) => ({
        classes: state.classes.map(cls => 
          cls.id === classId ? updatedClass : cls
        ),
        currentClass: state.currentClass?.id === classId ? updatedClass : state.currentClass,
      }));
    } catch (error) {
      console.error('Error updating class:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update class' });
      throw error;
    }
  },

  deleteClass: async (classId) => {
    try {
      await apiClient.deleteClass(classId);
      
      set((state) => ({
        classes: state.classes.filter(cls => cls.id !== classId),
        currentClass: state.currentClass?.id === classId ? null : state.currentClass,
      }));
    } catch (error) {
      console.error('Error deleting class:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete class' });
      throw error;
    }
  },

  loadClassesByInstructor: async (instructorId) => {
    try {
      set({ isLoading: true, error: null });
      
      const classes = await apiClient.getClassesByInstructor(instructorId);
      
      set({ classes, isLoading: false });
    } catch (error) {
      console.error('Error loading classes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load classes',
        isLoading: false
      });
    }
  },

  addStudentToClass: async (classId, studentId) => {
    try {
      const updatedClass = await apiClient.addStudentToClass(classId, studentId);
      
      set((state) => ({
        classes: state.classes.map(cls => 
          cls.id === classId ? updatedClass : cls
        ),
        currentClass: state.currentClass?.id === classId ? updatedClass : state.currentClass,
      }));
    } catch (error) {
      console.error('Error adding student to class:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add student' });
      throw error;
    }
  },

  removeStudentFromClass: async (classId, studentId) => {
    try {
      const updatedClass = await apiClient.removeStudentFromClass(classId, studentId);
      
      set((state) => ({
        classes: state.classes.map(cls => 
          cls.id === classId ? updatedClass : cls
        ),
        currentClass: state.currentClass?.id === classId ? updatedClass : state.currentClass,
      }));
    } catch (error) {
      console.error('Error removing student from class:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to remove student' });
      throw error;
    }
  },

  setCurrentClass: (classData) => set({ currentClass: classData }),

  // ============ Question Bank Operations ============

  createQuestion: async (questionData) => {
    try {
      const question = await apiClient.createQuestion(questionData);
      
      set((state) => ({
        questions: [...state.questions, question],
      }));
      
      return question;
    } catch (error) {
      console.error('Error creating question:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create question' });
      throw error;
    }
  },

  updateQuestion: async (questionId, updates) => {
    try {
      const updatedQuestion = await apiClient.updateQuestion(questionId, updates);
      
      set((state) => ({
        questions: state.questions.map(q => 
          q.id === questionId ? updatedQuestion : q
        ),
      }));
    } catch (error) {
      console.error('Error updating question:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update question' });
      throw error;
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      await apiClient.deleteQuestion(questionId);
      
      set((state) => ({
        questions: state.questions.filter(q => q.id !== questionId),
      }));
    } catch (error) {
      console.error('Error deleting question:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete question' });
      throw error;
    }
  },

  searchQuestions: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.searchQuestions(filters);
      
      set({ questions: response.data, isLoading: false });
    } catch (error) {
      console.error('Error searching questions:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search questions',
        isLoading: false
      });
    }
  },

  // ============ Exam Attempt Operations ============

  startExamAttempt: async (examId) => {
    try {
      const attempt = await apiClient.startExamAttempt(examId);
      
      set((state) => ({ 
        examAttempts: [...state.examAttempts, attempt],
        currentAttempt: attempt,
      }));
      
      return attempt;
    } catch (error) {
      console.error('Error starting exam attempt:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to start exam' });
      throw error;
    }
  },

  updateExamAttempt: async (attemptId, updates) => {
    try {
      const updatedAttempt = await apiClient.updateExamAttempt(attemptId, updates);
      
      set((state) => ({
        examAttempts: state.examAttempts.map(attempt => 
          attempt.id === attemptId ? updatedAttempt : attempt
        ),
        currentAttempt: state.currentAttempt?.id === attemptId ? updatedAttempt : state.currentAttempt,
      }));
    } catch (error) {
      console.error('Error updating exam attempt:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update attempt' });
      throw error;
    }
  },

  submitExamAttempt: async (attemptId, answers) => {
    try {
      const completedAttempt = await apiClient.submitExamAttempt(attemptId, answers);
      
      set((state) => ({
        examAttempts: state.examAttempts.map(attempt => 
          attempt.id === attemptId ? completedAttempt : attempt
        ),
        currentAttempt: null,
      }));
    } catch (error) {
      console.error('Error submitting exam attempt:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to submit exam' });
      throw error;
    }
  },

  loadAttemptsByExam: async (examId) => {
    try {
      set({ isLoading: true, error: null });
      
      const attempts = await apiClient.getAttemptsByExam(examId);
      
      set({ examAttempts: attempts, isLoading: false });
    } catch (error) {
      console.error('Error loading attempts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load attempts',
        isLoading: false
      });
    }
  },

  setCurrentAttempt: (attempt) => set({ currentAttempt: attempt }),

  // ============ Real-time Monitoring ============

  connectToExamMonitoring: (examId) => {
    websocketService.connect(examId);
  },

  disconnectFromMonitoring: () => {
    websocketService.disconnect();
  },
}));
