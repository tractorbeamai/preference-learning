export type LearningRate = "Slow" | "Normal" | "Fast";

export interface PreferenceLearningState {
  rules: string[];
  observations: { observation: string; count: number }[];
  fakeRecord: string;
  initialSummary: string;
  editedSummary: string;
  learningRate: LearningRate;
}

export const LEARNING_RATE_THRESHOLDS: Record<LearningRate, number> = {
  Slow: 5,
  Normal: 3,
  Fast: 2,
} as const;
