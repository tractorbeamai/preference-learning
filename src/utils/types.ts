export interface AppState {
  rules: string[];
  observations: { observation: string; count: number }[];
  fakeRecord: string;
  initialSummary: string;
  editedSummary: string;
}
