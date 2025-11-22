import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from '@/config/firebase';
import { User, Exam, Class, ExamAttempt, Question } from '@/types';

/**
 * Firebase Database Service
 * Handles all database operations with fallback to local storage in dev mode
 */

class FirebaseService {
  private useFirebase: boolean;

  constructor() {
    this.useFirebase = hasFirebaseConfig;
  }

  // ============ User Operations ============

  async createUser(user: User): Promise<void> {
    if (!this.useFirebase) {
      this.saveToLocalStorage('users', user.id, user);
      return;
    }
    await setDoc(doc(db, 'users', user.id), this.toFirestoreData(user));
  }

  async getUser(userId: string): Promise<User | null> {
    if (!this.useFirebase) {
      return this.getFromLocalStorage('users', userId);
    }
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? this.fromFirestoreData(docSnap.data()) as User : null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (!this.useFirebase) {
      const user = this.getFromLocalStorage('users', userId);
      if (user) {
        this.saveToLocalStorage('users', userId, { ...user, ...updates });
      }
      return;
    }
    await updateDoc(doc(db, 'users', userId), this.toFirestoreData(updates));
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.useFirebase) {
      const users = this.getAllFromLocalStorage('users');
      return users.find((u: User) => u.email === email) || null;
    }
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : this.fromFirestoreData(querySnapshot.docs[0].data()) as User;
  }

  // ============ Exam Operations ============

  async createExam(exam: Exam): Promise<string> {
    if (!this.useFirebase) {
      this.saveToLocalStorage('exams', exam.id, exam);
      return exam.id;
    }
    const docRef = await addDoc(collection(db, 'exams'), this.toFirestoreData(exam));
    return docRef.id;
  }

  async getExam(examId: string): Promise<Exam | null> {
    if (!this.useFirebase) {
      return this.getFromLocalStorage('exams', examId);
    }
    const docSnap = await getDoc(doc(db, 'exams', examId));
    return docSnap.exists() ? this.fromFirestoreData(docSnap.data()) as Exam : null;
  }

  async updateExam(examId: string, updates: Partial<Exam>): Promise<void> {
    if (!this.useFirebase) {
      const exam = this.getFromLocalStorage('exams', examId);
      if (exam) {
        this.saveToLocalStorage('exams', examId, { ...exam, ...updates });
      }
      return;
    }
    await updateDoc(doc(db, 'exams', examId), this.toFirestoreData(updates));
  }

  async deleteExam(examId: string): Promise<void> {
    if (!this.useFirebase) {
      this.removeFromLocalStorage('exams', examId);
      return;
    }
    await deleteDoc(doc(db, 'exams', examId));
  }

  async getExamsByInstructor(instructorId: string): Promise<Exam[]> {
    if (!this.useFirebase) {
      const exams = this.getAllFromLocalStorage('exams');
      return exams.filter((e: Exam) => e.instructorId === instructorId);
    }
    const q = query(collection(db, 'exams'), where('instructorId', '==', instructorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.fromFirestoreData(doc.data()) as Exam);
  }

  async getExamsByClass(classId: string): Promise<Exam[]> {
    if (!this.useFirebase) {
      const exams = this.getAllFromLocalStorage('exams');
      return exams.filter((e: Exam) => e.classId === classId);
    }
    const q = query(collection(db, 'exams'), where('classId', '==', classId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.fromFirestoreData(doc.data()) as Exam);
  }

  // ============ Class Operations ============

  async createClass(classData: Class): Promise<string> {
    if (!this.useFirebase) {
      this.saveToLocalStorage('classes', classData.id, classData);
      return classData.id;
    }
    const docRef = await addDoc(collection(db, 'classes'), this.toFirestoreData(classData));
    return docRef.id;
  }

  async getClass(classId: string): Promise<Class | null> {
    if (!this.useFirebase) {
      return this.getFromLocalStorage('classes', classId);
    }
    const docSnap = await getDoc(doc(db, 'classes', classId));
    return docSnap.exists() ? this.fromFirestoreData(docSnap.data()) as Class : null;
  }

  async updateClass(classId: string, updates: Partial<Class>): Promise<void> {
    if (!this.useFirebase) {
      const classData = this.getFromLocalStorage('classes', classId);
      if (classData) {
        this.saveToLocalStorage('classes', classId, { ...classData, ...updates });
      }
      return;
    }
    await updateDoc(doc(db, 'classes', classId), this.toFirestoreData(updates));
  }

  async getClassesByInstructor(instructorId: string): Promise<Class[]> {
    if (!this.useFirebase) {
      const classes = this.getAllFromLocalStorage('classes');
      return classes.filter((c: Class) => c.instructorId === instructorId);
    }
    const q = query(collection(db, 'classes'), where('instructorId', '==', instructorId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.fromFirestoreData(doc.data()) as Class);
  }

  // ============ Exam Attempt Operations ============

  async createExamAttempt(attempt: ExamAttempt): Promise<string> {
    if (!this.useFirebase) {
      this.saveToLocalStorage('examAttempts', attempt.id, attempt);
      return attempt.id;
    }
    const docRef = await addDoc(collection(db, 'examAttempts'), this.toFirestoreData(attempt));
    return docRef.id;
  }

  async getExamAttempt(attemptId: string): Promise<ExamAttempt | null> {
    if (!this.useFirebase) {
      return this.getFromLocalStorage('examAttempts', attemptId);
    }
    const docSnap = await getDoc(doc(db, 'examAttempts', attemptId));
    return docSnap.exists() ? this.fromFirestoreData(docSnap.data()) as ExamAttempt : null;
  }

  async updateExamAttempt(attemptId: string, updates: Partial<ExamAttempt>): Promise<void> {
    if (!this.useFirebase) {
      const attempt = this.getFromLocalStorage('examAttempts', attemptId);
      if (attempt) {
        this.saveToLocalStorage('examAttempts', attemptId, { ...attempt, ...updates });
      }
      return;
    }
    await updateDoc(doc(db, 'examAttempts', attemptId), this.toFirestoreData(updates));
  }

  async getAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    if (!this.useFirebase) {
      const attempts = this.getAllFromLocalStorage('examAttempts');
      return attempts.filter((a: ExamAttempt) => a.examId === examId);
    }
    const q = query(collection(db, 'examAttempts'), where('examId', '==', examId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.fromFirestoreData(doc.data()) as ExamAttempt);
  }

  async getAttemptsByStudent(studentId: string): Promise<ExamAttempt[]> {
    if (!this.useFirebase) {
      const attempts = this.getAllFromLocalStorage('examAttempts');
      return attempts.filter((a: ExamAttempt) => a.studentId === studentId);
    }
    const q = query(collection(db, 'examAttempts'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.fromFirestoreData(doc.data()) as ExamAttempt);
  }

  // ============ Question Bank Operations ============

  async createQuestion(question: Question): Promise<string> {
    if (!this.useFirebase) {
      this.saveToLocalStorage('questionBank', question.id, question);
      return question.id;
    }
    const docRef = await addDoc(collection(db, 'questionBank'), this.toFirestoreData(question));
    return docRef.id;
  }

  async getQuestion(questionId: string): Promise<Question | null> {
    if (!this.useFirebase) {
      return this.getFromLocalStorage('questionBank', questionId);
    }
    const docSnap = await getDoc(doc(db, 'questionBank', questionId));
    return docSnap.exists() ? this.fromFirestoreData(docSnap.data()) as Question : null;
  }

  async updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
    if (!this.useFirebase) {
      const question = this.getFromLocalStorage('questionBank', questionId);
      if (question) {
        this.saveToLocalStorage('questionBank', questionId, { ...question, ...updates });
      }
      return;
    }
    await updateDoc(doc(db, 'questionBank', questionId), this.toFirestoreData(updates));
  }

  async deleteQuestion(questionId: string): Promise<void> {
    if (!this.useFirebase) {
      this.removeFromLocalStorage('questionBank', questionId);
      return;
    }
    await deleteDoc(doc(db, 'questionBank', questionId));
  }

  async searchQuestions(filters: {
    topic?: string;
    difficulty?: number;
    type?: string;
  }): Promise<Question[]> {
    if (!this.useFirebase) {
      let questions = this.getAllFromLocalStorage('questionBank');
      if (filters.topic) {
        questions = questions.filter((q: Question) => q.topic === filters.topic);
      }
      if (filters.type) {
        questions = questions.filter((q: Question) => q.type === filters.type);
      }
      return questions;
    }

    const constraints: QueryConstraint[] = [];
    if (filters.topic) {
      constraints.push(where('topic', '==', filters.topic));
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }

    const q = query(collection(db, 'questionBank'), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.fromFirestoreData(doc.data()) as Question);
  }

  // ============ Real-time Subscriptions ============

  subscribeToExamAttempts(
    examId: string,
    callback: (attempts: ExamAttempt[]) => void
  ): (() => void) | null {
    if (!this.useFirebase) {
      // In dev mode, set up polling with 5-second interval
      const interval = setInterval(() => {
        const attempts = this.getAllFromLocalStorage('examAttempts').filter(
          (a: ExamAttempt) => a.examId === examId
        );
        callback(attempts);
      }, 5000); // Increased from 2000ms to 5000ms
      return () => clearInterval(interval);
    }

    const q = query(collection(db, 'examAttempts'), where('examId', '==', examId));
    return onSnapshot(q, (snapshot) => {
      const attempts = snapshot.docs.map(doc => 
        this.fromFirestoreData({ id: doc.id, ...doc.data() }) as ExamAttempt
      );
      callback(attempts);
    });
  }

  // ============ Helper Methods ============

  private toFirestoreData(data: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = Timestamp.fromDate(value);
      } else if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  private fromFirestoreData(data: any): any {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
        result[key] = (value as any).toDate();
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // ============ Local Storage Fallback ============

  private saveToLocalStorage(collection: string, id: string, data: any): void {
    const key = `${collection}_${id}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    // Also maintain a list of IDs for this collection
    const listKey = `${collection}_list`;
    const list = JSON.parse(localStorage.getItem(listKey) || '[]');
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(listKey, JSON.stringify(list));
    }
  }

  private getFromLocalStorage(collection: string, id: string): any {
    const key = `${collection}_${id}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private getAllFromLocalStorage(collection: string): any[] {
    const listKey = `${collection}_list`;
    const list = JSON.parse(localStorage.getItem(listKey) || '[]');
    return list.map((id: string) => this.getFromLocalStorage(collection, id)).filter(Boolean);
  }

  private removeFromLocalStorage(collection: string, id: string): void {
    const key = `${collection}_${id}`;
    localStorage.removeItem(key);
    
    const listKey = `${collection}_list`;
    const list = JSON.parse(localStorage.getItem(listKey) || '[]');
    const filtered = list.filter((item: string) => item !== id);
    localStorage.setItem(listKey, JSON.stringify(filtered));
  }
}

export const firebaseService = new FirebaseService();
