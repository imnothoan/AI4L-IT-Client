import { ExamAttempt, Exam, User, Question } from '@/types';

/**
 * Analytics Service
 * Provides advanced analytics and reporting capabilities
 */

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  averageScore: number;
  totalExams: number;
  completedExams: number;
  averageTime: number;
  strongTopics: string[];
  weakTopics: string[];
}

export interface ExamStatistics {
  examId: string;
  examTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageCompletionTime: number;
  passRate: number;
  questionAnalysis: QuestionAnalysis[];
}

export interface QuestionAnalysis {
  questionId: string;
  question: string;
  topic: string;
  difficulty: number;
  correctRate: number;
  averageTime: number;
  totalAttempts: number;
}

export interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  activeStudents: number;
  averagePerformance: number;
  completionRate: number;
  topPerformers: StudentPerformance[];
  strugglingStudents: StudentPerformance[];
}

export interface TrendData {
  date: string;
  averageScore: number;
  totalExams: number;
  completionRate: number;
}

class AnalyticsService {
  /**
   * Calculate student performance metrics
   */
  calculateStudentPerformance(
    student: User,
    attempts: ExamAttempt[],
    exams: Exam[]
  ): StudentPerformance {
    const studentAttempts = attempts.filter(a => a.studentId === student.id);
    const completedAttempts = studentAttempts.filter(a => a.status === 'completed');

    const scores = completedAttempts
      .filter(a => a.score !== undefined)
      .map(a => a.score!);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Calculate average time
    const times = completedAttempts
      .filter(a => a.endTime)
      .map(a => (a.endTime!.getTime() - a.startTime.getTime()) / 1000 / 60); // minutes

    const averageTime = times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;

    // Analyze topics
    const topicScores: Record<string, { total: number; count: number }> = {};
    
    completedAttempts.forEach(attempt => {
      const exam = exams.find(e => e.id === attempt.examId);
      if (exam) {
        exam.questions.forEach(question => {
          const answer = attempt.answers[question.id];
          if (answer) {
            if (!topicScores[question.topic]) {
              topicScores[question.topic] = { total: 0, count: 0 };
            }
            const isCorrect = answer === question.correctAnswer?.toString();
            topicScores[question.topic].total += isCorrect ? 1 : 0;
            topicScores[question.topic].count += 1;
          }
        });
      }
    });

    const topicAverages = Object.entries(topicScores).map(([topic, data]) => ({
      topic,
      average: data.count > 0 ? data.total / data.count : 0,
    }));

    const sortedTopics = topicAverages.sort((a, b) => b.average - a.average);
    const strongTopics = sortedTopics.slice(0, 3).map(t => t.topic);
    const weakTopics = sortedTopics.slice(-3).map(t => t.topic);

    return {
      studentId: student.id,
      studentName: student.name,
      averageScore,
      totalExams: studentAttempts.length,
      completedExams: completedAttempts.length,
      averageTime,
      strongTopics,
      weakTopics,
    };
  }

  /**
   * Calculate exam statistics
   */
  calculateExamStatistics(
    exam: Exam,
    attempts: ExamAttempt[]
  ): ExamStatistics {
    const examAttempts = attempts.filter(a => a.examId === exam.id);
    const completedAttempts = examAttempts.filter(a => a.status === 'completed');

    const scores = completedAttempts
      .filter(a => a.score !== undefined)
      .map(a => a.score!);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Calculate completion time
    const times = completedAttempts
      .filter(a => a.endTime)
      .map(a => (a.endTime!.getTime() - a.startTime.getTime()) / 1000 / 60);

    const averageCompletionTime = times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;

    // Calculate pass rate (assuming 60% is passing)
    const passRate = scores.length > 0
      ? (scores.filter(s => s >= 60).length / scores.length) * 100
      : 0;

    // Question analysis
    const questionAnalysis = this.analyzeQuestions(exam.questions, completedAttempts);

    return {
      examId: exam.id,
      examTitle: exam.title,
      totalAttempts: examAttempts.length,
      completedAttempts: completedAttempts.length,
      averageScore,
      highestScore,
      lowestScore,
      averageCompletionTime,
      passRate,
      questionAnalysis,
    };
  }

  /**
   * Analyze individual question performance
   */
  private analyzeQuestions(
    questions: Question[],
    attempts: ExamAttempt[]
  ): QuestionAnalysis[] {
    return questions.map(question => {
      const answeredAttempts = attempts.filter(a => a.answers[question.id]);
      const correctAnswers = answeredAttempts.filter(
        a => a.answers[question.id] === question.correctAnswer?.toString()
      );

      const correctRate = answeredAttempts.length > 0
        ? (correctAnswers.length / answeredAttempts.length) * 100
        : 0;

      return {
        questionId: question.id,
        question: question.question,
        topic: question.topic,
        difficulty: question.difficulty,
        correctRate,
        averageTime: 0, // Would need time tracking per question
        totalAttempts: answeredAttempts.length,
      };
    });
  }

  /**
   * Calculate class analytics
   */
  calculateClassAnalytics(
    classData: any,
    students: User[],
    attempts: ExamAttempt[],
    exams: Exam[]
  ): ClassAnalytics {
    const studentPerformances = students.map(student =>
      this.calculateStudentPerformance(student, attempts, exams)
    );

    const activeStudents = studentPerformances.filter(p => p.totalExams > 0);
    
    const averagePerformance = activeStudents.length > 0
      ? activeStudents.reduce((sum, p) => sum + p.averageScore, 0) / activeStudents.length
      : 0;

    const totalCompleted = studentPerformances.reduce((sum, p) => sum + p.completedExams, 0);
    const totalAttempts = studentPerformances.reduce((sum, p) => sum + p.totalExams, 0);
    const completionRate = totalAttempts > 0
      ? (totalCompleted / totalAttempts) * 100
      : 0;

    const sortedByScore = [...studentPerformances].sort((a, b) => b.averageScore - a.averageScore);
    const topPerformers = sortedByScore.slice(0, 5);
    const strugglingStudents = sortedByScore
      .filter(p => p.averageScore < 60 && p.totalExams > 0)
      .slice(0, 5);

    return {
      classId: classData.id,
      className: classData.name,
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      averagePerformance,
      completionRate,
      topPerformers,
      strugglingStudents,
    };
  }

  /**
   * Generate trend data over time
   */
  generateTrendData(
    attempts: ExamAttempt[],
    days: number = 30
  ): TrendData[] {
    const now = new Date();
    const trends: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAttempts = attempts.filter(a => {
        const attemptDate = new Date(a.startTime);
        return attemptDate >= date && attemptDate < nextDate;
      });

      const completedAttempts = dayAttempts.filter(a => a.status === 'completed');
      const scores = completedAttempts
        .filter(a => a.score !== undefined)
        .map(a => a.score!);

      const averageScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      const completionRate = dayAttempts.length > 0
        ? (completedAttempts.length / dayAttempts.length) * 100
        : 0;

      trends.push({
        date: date.toISOString().split('T')[0],
        averageScore,
        totalExams: dayAttempts.length,
        completionRate,
      });
    }

    return trends;
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data: any[], headers: string[]): string {
    const rows = [headers.join(',')];
    
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      });
      rows.push(values.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const analyticsService = new AnalyticsService();
