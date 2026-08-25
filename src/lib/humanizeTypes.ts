/** Shared client/server types for the AI Humanizer. No runtime deps. */

import type { HumanizeAnalysis, MeaningCheck } from "./humanizeMetrics";

export type HumanizeIntensity = "light" | "medium" | "strong";

export interface HumanizeRunSettings {
  intensity: HumanizeIntensity;
  purpose?: string;
  style?: string;
  preserve?: string[];
  useBrandVoice?: boolean;
}

export interface HumanizerRunRow {
  id: string;
  title: string | null;
  source_hash: string;
  input_text: string;
  output_text: string;
  settings: HumanizeRunSettings;
  metrics_before: Partial<HumanizeAnalysis> | null;
  metrics_after: Partial<HumanizeAnalysis> | null;
  meaning: MeaningCheck | null;
  version: number;
  word_count: number;
  created_at: string;
}

export interface HumanizeRunResponse {
  output: string;
  error?: string;
  before?: HumanizeAnalysis;
  after?: HumanizeAnalysis;
  meaning?: MeaningCheck;
  passes?: number;
  repaired?: boolean;
  runId?: string;
  version?: number;
  brandVoiceApplied?: boolean;
  usedBrandKit?: boolean;
}
