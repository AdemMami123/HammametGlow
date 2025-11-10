import { create } from 'zustand';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  deadline?: string;
}

interface ChallengeStore {
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: string, updates: Partial<Challenge>) => void;
  deleteChallenge: (id: string) => void;
  toggleComplete: (id: string) => void;
}

export const useChallengeStore = create<ChallengeStore>((set) => ({
  challenges: [],
  setChallenges: (challenges) => set({ challenges }),
  addChallenge: (challenge) =>
    set((state) => ({ challenges: [...state.challenges, challenge] })),
  updateChallenge: (id, updates) =>
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  deleteChallenge: (id) =>
    set((state) => ({
      challenges: state.challenges.filter((c) => c.id !== id),
    })),
  toggleComplete: (id) =>
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      ),
    })),
}));
