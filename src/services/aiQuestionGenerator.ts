import { Question } from '@/types';
import { geminiService } from './geminiService';

/**
 * AI Service for Question Generation
 * Supports multiple AI providers with automatic fallback:
 * 1. Google Gemini (Free, recommended)
 * 2. OpenAI (Paid)
 * 3. Mock questions (fallback)
 */

// Constants
const PLACEHOLDER_OPENAI_KEY = 'your_openai_api_key_here';

export class AIQuestionGenerator {
  private openaiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Generate questions based on topic and difficulty
   * Automatically tries Gemini first (free), then OpenAI, then mock data
   */
  async generateQuestions(
    topic: string,
    count: number = 5,
    difficulty: number = 0.5,
    type: 'multiple-choice' | 'essay' = 'multiple-choice',
    language: 'vi' | 'en' = 'vi'
  ): Promise<Question[]> {
    // Try Gemini first (free and recommended)
    if (geminiService.isAvailable()) {
      try {
        console.log('Using Gemini AI for question generation...');
        return await geminiService.generateQuestions(topic, count, difficulty, type, language);
      } catch (error) {
        console.error('Gemini generation failed, trying OpenAI...', error);
      }
    }

    // Fallback to OpenAI if Gemini fails or not available
    if (this.openaiKey && this.openaiKey !== PLACEHOLDER_OPENAI_KEY) {
      try {
        console.log('Using OpenAI for question generation...');
        return await this.generateWithOpenAI(topic, count, difficulty, type);
      } catch (error) {
        console.error('OpenAI generation failed, using mock questions...', error);
      }
    }

    // Final fallback to mock questions
    console.log('Using mock questions (no AI API configured)');
    return this.generateMockQuestions(topic, count, difficulty, type);
  }

  /**
   * Generate questions using OpenAI API
   */
  private async generateWithOpenAI(
    topic: string,
    count: number,
    difficulty: number,
    type: 'multiple-choice' | 'essay'
  ): Promise<Question[]> {
    const prompt = this.buildPrompt(topic, count, difficulty, type);

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator that generates high-quality exam questions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return this.parseGeneratedQuestions(content, topic, difficulty);
  }

  /**
   * Build enhanced prompt for AI model with better quality control
   */
  private buildPrompt(
    topic: string,
    count: number,
    difficulty: number,
    type: string
  ): string {
    const difficultyLabel = difficulty < 0.3 ? 'easy' : difficulty < 0.7 ? 'medium' : 'hard';
    const difficultyDescription = difficulty < 0.3
      ? 'suitable for beginners, testing basic understanding'
      : difficulty < 0.7
        ? 'requiring deeper understanding and application'
        : 'challenging, requiring critical thinking and mastery';

    if (type === 'multiple-choice') {
      return `You are an expert educational content creator. Generate ${count} HIGH-QUALITY ${difficultyLabel} multiple-choice questions about "${topic}".

QUALITY REQUIREMENTS:
1. Questions must be clear, unambiguous, and academically rigorous
2. Each question should test a specific concept or skill
3. Correct answers must be definitively correct
4. Distractors (wrong options) should be plausible but clearly incorrect to someone who understands the material
5. Avoid trivial questions that test memorization rather than understanding
6. Questions should be ${difficultyDescription}

For each question, provide:
- **question**: The question text (clear and specific)
- **options**: Array of 4 options (without letters A, B, C, D - just the text)
- **correctAnswer**: Index of correct option (0-3)
- **explanation**: Brief explanation why the answer is correct and why others are wrong (2-3 sentences)
- **bloom_level**: One of ["remember", "understand", "apply", "analyze", "evaluate", "create"]

EXAMPLE FORMAT (for topic "Calculus - Derivatives"):
[{
  "question": "If f(x) = 3x² + 2x - 5, what is f'(x)?",
  "options": [
    "6x + 2",
    "3x + 2",
    "6x² + 2x",
    "3x² + 2"
  ],
  "correctAnswer": 0,
  "explanation": "Using the power rule, the derivative of 3x² is 6x, and the derivative of 2x is 2. The constant -5 becomes 0. Therefore f'(x) = 6x + 2.",
  "bloom_level": "apply"
}]

Now generate ${count} questions about "${topic}". Return ONLY the JSON array, no additional text.`;
    } else {
      return `Generate ${count} ${difficultyLabel} essay questions about ${topic}.
For each question, provide:
      1. The question prompt
      2. Key points that should be covered
      3. Suggested rubric

      Format as JSON array.`;
    }
  }

  /**
   * Parse AI-generated questions
   */
  private parseGeneratedQuestions(
    content: string,
    topic: string,
    difficulty: number
  ): Question[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map((q: any, index: number) => ({
        id: `generated - ${Date.now()} -${index} `,
        type: 'multiple-choice' as const,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty,
        topic,
        points: 10,
      }));
    } catch (error) {
      console.error('Error parsing generated questions:', error);
      return [];
    }
  }

  /**
   * Generate mock questions for demo/testing
   */
  private generateMockQuestions(
    topic: string,
    count: number,
    difficulty: number,
    type: 'multiple-choice' | 'essay'
  ): Question[] {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
      if (type === 'multiple-choice') {
        questions.push({
          id: `mock - ${Date.now()} -${i} `,
          type: 'multiple-choice',
          question: `Sample question ${i + 1} about ${topic}?`,
          options: [
            'Option A',
            'Option B',
            'Option C',
            'Option D',
          ],
          correctAnswer: 0,
          difficulty,
          topic,
          points: 10,
          version: 1,
        });
      } else {
        questions.push({
          id: `mock - essay - ${Date.now()} -${i} `,
          type: 'essay',
          question: `Discuss and explain the key concepts of ${topic}. Provide detailed examples.`,
          difficulty,
          topic,
          points: 20,
          version: 1,
        });
      }
    }

    return questions;
  }
}

// Export singleton instance
export const aiQuestionGenerator = new AIQuestionGenerator();
