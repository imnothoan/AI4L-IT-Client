import { CATState, Question, QuestionResponse } from '@/types';

/**
 * CAT Algorithm Implementation
 * Based on Item Response Theory (IRT) and adaptive testing principles
 */

export class CATAlgorithm {
  private state: CATState;
  private questionPool: Question[];

  constructor(questionPool: Question[], maxQuestions: number = 20) {
    this.questionPool = questionPool;
    this.state = {
      currentDifficulty: 0.5, // Start at medium difficulty
      estimatedAbility: 0.5, // Initial ability estimate
      standardError: 1.0, // High uncertainty initially
      questionsAsked: 0,
      maxQuestions,
    };
  }

  /**
   * Get the next question based on current ability estimate
   */
  getNextQuestion(askedQuestions: string[]): Question | null {
    if (this.state.questionsAsked >= this.state.maxQuestions) {
      return null;
    }

    // Filter out already asked questions
    const availableQuestions = this.questionPool.filter(
      q => !askedQuestions.includes(q.id)
    );

    if (availableQuestions.length === 0) {
      return null;
    }

    // Find question with difficulty closest to current ability estimate
    const nextQuestion = availableQuestions.reduce((best, current) => {
      const bestDiff = Math.abs(best.difficulty - this.state.estimatedAbility);
      const currentDiff = Math.abs(current.difficulty - this.state.estimatedAbility);
      return currentDiff < bestDiff ? current : best;
    });

    this.state.questionsAsked++;
    return nextQuestion;
  }

  /**
   * Update ability estimate based on response
   * Uses simplified IRT 1PL model
   */
  updateAbilityEstimate(response: QuestionResponse, question: Question): void {
    const correct = response.correct ? 1 : 0;
    const difficulty = question.difficulty;

    // Calculate probability of correct answer given current ability
    const p = this.probabilityCorrect(this.state.estimatedAbility, difficulty);

    // Update ability using Maximum Likelihood Estimation
    const learningRate = 0.3;
    const abilityAdjustment = learningRate * (correct - p);
    
    this.state.estimatedAbility = Math.max(0, Math.min(1, 
      this.state.estimatedAbility + abilityAdjustment
    ));

    // Update standard error (decreases as more questions are answered)
    this.state.standardError = Math.max(0.1, 
      this.state.standardError * 0.9
    );

    // Update current difficulty for next question
    this.state.currentDifficulty = this.state.estimatedAbility;
  }

  /**
   * Calculate probability of correct answer using logistic function
   */
  private probabilityCorrect(ability: number, difficulty: number): number {
    const z = 2 * (ability - difficulty);
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Check if testing should stop based on precision
   */
  shouldStop(): boolean {
    return (
      this.state.questionsAsked >= this.state.maxQuestions ||
      this.state.standardError < 0.2 // High precision achieved
    );
  }

  /**
   * Get current state
   */
  getState(): CATState {
    return { ...this.state };
  }

  /**
   * Calculate final score (0-100)
   */
  getFinalScore(): number {
    return Math.round(this.state.estimatedAbility * 100);
  }
}
