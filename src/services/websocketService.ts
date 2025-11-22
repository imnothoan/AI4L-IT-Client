/**
 * WebSocket Service
 * Handles real-time communication with the server for:
 * - Live exam monitoring
 * - Real-time anti-cheat warnings
 * - Live student progress updates
 * - Instant notifications
 */

import { CheatWarning } from '@/types';
import { apiClient } from './apiClient';

export type WebSocketMessageType =
  | 'auth'
  | 'exam_started'
  | 'exam_progress'
  | 'exam_completed'
  | 'cheat_warning'
  | 'student_joined'
  | 'student_left'
  | 'answer_submitted'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
  timestamp?: number;
}

export interface MonitoringUpdate {
  attemptId: string;
  studentId: string;
  examId: string;
  progress: number;
  currentQuestion: number;
  timeRemaining: number;
  warnings: number;
}

export interface CheatWarningUpdate {
  attemptId: string;
  warning: CheatWarning;
}

type EventCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, EventCallback[]> = new Map();
  private isConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Connect to WebSocket server for real-time monitoring
   */
  connect(examId?: string): void {
    if (this.ws && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const path = examId ? `/ws/monitoring/${examId}` : '/ws/monitoring';
      this.ws = apiClient.createWebSocket(path);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected', null);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected', null);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message to server
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: EventCallback): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to exam monitoring updates
   */
  subscribeToExamMonitoring(examId: string, callback: (update: MonitoringUpdate) => void): void {
    this.on(`exam_${examId}_update`, callback);
  }

  /**
   * Subscribe to cheat warnings
   */
  subscribeToCheatWarnings(examId: string, callback: (warning: CheatWarningUpdate) => void): void {
    this.on(`exam_${examId}_warning`, callback);
  }

  /**
   * Report student progress
   */
  reportProgress(update: MonitoringUpdate): void {
    this.send({
      type: 'exam_progress',
      data: update,
      timestamp: Date.now(),
    });
  }

  /**
   * Report cheat warning
   */
  reportCheatWarning(warning: CheatWarningUpdate): void {
    this.send({
      type: 'cheat_warning',
      data: warning,
      timestamp: Date.now(),
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // ============ Private Methods ============

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'exam_progress':
        this.emit(`exam_${message.data.examId}_update`, message.data);
        break;

      case 'cheat_warning':
        this.emit(`exam_${message.data.examId}_warning`, message.data);
        break;

      case 'exam_started':
        this.emit('exam_started', message.data);
        break;

      case 'exam_completed':
        this.emit('exam_completed', message.data);
        break;

      case 'student_joined':
        this.emit('student_joined', message.data);
        break;

      case 'student_left':
        this.emit('student_left', message.data);
        break;

      case 'answer_submitted':
        this.emit('answer_submitted', message.data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => callback(data));
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', null);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
