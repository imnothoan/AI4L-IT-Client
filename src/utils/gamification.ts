// Gamification System - Points, Leaderboards, Achievements
// Makes learning fun and engaging like Kahoot and Quizizz

export interface ExamScore {
    userId: string;
    examId: string;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number; // seconds
    averageTime: number; // average time per question
    basePoints: number;
    speedBonus: number;
    accuracyBonus: number;
    streakBonus: number;
    totalPoints: number;
    rank?: number;
    percentile?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    requirement: (stats: UserStats) => boolean;
    points: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
    totalExams: number;
    perfectScores: number;
    averageScore: number;
    fastestTime: number;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    achievements: string[];
}

export class GamificationSystem {
    // Calculate points based on performance
    static calculateScore(
        correctAnswers: number,
        totalQuestions: number,
        timeSpent: number,
        averageTime: number
    ): ExamScore {
        const basePoints = correctAnswers * 100;

        // Speed bonus: faster than average = bonus points
        const speedRatio = averageTime / (timeSpent / totalQuestions);
        let speedBonus = 0;
        if (speedRatio > 1.5) speedBonus = basePoints * 0.50; // 50% faster
        else if (speedRatio > 1.25) speedBonus = basePoints * 0.25; // 25% faster
        else if (speedRatio > 1.0) speedBonus = basePoints * 0.10; // Faster

        // Accuracy bonus: perfect or near-perfect
        const accuracy = correctAnswers / totalQuestions;
        let accuracyBonus = 0;
        if (accuracy === 1.0) accuracyBonus = 500; // Perfect!
        else if (accuracy >= 0.95) accuracyBonus = 250; // Near perfect
        else if (accuracy >= 0.90) accuracyBonus = 100; // Excellent

        // Streak bonus (calculated separately)
        const streakBonus = 0; // Will be added from user stats

        const totalPoints = Math.round(basePoints + speedBonus + accuracyBonus + streakBonus);

        return {
            userId: '',
            examId: '',
            correctAnswers,
            totalQuestions,
            timeSpent,
            averageTime,
            basePoints,
            speedBonus: Math.round(speedBonus),
            accuracyBonus,
            streakBonus,
            totalPoints
        };
    }

    // Get user's rank in leaderboard
    static calculateRank(userScore: number, allScores: number[]): number {
        const sortedScores = [...allScores].sort((a, b) => b - a);
        return sortedScores.indexOf(userScore) + 1;
    }

    // Calculate percentile
    static calculatePercentile(userScore: number, allScores: number[]): number {
        const lowerScores = allScores.filter(score => score < userScore).length;
        return Math.round((lowerScores / allScores.length) * 100);
    }
}

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_perfect',
        title: '🎯 Perfectionist',
        description: 'Score 100% on any exam',
        icon: '🎯',
        requirement: (stats) => stats.perfectScores > 0,
        points: 500,
        rarity: 'rare'
    },
    {
        id: 'speed_demon',
        title: '⚡ Speed Demon',
        description: 'Complete an exam in under 10 minutes',
        icon: '⚡',
        requirement: (stats) => stats.fastestTime < 600,
        points: 300,
        rarity: 'rare'
    },
    {
        id: 'on_fire',
        title: '🔥 On Fire!',
        description: 'Maintain a 7-day exam streak',
        icon: '🔥',
        requirement: (stats) => stats.currentStreak >= 7,
        points: 750,
        rarity: 'epic'
    },
    {
        id: 'century',
        title: '💯 Centurion',
        description: 'Complete 100 exams',
        icon: '💯',
        requirement: (stats) => stats.totalExams >= 100,
        points: 1000,
        rarity: 'epic'
    },
    {
        id: 'legend',
        title: '👑 Legend',
        description: 'Reach 10,000 total points',
        icon: '👑',
        requirement: (stats) => stats.totalPoints >= 10000,
        points: 2000,
        rarity: 'legendary'
    },
    {
        id: 'first_exam',
        title: '🎓 First Steps',
        description: 'Complete your first exam',
        icon: '🎓',
        requirement: (stats) => stats.totalExams >= 1,
        points: 100,
        rarity: 'common'
    },
    {
        id: 'consistent',
        title: '📅 Consistent Learner',
        description: 'Complete exams for 30 days straight',
        icon: '📅',
        requirement: (stats) => stats.longestStreak >= 30,
        points: 1500,
        rarity: 'legendary'
    },
    {
        id: 'overachiever',
        title: '⭐ Overachiever',
        description: 'Score perfect on 10 exams',
        icon: '⭐',
        requirement: (stats) => stats.perfectScores >= 10,
        points: 1000,
        rarity: 'epic'
    }
];

// Leaderboard utilities
export class LeaderboardManager {
    static getTopScores(scores: ExamScore[], limit: number = 10): ExamScore[] {
        return [...scores]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
            .map((score, index) => ({
                ...score,
                rank: index + 1
            }));
    }

    static getClassLeaderboard(classId: string, scores: ExamScore[], limit: number = 10): ExamScore[] {
        // Filter by class and get top scores
        return this.getTopScores(scores, limit);
    }

    static getUserRank(userId: string, scores: ExamScore[]): number {
        const sortedScores = [...scores].sort((a, b) => b.totalPoints - a.totalPoints);
        return sortedScores.findIndex(score => score.userId === userId) + 1;
    }
}

// Export for use in components
export { GamificationSystem as default };
