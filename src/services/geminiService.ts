import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Question } from '@/types';

/**
 * Gemini AI Service (Google's Free Generative AI)
 * 
 * This service provides free AI capabilities using Google's Gemini API
 * - Free tier: 60 requests/minute, no credit card required
 * - Supports Vietnamese language very well
 * - Perfect for educational applications
 */

// Constants
const PLACEHOLDER_API_KEY = 'your_gemini_api_key_here';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (this.apiKey && this.apiKey !== PLACEHOLDER_API_KEY) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Check if Gemini is available
   */
  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Generate questions based on topic and difficulty
   * @param topic The subject/topic for questions
   * @param count Number of questions to generate
   * @param difficulty Difficulty level (0.0 to 1.0)
   * @param type Question type ('multiple-choice' or 'essay')
   * @param language Language for generation ('vi' for Vietnamese, 'en' for English)
   */
  async generateQuestions(
    topic: string,
    count: number = 5,
    difficulty: number = 0.5,
    type: 'multiple-choice' | 'essay' = 'multiple-choice',
    language: 'vi' | 'en' = 'vi'
  ): Promise<Question[]> {
    if (!this.model) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
    }

    try {
      const prompt = this.buildQuestionGenerationPrompt(topic, count, difficulty, type, language);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeneratedQuestions(text, topic, difficulty, type);
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate questions with enhanced context (NEW - Better for exam creation)
   * @param options Enhanced generation options with full context
   */
  async generateQuestionsWithContext(options: {
    subject: string;
    gradeLevel?: string; // 'Lớp 10', 'Lớp 11', 'THPT', 'Đại học'
    chapter?: string;
    topics?: string[];
    count: number;
    difficulty: number;
    cognitiveLevel?: string; // 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'
    type: 'multiple-choice' | 'essay';
    language?: 'vi' | 'en';
    additionalContext?: string; // Free-form context
  }): Promise<Question[]> {
    if (!this.model) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
    }

    try {
      const prompt = this.buildEnhancedQuestionPrompt(options);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const questions = this.parseGeneratedQuestions(
        text, 
        options.subject, 
        options.difficulty, 
        options.type
      );

      // Enhance questions with metadata
      return questions.map(q => ({
        ...q,
        subject: {
          main: options.subject,
          chapter: options.chapter,
          topic: options.topics?.join(', ')
        },
        gradeLevel: options.gradeLevel ? {
          system: this.parseGradeSystem(options.gradeLevel),
          grade: this.parseGradeNumber(options.gradeLevel),
          semester: null
        } : undefined,
        cognitiveLevel: options.cognitiveLevel ? {
          level: this.mapCognitiveLevelToBloom(options.cognitiveLevel),
          vietnameseLabel: options.cognitiveLevel as any
        } : undefined,
        source: 'Gemini AI (Enhanced Generation)',
        createdAt: new Date()
      }));
    } catch (error) {
      console.error('Error generating questions with enhanced context:', error);
      throw error;
    }
  }

  /**
   * Build enhanced prompt with full educational context
   */
  private buildEnhancedQuestionPrompt(options: {
    subject: string;
    gradeLevel?: string;
    chapter?: string;
    topics?: string[];
    count: number;
    difficulty: number;
    cognitiveLevel?: string;
    type: 'multiple-choice' | 'essay';
    language?: 'vi' | 'en';
    additionalContext?: string;
  }): string {
    const language = options.language || 'vi';
    const difficultyLabel = options.difficulty < 0.3 ? 'dễ' : options.difficulty < 0.7 ? 'trung bình' : 'khó';

    if (language === 'vi') {
      let prompt = `BẠN LÀ: Giáo viên ${options.subject} giàu kinh nghiệm, chuyên gia về thiết kế đề thi.

NHIỆM VỤ: Tạo ${options.count} câu hỏi ${options.type === 'multiple-choice' ? 'trắc nghiệm' : 'tự luận'} chất lượng cao.

THÔNG TIN CHI TIẾT:
- Môn học: ${options.subject}`;

      if (options.gradeLevel) {
        prompt += `\n- Khối lớp: ${options.gradeLevel}`;
      }

      if (options.chapter) {
        prompt += `\n- Chương: ${options.chapter}`;
      }

      if (options.topics && options.topics.length > 0) {
        prompt += `\n- Chủ đề cụ thể: ${options.topics.join(', ')}`;
      }

      prompt += `\n- Mức độ: ${difficultyLabel} (${options.difficulty.toFixed(1)})`;

      if (options.cognitiveLevel) {
        prompt += `\n- Mức độ nhận thức: ${options.cognitiveLevel}`;
      }

      if (options.additionalContext) {
        prompt += `\n- Yêu cầu thêm: ${options.additionalContext}`;
      }

      if (options.type === 'multiple-choice') {
        prompt += `

YÊU CẦU CHẤT LƯỢNG:
✓ Theo chương trình ${options.subject} ${options.gradeLevel || 'hiện hành'}
✓ Sát với kiến thức trong SGK và tài liệu tham khảo
✓ 4 đáp án (A, B, C, D) - chỉ 1 đáp án đúng
✓ Các đáp án sai phải hợp lý, gây nhầm lẫn (common mistakes)
✓ Ngôn ngữ rõ ràng, chính xác về mặt khoa học
✓ Độ khó phù hợp với mức độ ${difficultyLabel}`;

        if (options.cognitiveLevel === 'Nhận biết') {
          prompt += `
✓ Kiểm tra khả năng nhớ, nhận biết khái niệm, công thức, định nghĩa`;
        } else if (options.cognitiveLevel === 'Thông hiểu') {
          prompt += `
✓ Kiểm tra khả năng hiểu, giải thích, so sánh, phân loại`;
        } else if (options.cognitiveLevel === 'Vận dụng') {
          prompt += `
✓ Kiểm tra khả năng áp dụng kiến thức vào bài tập, tình huống cụ thể`;
        } else if (options.cognitiveLevel === 'Vận dụng cao') {
          prompt += `
✓ Kiểm tra khả năng phân tích, tổng hợp, giải quyết vấn đề phức tạp`;
        }

        prompt += `

OUTPUT FORMAT - JSON Array:
[
  {
    "question": "Nội dung câu hỏi (rõ ràng, đầy đủ thông tin)",
    "options": [
      "A) Đáp án A (đúng hoặc sai)",
      "B) Đáp án B", 
      "C) Đáp án C",
      "D) Đáp án D"
    ],
    "correctAnswer": 0,
    "explanation": "Giải thích chi tiết: Tại sao đáp án này đúng? Tại sao các đáp án khác sai?"
  }
]

CHÚ Ý: Chỉ trả về JSON array, KHÔNG thêm bất kỳ text nào khác.`;
      } else {
        // Essay questions
        prompt += `

YÊU CẦU CHẤT LƯỢNG:
✓ Câu hỏi mở, yêu cầu phân tích, giải thích, đánh giá
✓ Theo chương trình ${options.subject} ${options.gradeLevel || 'hiện hành'}
✓ Liệt kê các ý chính học sinh cần trình bày
✓ Đề xuất tiêu chí chấm điểm cụ thể
✓ Gợi ý độ dài bài làm hợp lý

OUTPUT FORMAT - JSON Array:
[
  {
    "question": "Nội dung câu hỏi tự luận (yêu cầu rõ ràng)",
    "keyPoints": [
      "Điểm chính 1 cần có trong bài làm",
      "Điểm chính 2",
      "Điểm chính 3"
    ],
    "rubric": "Tiêu chí chấm điểm chi tiết (Nội dung: X điểm, Cấu trúc: Y điểm, ...)",
    "suggestedLength": "150-200 từ"
  }
]

CHÚ Ý: Chỉ trả về JSON array, KHÔNG thêm bất kỳ text nào khác.`;
      }

      return prompt;
    } else {
      // English version
      let prompt = `YOU ARE: An experienced ${options.subject} teacher and expert in test design.

TASK: Create ${options.count} high-quality ${options.type === 'multiple-choice' ? 'multiple-choice' : 'essay'} questions.

DETAILED CONTEXT:
- Subject: ${options.subject}`;

      if (options.gradeLevel) {
        prompt += `\n- Grade Level: ${options.gradeLevel}`;
      }

      if (options.chapter) {
        prompt += `\n- Chapter: ${options.chapter}`;
      }

      if (options.topics && options.topics.length > 0) {
        prompt += `\n- Specific Topics: ${options.topics.join(', ')}`;
      }

      prompt += `\n- Difficulty: ${difficultyLabel} (${options.difficulty.toFixed(1)})`;

      if (options.cognitiveLevel) {
        prompt += `\n- Cognitive Level: ${options.cognitiveLevel}`;
      }

      if (options.additionalContext) {
        prompt += `\n- Additional Requirements: ${options.additionalContext}`;
      }

      if (options.type === 'multiple-choice') {
        prompt += `

QUALITY REQUIREMENTS:
✓ Aligned with ${options.subject} ${options.gradeLevel || 'curriculum'}
✓ 4 options (A, B, C, D) - only one correct
✓ Distractors should be plausible (common mistakes)
✓ Clear, scientifically accurate language
✓ Appropriate for ${difficultyLabel} difficulty

OUTPUT FORMAT - JSON Array:
[
  {
    "question": "Clear, complete question text",
    "options": [
      "A) Option A (correct or incorrect)",
      "B) Option B",
      "C) Option C", 
      "D) Option D"
    ],
    "correctAnswer": 0,
    "explanation": "Detailed explanation: Why is this correct? Why are others wrong?"
  }
]

NOTE: Return ONLY the JSON array, no additional text.`;
      } else {
        prompt += `

QUALITY REQUIREMENTS:
✓ Open-ended questions requiring analysis/evaluation
✓ Aligned with ${options.subject} ${options.gradeLevel || 'curriculum'}
✓ List key points students should address
✓ Specific grading criteria
✓ Suggested answer length

OUTPUT FORMAT - JSON Array:
[
  {
    "question": "Clear essay question with requirements",
    "keyPoints": [
      "Key point 1 to address",
      "Key point 2",
      "Key point 3"
    ],
    "rubric": "Detailed grading criteria (Content: X points, Structure: Y points, ...)",
    "suggestedLength": "150-200 words"
  }
]

NOTE: Return ONLY the JSON array, no additional text.`;
      }

      return prompt;
    }
  }

  /**
   * Helper methods for metadata mapping
   */
  private parseGradeSystem(gradeLevel: string): 'elementary' | 'middle-school' | 'high-school' | 'university' | 'other' {
    if (gradeLevel.includes('Tiểu học') || gradeLevel.match(/Lớp [1-5]/)) {
      return 'elementary';
    } else if (gradeLevel.includes('THCS') || gradeLevel.match(/Lớp [6-9]/)) {
      return 'middle-school';
    } else if (gradeLevel.includes('THPT') || gradeLevel.match(/Lớp (10|11|12)/)) {
      return 'high-school';
    } else if (gradeLevel.includes('Đại học') || gradeLevel.includes('University')) {
      return 'university';
    }
    return 'other';
  }

  private parseGradeNumber(gradeLevel: string): number | null {
    const match = gradeLevel.match(/Lớp (\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  private mapCognitiveLevelToBloom(vietnameseLevel: string): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
    // Map Vietnamese 4-level system to Bloom's 6-level taxonomy
    // Vietnamese education typically uses 4 levels that map as follows:
    const mapping: Record<string, 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'> = {
      'Nhận biết': 'remember',       // Knowledge/Remember
      'Thông hiểu': 'understand',    // Comprehension/Understand
      'Vận dụng': 'apply',           // Application/Apply
      'Vận dụng cao': 'analyze'      // Higher-order thinking (includes Analyze, Evaluate, Create)
    };
    return mapping[vietnameseLevel] || 'understand';
  }

  /**
   * Grade an essay using Gemini AI
   * @param question The essay question
   * @param studentAnswer The student's answer
   * @param rubric Optional grading rubric
   * @param maxScore Maximum possible score
   */
  async gradeEssay(
    question: string,
    studentAnswer: string,
    rubric?: string,
    maxScore: number = 100
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    breakdown?: Record<string, number>;
  }> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = this.buildEssayGradingPrompt(question, studentAnswer, rubric, maxScore);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseEssayGradingResult(text, maxScore);
    } catch (error) {
      console.error('Error grading essay with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate feedback for a student's answer
   */
  async generateFeedback(
    question: string,
    studentAnswer: string,
    correctAnswer?: string
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const prompt = `
Bạn là một giáo viên chuyên nghiệp. Hãy đưa ra phản hồi chi tiết cho câu trả lời của học sinh.

Câu hỏi: ${question}

Câu trả lời của học sinh: ${studentAnswer}

${correctAnswer ? `Đáp án đúng: ${correctAnswer}` : ''}

Hãy đưa ra phản hồi:
1. Đánh giá câu trả lời
2. Điểm mạnh (nếu có)
3. Điểm cần cải thiện
4. Gợi ý để học tốt hơn

Phản hồi của bạn:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating feedback with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate a summary or explanation of a topic
   */
  async generateExplanation(topic: string, level: 'basic' | 'intermediate' | 'advanced' = 'intermediate'): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const levelText = {
        basic: 'cơ bản, dễ hiểu',
        intermediate: 'trung bình',
        advanced: 'nâng cao, chuyên sâu'
      }[level];

      const prompt = `Hãy giải thích về "${topic}" ở mức độ ${levelText}. Sử dụng ví dụ cụ thể và dễ hiểu.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating explanation with Gemini:', error);
      throw error;
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildQuestionGenerationPrompt(
    topic: string,
    count: number,
    difficulty: number,
    type: 'multiple-choice' | 'essay',
    language: 'vi' | 'en'
  ): string {
    const difficultyLabel = difficulty < 0.3 ? 'dễ' : difficulty < 0.7 ? 'trung bình' : 'khó';
    
    if (type === 'multiple-choice') {
      if (language === 'vi') {
        return `Tạo ${count} câu hỏi trắc nghiệm về "${topic}" ở mức độ ${difficultyLabel}.

Yêu cầu:
- Mỗi câu hỏi có 4 đáp án (A, B, C, D)
- Chỉ có 1 đáp án đúng
- Các đáp án phải hợp lý và gây nhầm lẫn
- Đảm bảo chất lượng học thuật

Trả về dưới dạng JSON array với cấu trúc:
[
  {
    "question": "Nội dung câu hỏi",
    "options": ["A) Đáp án A", "B) Đáp án B", "C) Đáp án C", "D) Đáp án D"],
    "correctAnswer": 0,
    "explanation": "Giải thích ngắn gọn"
  }
]

Chỉ trả về JSON, không thêm text khác.`;
      } else {
        return `Generate ${count} multiple-choice questions about "${topic}" at ${difficultyLabel} difficulty level.

Requirements:
- Each question has 4 options (A, B, C, D)
- Only one correct answer
- Distractors should be plausible
- Ensure academic quality

Return as JSON array with structure:
[
  {
    "question": "Question text",
    "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation"
  }
]

Return only JSON, no additional text.`;
      }
    } else {
      if (language === 'vi') {
        return `Tạo ${count} câu hỏi tự luận về "${topic}" ở mức độ ${difficultyLabel}.

Yêu cầu:
- Câu hỏi mở, yêu cầu phân tích và giải thích
- Liệt kê các điểm chính cần có trong câu trả lời
- Đề xuất tiêu chí chấm điểm

Trả về dưới dạng JSON array với cấu trúc:
[
  {
    "question": "Nội dung câu hỏi tự luận",
    "keyPoints": ["Điểm 1", "Điểm 2", "Điểm 3"],
    "rubric": "Tiêu chí chấm điểm",
    "suggestedLength": "100-200 từ"
  }
]

Chỉ trả về JSON, không thêm text khác.`;
      } else {
        return `Generate ${count} essay questions about "${topic}" at ${difficultyLabel} difficulty level.

Requirements:
- Open-ended questions requiring analysis
- List key points for ideal answers
- Suggest grading rubric

Return as JSON array with structure:
[
  {
    "question": "Essay question text",
    "keyPoints": ["Point 1", "Point 2", "Point 3"],
    "rubric": "Grading criteria",
    "suggestedLength": "100-200 words"
  }
]

Return only JSON, no additional text.`;
      }
    }
  }

  /**
   * Build prompt for essay grading
   */
  private buildEssayGradingPrompt(
    question: string,
    studentAnswer: string,
    rubric: string | undefined,
    maxScore: number
  ): string {
    return `Bạn là giáo viên chuyên nghiệp đang chấm bài tự luận.

Câu hỏi: "${question}"

Bài làm của học sinh:
"${studentAnswer}"

${rubric ? `Tiêu chí chấm điểm:\n${rubric}` : `
Tiêu chí chấm điểm (${maxScore} điểm):
- Nội dung: 40%
- Cấu trúc và logic: 30%
- Ngữ pháp và chính tả: 20%
- Sáng tạo và độc đáo: 10%
`}

Yêu cầu trả về JSON với cấu trúc:
{
  "score": 85,
  "feedback": "Nhận xét tổng quát về bài làm",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "improvements": ["Cần cải thiện 1", "Cần cải thiện 2"],
  "breakdown": {
    "content": 35,
    "structure": 28,
    "grammar": 18,
    "creativity": 9
  }
}

Chỉ trả về JSON, không thêm text khác.`;
  }

  /**
   * Parse generated questions from Gemini response
   */
  private parseGeneratedQuestions(
    text: string,
    topic: string,
    difficulty: number,
    type: 'multiple-choice' | 'essay'
  ): Question[] {
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      
      jsonText = jsonText.trim();
      
      // Try to find JSON array with more precise pattern
      // Look for array that starts with [ and ends with ] at the same nesting level
      const arrayMatch = jsonText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (!arrayMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(arrayMatch[0]);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.map((q: any, index: number) => {
        if (type === 'multiple-choice') {
          return {
            id: `gemini-mc-${Date.now()}-${index}`,
            type: 'multiple-choice' as const,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer ?? 0,
            difficulty,
            topic,
            points: 10,
            version: 1,
          };
        } else {
          return {
            id: `gemini-essay-${Date.now()}-${index}`,
            type: 'essay' as const,
            question: q.question,
            difficulty,
            topic,
            points: 20,
            keyPoints: q.keyPoints,
            rubric: q.rubric,
            version: 1,
          };
        }
      });
    } catch (error) {
      console.error('Error parsing generated questions:', error);
      console.log('Raw response:', text);
      throw new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse essay grading result
   */
  private parseEssayGradingResult(
    text: string,
    maxScore: number
  ): {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    breakdown?: Record<string, number>;
  } {
    try {
      // Extract JSON from the response
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3);
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      
      jsonText = jsonText.trim();
      
      // Try to find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        score: Math.min(parsed.score || 0, maxScore),
        feedback: parsed.feedback || 'No feedback provided',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        breakdown: parsed.breakdown,
      };
    } catch (error) {
      console.error('Error parsing essay grading result:', error);
      console.log('Raw response:', text);
      
      // Return default result if parsing fails
      return {
        score: 0,
        feedback: 'Unable to parse grading result. Please check the response format.',
        strengths: [],
        improvements: [],
      };
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
