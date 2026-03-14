import { Timestamp } from "firebase/firestore";

export interface Trial {
  id: string;
  nctId: string;
  trialName: string;
  phase: string;
  sampleSize: number;
  indication: string;
  sponsor: string;
  primaryEndpoint: string;
  status: string;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type UpdateTrialData = Partial<
  Omit<Trial, "id" | "createdAt" | "updatedAt">
>;
