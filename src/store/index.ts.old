import { create } from 'zustand';
import { User, Exam, Class, ExamAttempt } from '@/types';
import { firebaseService } from '@/services/firebaseService';

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
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addUser: (user: User) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string, role: 'instructor' | 'student') => Promise<void>;
  logout: () => void;
  
  addExam: (exam: Exam) => Promise<void>;
  setCurrentExam: (exam: Exam | null) => void;
  updateExam: (examId: string, updates: Partial<Exam>) => Promise<void>;
  loadExamsByInstructor: (instructorId: string) => Promise<void>;
  
  addClass: (classData: Class) => Promise<void>;
  setCurrentClass: (classData: Class | null) => void;
  updateClass: (classId: string, updates: Partial<Class>) => Promise<void>;
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  loadClassesByInstructor: (instructorId: string) => Promise<void>;
  
  startExamAttempt: (examId: string, studentId: string) => Promise<ExamAttempt>;
  updateExamAttempt: (attemptId: string, updates: Partial<ExamAttempt>) => Promise<void>;
  completeExamAttempt: (attemptId: string) => Promise<void>;
  loadAttemptsByExam: (examId: string) => Promise<void>;
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
  isLoading: false,
  error: null,

  // User actions
  addUser: async (user) => {
    try {
      await firebaseService.createUser(user);
      set((state) => ({ 
        users: [...state.users, user] 
      }));
    } catch (error) {
      console.error('Error adding user:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add user' });
    }
  },
  
  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
  
  login: async (email, _password, role) => {
    try {
      set({ isLoading: true, error: null });
      
      // Check if user exists in Firebase/localStorage
      let user = await firebaseService.getUserByEmail(email);
      
      // Create user if doesn't exist (for demo purposes)
      if (!user) {
        user = {
          id: `user-${Date.now()}`,
          email,
          name: email.split('@')[0],
          role,
          createdAt: new Date(),
        };
        await firebaseService.createUser(user);
      }
      
      set({ currentUser: user, isAuthenticated: true, isLoading: false });
      
      // Load user's data
      if (role === 'instructor') {
        await get().loadExamsByInstructor(user.id);
        await get().loadClassesByInstructor(user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false 
      });
    }
  },
  
  logout: () => set({ 
    currentUser: null, 
    isAuthenticated: false,
    currentExam: null,
    currentClass: null,
    currentAttempt: null,
    exams: [],
    classes: [],
    examAttempts: [],
  }),

  // Exam actions
  addExam: async (exam) => {
    try {
      set({ isLoading: true, error: null });
      await firebaseService.createExam(exam);
      set((state) => ({ 
        exams: [...state.exams, exam],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding exam:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add exam',
        isLoading: false
      });
    }
  },
  
  setCurrentExam: (exam) => set({ currentExam: exam }),
  
  updateExam: async (examId, updates) => {
    try {
      await firebaseService.updateExam(examId, updates);
      set((state) => ({
        exams: state.exams.map(exam => 
          exam.id === examId ? { ...exam, ...updates } : exam
        ),
        currentExam: state.currentExam?.id === examId 
          ? { ...state.currentExam, ...updates } 
          : state.currentExam,
      }));
    } catch (error) {
      console.error('Error updating exam:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update exam' });
    }
  },

  loadExamsByInstructor: async (instructorId) => {
    try {
      set({ isLoading: true, error: null });
      const exams = await firebaseService.getExamsByInstructor(instructorId);
      set({ exams, isLoading: false });
    } catch (error) {
      console.error('Error loading exams:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load exams',
        isLoading: false
      });
    }
  },

  // Class actions
  addClass: async (classData) => {
    try {
      set({ isLoading: true, error: null });
      await firebaseService.createClass(classData);
      set((state) => ({ 
        classes: [...state.classes, classData],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding class:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add class',
        isLoading: false
      });
    }
  },
  
  setCurrentClass: (classData) => set({ currentClass: classData }),
  
  updateClass: async (classId, updates) => {
    try {
      await firebaseService.updateClass(classId, updates);
      set((state) => ({
        classes: state.classes.map(cls => 
          cls.id === classId ? { ...cls, ...updates } : cls
        ),
        currentClass: state.currentClass?.id === classId 
          ? { ...state.currentClass, ...updates } 
          : state.currentClass,
      }));
    } catch (error) {
      console.error('Error updating class:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update class' });
    }
  },
  
  addStudentToClass: async (classId, studentId) => {
    try {
      const classData = await firebaseService.getClass(classId);
      if (classData) {
        const updatedStudents = [...classData.students, studentId];
        await firebaseService.updateClass(classId, { students: updatedStudents });
        set((state) => ({
          classes: state.classes.map(cls => 
            cls.id === classId 
              ? { ...cls, students: updatedStudents }
              : cls
          ),
        }));
      }
    } catch (error) {
      console.error('Error adding student to class:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add student' });
    }
  },

  loadClassesByInstructor: async (instructorId) => {
    try {
      set({ isLoading: true, error: null });
      const classes = await firebaseService.getClassesByInstructor(instructorId);
      set({ classes, isLoading: false });
    } catch (error) {
      console.error('Error loading classes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load classes',
        isLoading: false
      });
    }
  },

  // Exam attempt actions
  startExamAttempt: async (examId, studentId) => {
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      examId,
      studentId,
      answers: {},
      startTime: new Date(),
      status: 'in-progress',
      warnings: [],
    };
    
    try {
      await firebaseService.createExamAttempt(attempt);
      set((state) => ({ 
        examAttempts: [...state.examAttempts, attempt],
        currentAttempt: attempt,
      }));
      
      return attempt;
    } catch (error) {
      console.error('Error starting exam attempt:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to start exam' });
      throw error; // Re-throw to let caller handle it
    }
  },
  
  updateExamAttempt: async (attemptId, updates) => {
    try {
      await firebaseService.updateExamAttempt(attemptId, updates);
      set((state) => ({
        examAttempts: state.examAttempts.map(attempt => 
          attempt.id === attemptId ? { ...attempt, ...updates } : attempt
        ),
        currentAttempt: state.currentAttempt?.id === attemptId 
          ? { ...state.currentAttempt, ...updates } 
          : state.currentAttempt,
      }));
    } catch (error) {
      console.error('Error updating exam attempt:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update attempt' });
    }
  },
  
  completeExamAttempt: async (attemptId) => {
    try {
      const updates = { status: 'completed' as const, endTime: new Date() };
      await firebaseService.updateExamAttempt(attemptId, updates);
      set((state) => ({
        examAttempts: state.examAttempts.map(attempt => 
          attempt.id === attemptId 
            ? { ...attempt, ...updates }
            : attempt
        ),
        currentAttempt: null,
      }));
    } catch (error) {
      console.error('Error completing exam attempt:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to complete attempt' });
    }
  },

  loadAttemptsByExam: async (examId) => {
    try {
      set({ isLoading: true, error: null });
      const attempts = await firebaseService.getAttemptsByExam(examId);
      set({ examAttempts: attempts, isLoading: false });
    } catch (error) {
      console.error('Error loading attempts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load attempts',
        isLoading: false
      });
    }
  },
}));
