export type GenerationMode = "text" | "image";
export type GenerationSource = "composer" | "what-if" | "api";

export type ReferenceImageInput = {
  data_url?: string | null;
  url?: string | null;
  mime_type?: string | null;
  name?: string | null;
};

export type TokenImpact = {
  token: string;
  impact: number;
};

export type PromptSegment = {
  id: string;
  label: string;
  text: string;
  kind: string;
  impact: number;
  effect: string;
};

export type PromptExplanationSummary = {
  overview: string;
  segment_strategy: string;
  improvement_tip: string;
};

export type SegmentChange = {
  label: string;
  before: string;
  after: string;
  effect: string;
  change_type: "added" | "removed" | "modified" | "unchanged";
};

export type SessionRecord = {
  id: number;
  prompt: string;
  output: string;
  mode: GenerationMode;
  source: GenerationSource;
  provider: string;
  response_time_ms: number;
  token_count: number;
  trust_score: number;
  clarity_score: number;
  quality_score: number;
  quality_label: string;
  difference_summary: string | null;
  created_at: string;
};

export type GenerateRequest = {
  prompt: string;
  mode?: GenerationMode;
  source?: GenerationSource;
  reference_image?: ReferenceImageInput | null;
};

export type GenerateResponse = {
  output: string;
  provider: string;
  tokens: string[];
  mapping: TokenImpact[];
  segments: PromptSegment[];
  explanation_summary: PromptExplanationSummary;
  reference_image_used: boolean;
  session: SessionRecord;
};

export type WhatIfRequest = {
  original_prompt: string;
  modified_prompt: string;
  mode?: GenerationMode;
  original_reference_image?: ReferenceImageInput | null;
  modified_reference_image?: ReferenceImageInput | null;
};

export type WhatIfResponse = {
  difference: string;
  original_session: SessionRecord;
  modified_session: SessionRecord;
  original_segments: PromptSegment[];
  modified_segments: PromptSegment[];
  original_explanation_summary: PromptExplanationSummary;
  modified_explanation_summary: PromptExplanationSummary;
  segment_changes: SegmentChange[];
  delta: {
    confidence: number;
    clarity: number;
    quality: number;
  };
};

export type ExplainRequest = {
  prompt: string;
  output: string;
};

export type ExplainResponse = {
  mapping: TokenImpact[];
};

export type MetricCreateRequest = {
  prompt_length: number;
  response_time_ms: number;
  rating?: number | null;
  endpoint?: string | null;
  mode?: GenerationMode | null;
  trust_score?: number | null;
  feedback?: string | null;
  created_at?: string;
};

export type MetricCreateResponse = {
  status: string;
  record_id: number;
};

export type MetricSummaryResponse = {
  avg_response_time: number;
  avg_rating: number | null;
  total_requests: number;
};

export type RecentRun = {
  id: number;
  prompt: string;
  mode: GenerationMode;
  provider: string;
  confidence: number;
  clarity: number;
  quality: number;
  quality_label: string;
  created_at: string;
};

export type DashboardMetricsResponse = {
  avg_confidence: number;
  avg_clarity: number;
  avg_quality: number;
  avg_response_time: number;
  total_runs: number;
  trend: Array<{
    day: string;
    confidence: number;
    clarity: number;
    quality: number;
  }>;
  usage_today: Array<{
    hour: string;
    runs: number;
  }>;
  recent_runs: RecentRun[];
  system_status: Array<{
    label: string;
    value: string;
    status: string;
  }>;
  storage_bytes: number;
};

export type SessionListResponse = {
  sessions: SessionRecord[];
  total_runs: number;
  storage_bytes: number;
};

export type FrigateClientOptions = {
  baseUrl?: string;
  apiPrefix?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};

export class FrigateError extends Error {
  status: number | null;
  data: unknown;
  constructor(message: string, options?: { status?: number | null; data?: unknown });
}

export class FrigateClient {
  constructor(options?: FrigateClientOptions);
  health(): Promise<{ status: string }>;
  generate(payload: GenerateRequest): Promise<GenerateResponse>;
  whatIf(payload: WhatIfRequest): Promise<WhatIfResponse>;
  explain(payload: ExplainRequest): Promise<ExplainResponse>;
  createMetric(payload: MetricCreateRequest): Promise<MetricCreateResponse>;
  getMetrics(): Promise<MetricSummaryResponse>;
  listSessions(options?: { limit?: number }): Promise<SessionListResponse>;
  sessions(options?: { limit?: number }): Promise<SessionListResponse>;
  getDashboard(): Promise<DashboardMetricsResponse>;
  dashboard(): Promise<DashboardMetricsResponse>;
}

export function createFrigateClient(options?: FrigateClientOptions): FrigateClient;

export default FrigateClient;
