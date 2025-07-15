import { HourlyPuzzle, PuzzleCategory, PuzzleDifficulty, PlayerTrait, PlayerProfile } from '../types/game';
import { generateLetterSet } from '../utils/gameUtils';

export class PuzzleService {
  private static instance: PuzzleService;
  private currentPuzzle: HourlyPuzzle | null = null;
  private puzzleHistory: HourlyPuzzle[] = [];

  static getInstance(): PuzzleService {
    if (!PuzzleService.instance) {
      PuzzleService.instance = new PuzzleService();
    }
    return PuzzleService.instance;
  }

  // Generate hourly puzzles
  generateHourlyPuzzle(): HourlyPuzzle {
    const now = new Date();
    const releaseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const expiryTime = new Date(releaseTime.getTime() + 60 * 60 * 1000); // 1 hour

    const isRare = Math.random() < 0.1; // 10% chance for rare puzzle
    const difficulty = this.getDifficultyForHour(now.getHours());
    const category = isRare ? 'rare_drop' : 'standard';

    const letterSet = generateLetterSet(this.getDifficultyLevel(difficulty));
    const targetWords = this.generateTargetWords(letterSet.letters, difficulty);

    const puzzle: HourlyPuzzle = {
      id: `puzzle_${releaseTime.getTime()}`,
      releaseTime,
      expiryTime,
      category: category as PuzzleCategory,
      difficulty,
      letters: letterSet.letters,
      targetWords,
      puzzTokenReward: this.calculatePuzzTokenReward(difficulty, isRare),
      isActive: true,
      isRare,
    };

    this.currentPuzzle = puzzle;
    this.puzzleHistory.push(puzzle);
    return puzzle;
  }

  getCurrentPuzzle(): HourlyPuzzle | null {
    if (!this.currentPuzzle) {
      return this.generateHourlyPuzzle();
    }

    const now = new Date();
    if (now > this.currentPuzzle.expiryTime) {
      return this.generateHourlyPuzzle();
    }

    return this.currentPuzzle;
  }

  getTimeUntilNextPuzzle(): number {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
    return nextHour.getTime() - now.getTime();
  }

  private getDifficultyForHour(hour: number): PuzzleDifficulty {
    // Dynamic difficulty based on time of day
    if (hour >= 6 && hour < 9) return 'easy'; // Morning warm-up
    if (hour >= 9 && hour < 12) return 'medium'; // Morning focus
    if (hour >= 12 && hour < 14) return 'hard'; // Lunch challenge
    if (hour >= 14 && hour < 18) return 'medium'; // Afternoon
    if (hour >= 18 && hour < 22) return 'hard'; // Evening peak
    return 'expert'; // Night owls get the hardest
  }

  private getDifficultyLevel(difficulty: PuzzleDifficulty): number {
    const levels = { easy: 1, medium: 3, hard: 6, expert: 10, master: 15 };
    return levels[difficulty];
  }

  private generateTargetWords(letters: any[], difficulty: PuzzleDifficulty): string[] {
    // This would integrate with the existing word generation logic
    const minWords = { easy: 5, medium: 8, hard: 12, expert: 15, master: 20 };
    return []; // Placeholder - would use existing word generation
  }

  private calculatePuzzTokenReward(difficulty: PuzzleDifficulty, isRare: boolean): number {
    const basePuzzTokens = { easy: 50, medium: 100, hard: 175, expert: 250, master: 400 };
    const multiplier = isRare ? 3 : 1;
    return basePuzzTokens[difficulty] * multiplier;
  }
}

export class TraitService {
  private static instance: TraitService;

  static getInstance(): TraitService {
    if (!TraitService.instance) {
      TraitService.instance = new TraitService();
    }
    return TraitService.instance;
  }

  // Trait definitions
  private traitDefinitions = {
    early_bird: {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Solve within 10 minutes of puzzle drop',
      icon: '🌅',
      benefits: [
        { type: 'token_bonus' as const, value: 1.2, description: '20% PUZZ token bonus' },
        { type: 'early_access' as const, value: 5, description: '5 min early access to next drop' }
      ]
    },
    night_owl: {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Solve between 12am-4am',
      icon: '🦉',
      benefits: [
        { type: 'special_content' as const, value: 1, description: 'Night-themed puzzle content' }
      ]
    },
    quest_hunter: {
      id: 'quest_hunter',
      name: 'Quest Hunter',
      description: 'Complete 10+ puzzles in a day',
      icon: '🏹',
      benefits: [
        { type: 'token_bonus' as const, value: 2, description: 'Double PUZZ tokens on streaks' }
      ]
    },
    speed_demon: {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Solve puzzles in under 2 minutes',
      icon: '⚡',
      benefits: [
        { type: 'token_bonus' as const, value: 1.5, description: '50% PUZZ token bonus for speed' }
      ]
    },
    perfectionist: {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Achieve 100% accuracy on 5 consecutive puzzles',
      icon: '💎',
      benefits: [
        { type: 'token_bonus' as const, value: 1.3, description: '30% PUZZ token bonus for accuracy' }
      ]
    }
  };

  checkAndAwardTraits(profile: PlayerProfile, puzzleAttempt: any): PlayerTrait[] {
    const newTraits: PlayerTrait[] = [];
    const now = new Date();

    // Early Bird check
    if (this.isSolvedWithin10Minutes(puzzleAttempt) && !this.hasTrait(profile, 'early_bird')) {
      newTraits.push(this.createTrait('early_bird'));
    }

    // Night Owl check
    if (this.isSolvedAtNight(puzzleAttempt) && !this.hasTrait(profile, 'night_owl')) {
      newTraits.push(this.createTrait('night_owl'));
    }

    // Quest Hunter check
    if (this.hasCompleted10PuzzlesToday(profile) && !this.hasTrait(profile, 'quest_hunter')) {
      newTraits.push(this.createTrait('quest_hunter'));
    }

    // Speed Demon check
    if (puzzleAttempt.completionTime < 120 && !this.hasTrait(profile, 'speed_demon')) {
      newTraits.push(this.createTrait('speed_demon'));
    }

    // Perfectionist check
    if (this.hasConsecutivePerfectGames(profile, 5) && !this.hasTrait(profile, 'perfectionist')) {
      newTraits.push(this.createTrait('perfectionist'));
    }

    return newTraits;
  }

  private createTrait(traitId: string): PlayerTrait {
    const definition = this.traitDefinitions[traitId];
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      unlockedAt: new Date(),
      level: 1,
      benefits: definition.benefits
    };
  }

  private hasTrait(profile: PlayerProfile, traitId: string): boolean {
    return profile.traits.some(trait => trait.id === traitId);
  }

  private isSolvedWithin10Minutes(attempt: any): boolean {
    const releaseTime = new Date(attempt.puzzleReleaseTime);
    const solveTime = new Date(attempt.endTime);
    return (solveTime.getTime() - releaseTime.getTime()) <= 10 * 60 * 1000;
  }

  private isSolvedAtNight(attempt: any): boolean {
    const hour = new Date(attempt.endTime).getHours();
    return hour >= 0 && hour < 4;
  }

  private hasCompleted10PuzzlesToday(profile: PlayerProfile): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttempts = profile.puzzleHistory.filter(attempt => {
      const attemptDate = new Date(attempt.endTime || attempt.startTime);
      return attemptDate >= today && attempt.endTime;
    });
    
    return todayAttempts.length >= 10;
  }

  private hasConsecutivePerfectGames(profile: PlayerProfile, count: number): boolean {
    const recentAttempts = profile.puzzleHistory
      .filter(attempt => attempt.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())
      .slice(0, count);
    
    return recentAttempts.length === count && 
           recentAttempts.every(attempt => attempt.accuracy === 100);
  }

  calculatePuzzTokensWithTraits(baseTokens: number, traits: PlayerTrait[], context: any): number {
    let multiplier = 1;
    
    traits.forEach(trait => {
      trait.benefits.forEach(benefit => {
        if (benefit.type === 'token_bonus') {
          multiplier *= benefit.value;
        }
      });
    });
    
    return Math.floor(baseTokens * multiplier);
  }
}