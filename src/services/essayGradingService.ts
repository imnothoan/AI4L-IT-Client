/**
 * Advanced Essay Grading Service
 * Supports multiple AI providers:
 * 1. Google Gemini (Free, recommended)
 * 2. OpenAI GPT-4 (Paid)
 * 3. Mock grading (fallback)
 */

import { geminiService } from './geminiService';

// Constants
const PLACEHOLDER_OPENAI_KEY = 'your_openai_api_key_here';

export interface Rubric {
  id: string;
  name: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  points: number;
  description: string;
}

export interface EssayGradeResult {
  score: number;
  maxScore: number;
  percentage: number;
  criteriaScores: CriteriaScore[];
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface CriteriaScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

class EssayGradingService {
  private openaiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Grade an essay using AI with rubric
   * Tries Gemini first (free), then OpenAI, then mock grading
   */
  async gradeEssay(
    essay: string,
    question: string,
    rubric: Rubric
  ): Promise<EssayGradeResult> {
    // Try Gemini first (free and recommended)
    if (geminiService.isAvailable()) {
      try {
        console.log('Using Gemini AI for essay grading...');
        const rubricText = this.formatRubricForAI(rubric);
        const result = await geminiService.gradeEssay(question, essay, rubricText, rubric.totalPoints);
        
        return this.formatGeminiResult(result, rubric);
      } catch (error) {
        console.error('Gemini grading failed, trying OpenAI...', error);
      }
    }

    // Fallback to OpenAI if Gemini fails or not available
    if (this.openaiKey && this.openaiKey !== PLACEHOLDER_OPENAI_KEY) {
      try {
        console.log('Using OpenAI for essay grading...');
        return await this.gradeWithOpenAI(essay, question, rubric);
      } catch (error) {
        console.error('OpenAI grading failed, using mock grading...', error);
      }
    }

    // Final fallback to mock grading
    console.log('Using mock grading (no AI API configured)');
    return this.mockGradeEssay(essay, rubric);
  }

  /**
   * Format rubric for AI processing
   */
  private formatRubricForAI(rubric: Rubric): string {
    let text = `${rubric.name} (Total: ${rubric.totalPoints} points)\n\n`;
    
    rubric.criteria.forEach((criterion, index) => {
      text += `${index + 1}. ${criterion.name} (${criterion.maxPoints} points)\n`;
      text += `   ${criterion.description}\n`;
      criterion.levels.forEach(level => {
        text += `   - ${level.points} pts: ${level.description}\n`;
      });
      text += '\n';
    });
    
    return text;
  }

  /**
   * Format Gemini result to match expected structure
   */
  private formatGeminiResult(
    geminiResult: {
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
      breakdown?: Record<string, number>;
    },
    rubric: Rubric
  ): EssayGradeResult {
    const criteriaScores: CriteriaScore[] = rubric.criteria.map(criterion => {
      const breakdownKey = criterion.id;
      const score = geminiResult.breakdown?.[breakdownKey] || 
                    (geminiResult.score / rubric.totalPoints) * criterion.maxPoints;
      
      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        score: Math.round(score * 10) / 10,
        maxScore: criterion.maxPoints,
        feedback: `Score for ${criterion.name}`,
      };
    });

    return {
      score: geminiResult.score,
      maxScore: rubric.totalPoints,
      percentage: (geminiResult.score / rubric.totalPoints) * 100,
      criteriaScores,
      feedback: geminiResult.feedback,
      strengths: geminiResult.strengths,
      improvements: geminiResult.improvements,
    };
  }

  /**
   * Grade essay using OpenAI API
   */
  private async gradeWithOpenAI(
    essay: string,
    question: string,
    rubric: Rubric
  ): Promise<EssayGradeResult> {
    const prompt = this.buildGradingPrompt(essay, question, rubric);

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational assessor who grades essays fairly and provides constructive feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return this.parseGradingResult(content, rubric);
  }

  /**
   * Build prompt for AI grading
   */
  private buildGradingPrompt(
    essay: string,
    question: string,
    rubric: Rubric
  ): string {
    let prompt = `Please grade the following essay based on the provided rubric.\n\n`;
    prompt += `Question: ${question}\n\n`;
    prompt += `Essay:\n${essay}\n\n`;
    prompt += `Rubric (${rubric.name}):\n`;

    rubric.criteria.forEach((criterion, index) => {
      prompt += `${index + 1}. ${criterion.name} (${criterion.maxPoints} points)\n`;
      prompt += `   Description: ${criterion.description}\n`;
      criterion.levels.forEach(level => {
        prompt += `   - ${level.points} pts: ${level.description}\n`;
      });
    });

    prompt += `\nProvide your assessment in the following JSON format:\n`;
    prompt += `{\n`;
    prompt += `  "criteriaScores": [\n`;
    prompt += `    {\n`;
    prompt += `      "criterionId": "...",\n`;
    prompt += `      "score": 0,\n`;
    prompt += `      "feedback": "..."\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "overallFeedback": "...",\n`;
    prompt += `  "strengths": ["...", "..."],\n`;
    prompt += `  "improvements": ["...", "..."]\n`;
    prompt += `}`;

    return prompt;
  }

  /**
   * Parse AI grading result
   */
  private parseGradingResult(
    content: string,
    rubric: Rubric
  ): EssayGradeResult {
    try {
      // Extract JSON with better error handling
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error('Invalid JSON in response');
      }

      if (!parsed.criteriaScores || !Array.isArray(parsed.criteriaScores)) {
        throw new Error('Missing or invalid criteriaScores in response');
      }

      const criteriaScores: CriteriaScore[] = parsed.criteriaScores.map((cs: any) => {
        const criterion = rubric.criteria.find(c => c.id === cs.criterionId);
        return {
          criterionId: cs.criterionId,
          criterionName: criterion?.name || 'Unknown',
          score: cs.score,
          maxScore: criterion?.maxPoints || 0,
          feedback: cs.feedback,
        };
      });

      const score = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
      const maxScore = rubric.totalPoints;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      return {
        score,
        maxScore,
        percentage,
        criteriaScores,
        feedback: parsed.overallFeedback,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
      };
    } catch (error) {
      console.error('Error parsing grading result:', error);
      return this.mockGradeEssay('', rubric);
    }
  }

  /**
   * Mock grading for demo/testing
   */
  private mockGradeEssay(essay: string, rubric: Rubric): EssayGradeResult {
    const wordCount = essay.split(/\s+/).length;
    const hasStructure = essay.includes('\n') || essay.length > 200;
    
    // Simple heuristic scoring
    const baseScore = Math.min(wordCount / 10, rubric.totalPoints * 0.7);
    const structureBonus = hasStructure ? rubric.totalPoints * 0.2 : 0;
    const score = Math.min(baseScore + structureBonus, rubric.totalPoints);

    const criteriaScores: CriteriaScore[] = rubric.criteria.map(criterion => {
      const criterionScore = (score / rubric.totalPoints) * criterion.maxPoints;
      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        score: Math.round(criterionScore * 10) / 10,
        maxScore: criterion.maxPoints,
        feedback: `Good effort on ${criterion.name.toLowerCase()}.`,
      };
    });

    return {
      score: Math.round(score * 10) / 10,
      maxScore: rubric.totalPoints,
      percentage: (score / rubric.totalPoints) * 100,
      criteriaScores,
      feedback: 'Your essay demonstrates understanding of the topic.',
      strengths: ['Clear writing', 'Relevant content'],
      improvements: ['Add more examples', 'Strengthen conclusion'],
    };
  }

  /**
   * Create a default rubric for essay questions
   */
  createDefaultRubric(totalPoints: number = 20): Rubric {
    return {
      id: `rubric-${Date.now()}`,
      name: 'Standard Essay Rubric',
      totalPoints,
      criteria: [
        {
          id: 'content',
          name: 'Content & Understanding',
          description: 'Demonstrates understanding of the topic and provides relevant information',
          maxPoints: totalPoints * 0.4,
          levels: [
            {
              points: totalPoints * 0.4,
              description: 'Excellent understanding, comprehensive and accurate',
            },
            {
              points: totalPoints * 0.3,
              description: 'Good understanding, mostly accurate',
            },
            {
              points: totalPoints * 0.2,
              description: 'Basic understanding, some inaccuracies',
            },
            {
              points: totalPoints * 0.1,
              description: 'Limited understanding, significant gaps',
            },
          ],
        },
        {
          id: 'organization',
          name: 'Organization & Structure',
          description: 'Clear structure with introduction, body, and conclusion',
          maxPoints: totalPoints * 0.3,
          levels: [
            {
              points: totalPoints * 0.3,
              description: 'Well-organized with clear structure',
            },
            {
              points: totalPoints * 0.2,
              description: 'Generally organized with minor issues',
            },
            {
              points: totalPoints * 0.1,
              description: 'Poorly organized, unclear structure',
            },
          ],
        },
        {
          id: 'analysis',
          name: 'Analysis & Critical Thinking',
          description: 'Demonstrates critical thinking and analysis',
          maxPoints: totalPoints * 0.2,
          levels: [
            {
              points: totalPoints * 0.2,
              description: 'Insightful analysis with critical thinking',
            },
            {
              points: totalPoints * 0.15,
              description: 'Some analysis present',
            },
            {
              points: totalPoints * 0.1,
              description: 'Limited analysis',
            },
          ],
        },
        {
          id: 'writing',
          name: 'Writing Quality',
          description: 'Grammar, spelling, and overall writing quality',
          maxPoints: totalPoints * 0.1,
          levels: [
            {
              points: totalPoints * 0.1,
              description: 'Excellent writing with no errors',
            },
            {
              points: totalPoints * 0.05,
              description: 'Good writing with minor errors',
            },
            {
              points: 0,
              description: 'Poor writing with many errors',
            },
          ],
        },
      ],
    };
  }

  /**
   * Semantic similarity check (basic implementation)
   */
  calculateSemanticSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity;
  }

  /**
   * Detect key concepts in essay
   */
  detectKeyConcepts(essay: string, expectedConcepts: string[]): string[] {
    const essayLower = essay.toLowerCase();
    return expectedConcepts.filter(concept => 
      essayLower.includes(concept.toLowerCase())
    );
  }
}

export const essayGradingService = new EssayGradingService();
