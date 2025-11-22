/**
 * API Client Service
 * Centralized HTTP client for communicating with the Intelligence Test Server
 * 
 * This service handles all HTTP requests to the backend server, including:
 * - Authentication (login, logout, token management)
 * - User management
 * - Exam operations
 * - Class management
 * - Question bank
 * - Real-time monitoring
 * - Analytics
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { User, Exam, Class, ExamAttempt, Question, CheatWarning } from '@/types';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ExamStatistics {
  examId: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTime: number;
  scoreDistribution: Record<string, number>;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load tokens from localStorage
    this.loadTokens();

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle token refresh on 401
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;
          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============ Token Management ============

  private loadTokens(): void {
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(token: string, refreshToken: string): void {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await this.client.post<ApiResponse<{ token: string }>>('/auth/refresh', {
      refreshToken: this.refreshToken,
    });
    
    if (response.data.success && response.data.data) {
      this.token = response.data.data.token;
      localStorage.setItem('accessToken', this.token);
      return this.token;
    }
    
    throw new Error('Failed to refresh token');
  }

  // ============ Authentication ============

  async login(email: string, password: string, role: 'instructor' | 'student'): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
      role,
    });
    
    if (response.data.success && response.data.data) {
      this.saveTokens(response.data.data.token, response.data.data.refreshToken);
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Login failed');
  }

  async register(email: string, password: string, name: string, role: 'instructor' | 'student'): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/register', {
      email,
      password,
      name,
      role,
    });
    
    if (response.data.success && response.data.data) {
      this.saveTokens(response.data.data.token, response.data.data.refreshToken);
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout', {
        refreshToken: this.refreshToken,
      });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get current user');
  }

  // ============ User Operations ============

  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>(`/users/${userId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get user');
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await this.client.put<ApiResponse<User>>(`/users/${userId}`, updates);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update user');
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const response = await this.client.get<ApiResponse<User>>(`/users/email/${email}`);
    return response.data.data || null;
  }

  // ============ Exam Operations ============

  async createExam(exam: Omit<Exam, 'id' | 'createdAt'>): Promise<Exam> {
    const response = await this.client.post<ApiResponse<Exam>>('/exams', exam);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to create exam');
  }

  async getExam(examId: string): Promise<Exam> {
    const response = await this.client.get<ApiResponse<Exam>>(`/exams/${examId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get exam');
  }

  async updateExam(examId: string, updates: Partial<Exam>): Promise<Exam> {
    const response = await this.client.put<ApiResponse<Exam>>(`/exams/${examId}`, updates);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update exam');
  }

  async deleteExam(examId: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/exams/${examId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete exam');
    }
  }

  async getExamsByInstructor(instructorId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Exam>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<Exam>>>(`/exams/instructor/${instructorId}`, {
      params: { page, pageSize },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get exams');
  }

  async getExamsByClass(classId: string): Promise<Exam[]> {
    const response = await this.client.get<ApiResponse<Exam[]>>(`/exams/class/${classId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get exams');
  }

  async getAvailableExamsForStudent(studentId: string): Promise<Exam[]> {
    const response = await this.client.get<ApiResponse<Exam[]>>(`/exams/student/${studentId}/available`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get available exams');
  }

  // ============ Class Operations ============

  async createClass(classData: Omit<Class, 'id' | 'createdAt'>): Promise<Class> {
    const response = await this.client.post<ApiResponse<Class>>('/classes', classData);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to create class');
  }

  async getClass(classId: string): Promise<Class> {
    const response = await this.client.get<ApiResponse<Class>>(`/classes/${classId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get class');
  }

  async updateClass(classId: string, updates: Partial<Class>): Promise<Class> {
    const response = await this.client.put<ApiResponse<Class>>(`/classes/${classId}`, updates);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update class');
  }

  async deleteClass(classId: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/classes/${classId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete class');
    }
  }

  async getClassesByInstructor(instructorId: string): Promise<Class[]> {
    const response = await this.client.get<ApiResponse<Class[]>>(`/classes/instructor/${instructorId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get classes');
  }

  async addStudentToClass(classId: string, studentId: string): Promise<Class> {
    const response = await this.client.post<ApiResponse<Class>>(`/classes/${classId}/students`, {
      studentId,
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to add student to class');
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<Class> {
    const response = await this.client.delete<ApiResponse<Class>>(`/classes/${classId}/students/${studentId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to remove student from class');
  }

  // ============ Question Bank Operations ============

  async createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    const response = await this.client.post<ApiResponse<Question>>('/questions', question);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to create question');
  }

  async getQuestion(questionId: string): Promise<Question> {
    const response = await this.client.get<ApiResponse<Question>>(`/questions/${questionId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get question');
  }

  async updateQuestion(questionId: string, updates: Partial<Question>): Promise<Question> {
    const response = await this.client.put<ApiResponse<Question>>(`/questions/${questionId}`, updates);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update question');
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/questions/${questionId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete question');
    }
  }

  async searchQuestions(filters: {
    topic?: string;
    difficulty?: number;
    type?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Question>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<Question>>>('/questions/search', {
      params: filters,
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to search questions');
  }

  // ============ Exam Attempt Operations ============

  async startExamAttempt(examId: string): Promise<ExamAttempt> {
    const response = await this.client.post<ApiResponse<ExamAttempt>>(`/exams/${examId}/attempts`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to start exam attempt');
  }

  async getExamAttempt(attemptId: string): Promise<ExamAttempt> {
    const response = await this.client.get<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get exam attempt');
  }

  async updateExamAttempt(attemptId: string, updates: Partial<ExamAttempt>): Promise<ExamAttempt> {
    const response = await this.client.put<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}`, updates);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update exam attempt');
  }

  async submitExamAttempt(attemptId: string, answers: Record<string, string>): Promise<ExamAttempt> {
    const response = await this.client.post<ApiResponse<ExamAttempt>>(`/attempts/${attemptId}/submit`, {
      answers,
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to submit exam attempt');
  }

  async getAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    const response = await this.client.get<ApiResponse<ExamAttempt[]>>(`/exams/${examId}/attempts`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get exam attempts');
  }

  async getAttemptsByStudent(studentId: string): Promise<ExamAttempt[]> {
    const response = await this.client.get<ApiResponse<ExamAttempt[]>>(`/students/${studentId}/attempts`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get student attempts');
  }

  // ============ Anti-Cheat & Monitoring ============

  async reportCheatWarning(attemptId: string, warning: Omit<CheatWarning, 'id'>): Promise<CheatWarning> {
    const response = await this.client.post<ApiResponse<CheatWarning>>(`/attempts/${attemptId}/warnings`, warning);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to report warning');
  }

  async getActiveExamSessions(examId: string): Promise<ExamAttempt[]> {
    const response = await this.client.get<ApiResponse<ExamAttempt[]>>(`/exams/${examId}/sessions/active`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get active sessions');
  }

  async getFlaggedAttempts(examId: string): Promise<ExamAttempt[]> {
    const response = await this.client.get<ApiResponse<ExamAttempt[]>>(`/exams/${examId}/attempts/flagged`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get flagged attempts');
  }

  // ============ Analytics ============

  async getExamStatistics(examId: string): Promise<ExamStatistics> {
    const response = await this.client.get<ApiResponse<ExamStatistics>>(`/exams/${examId}/statistics`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get exam statistics');
  }

  async getQuestionAnalytics(examId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/exams/${examId}/analytics/questions`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get question analytics');
  }

  async getStudentPerformance(studentId: string, timeRange?: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(`/students/${studentId}/performance`, {
      params: { timeRange },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to get student performance');
  }

  // ============ WebSocket for Real-time Features ============

  createWebSocket(path: string): WebSocket {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws').replace('/api', '') + path;
    const ws = new WebSocket(wsUrl);
    
    // Add authentication
    ws.addEventListener('open', () => {
      if (this.token) {
        ws.send(JSON.stringify({ type: 'auth', token: this.token }));
      }
    });
    
    return ws;
  }

  // ============ Health Check ============

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse>('/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
