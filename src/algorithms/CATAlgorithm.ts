import { Question } from '@/types';

interface AbilityEstimate {
    theta: number;
    sem: number;
}

interface Response {
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
}

export default class CATAlgorithm {
    private questions: Question[];
    private maxItems: number;
    private responses: Response[] = [];
    private estimatedAbility: number = 0; // Theta
    private standardError: number = 1.0; // SEM

    constructor(questions: Question[], maxItems: number = 15) {
        this.questions = questions;
        this.maxItems = maxItems;
    }

    /**
     * Select next question based on current ability
     * For client-side simulation, we pick the question with difficulty closest to theta
     */
    getNextQuestion(administeredIds: string[]): Question | null {
        const availableQuestions = this.questions.filter(q => !administeredIds.includes(q.id));

        if (availableQuestions.length === 0) return null;

        // Sort by absolute difference between question difficulty and current theta
        availableQuestions.sort((a, b) => {
            const diffA = Math.abs(a.difficulty - this.estimatedAbility);
            const diffB = Math.abs(b.difficulty - this.estimatedAbility);
            return diffA - diffB;
        });

        return availableQuestions[0];
    }

    /**
     * Update ability estimate based on new response
     * Simplified EAP or MAP update for client-side display
     */
    updateAbilityEstimate(response: { questionId: string; correct: boolean; timeSpent: number }, question: Question) {
        this.responses.push({
            questionId: response.questionId,
            isCorrect: response.correct,
            timeSpent: response.timeSpent
        });

        // Simple heuristic update for demo purposes (Server does the real heavy lifting)
        // If correct, increase theta; if wrong, decrease.
        // Magnitude depends on item difficulty and discrimination (default 1)
        const change = 0.5 * (response.correct ? 1 : -1) * (1 / (1 + Math.exp(-1 * (this.estimatedAbility - question.difficulty))));

        this.estimatedAbility += change;

        // Decrease SEM as more items are answered
        this.standardError = 1 / Math.sqrt(this.responses.length + 1);
    }

    shouldStop(): boolean {
        return this.responses.length >= this.maxItems || this.standardError < 0.3;
    }

    getState() {
        return {
            estimatedAbility: this.estimatedAbility,
            standardError: this.standardError,
            itemsAnswered: this.responses.length
        };
    }
}
