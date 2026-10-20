export type AiProvider = 'Google Gemini' | 'OpenAI' | 'Anthropic' | 'Local / Ollama';

export type AiModelStatus = 'HEALTHY' | 'DEGRADED' | 'STANDBY' | 'MAINTENANCE';

export type AiFeatureKey =
  | 'cv_parsing'
  | 'cv_job_fit'
  | 'assistant_chat'
  | 'cover_letter'
  | 'mock_interview'
  | 'salary_estimation'
  | 'skill_gap';

export interface AiModelParameterConfig {
  temperature: number; // 0.0 - 2.0
  topP: number; // 0.0 - 1.0
  topK: number; // 1 - 100
  contextWindowTokens: number;
  maxOutputTokens: number;
  safetyThreshold: 'BLOCK_NONE' | 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH';
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AdminAiModel {
  modelId: string;
  displayName: string;
  provider: AiProvider;
  modelFamily: string; // e.g. "Gemini 1.5", "GPT-4", "Claude 3.5"
  status: AiModelStatus;
  isPrimary: boolean;
  fallbackModelId?: string;
  parameters: AiModelParameterConfig;
  pricing: {
    inputPer1mUSD: number;
    outputPer1mUSD: number;
    inputPer1mVND: number;
    outputPer1mVND: number;
  };
  rateLimits: {
    rpmLimit: number;
    tpmLimit: number;
    rpdLimit: number;
  };
  metrics: {
    avgLatencyMs: number;
    currentLoadPercent: number;
    successRatePercent: number;
    totalRequests24h: number;
    tokensConsumed24h: number;
    lastPingStatus?: 'SUCCESS' | 'ERROR';
    lastPingMs?: number;
    lastPingAt?: string;
  };
  supportedFeatures: AiFeatureKey[];
  apiKeyMasked: string;
  description: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// System Prompts & Versioning Types
// -------------------------------------------------------------

export type PromptStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface PromptVariableSchema {
  name: string;
  label: string;
  description: string;
  sampleValue: string;
  required: boolean;
}

export interface PromptVersionItem {
  version: string; // e.g. "v1.0", "v1.1", "v2.0"
  content: string;
  changelog: string;
  author: string;
  createdAt: string;
  isActive: boolean;
  benchmarkScore?: number; // 0 - 100
}

export interface SystemPromptItem {
  id: string;
  featureKey: AiFeatureKey;
  featureName: string;
  name: string;
  description: string;
  targetRole: 'All Candidates' | 'Senior Tech' | 'Consultant Assistant' | 'ATS Engine';
  assignedModelId: string;
  status: PromptStatus;
  currentVersion: string;
  variables: PromptVariableSchema[];
  versions: PromptVersionItem[];
  systemInstructions: string;
  fewShotExamples?: { input: string; output: string }[];
  updatedAt: string;
  updatedBy: string;
}

// -------------------------------------------------------------
// Embedding & Vector Database Types
// -------------------------------------------------------------

export type VectorDistanceMetric = 'COSINE' | 'DOT_PRODUCT' | 'EUCLIDEAN';

export interface EmbeddingModelConfig {
  modelId: string;
  displayName: string;
  provider: AiProvider;
  dimensions: number; // e.g. 768, 1536, 3072
  maxInputTokens: number;
  costPer1mTokensUSD: number;
  metric: VectorDistanceMetric;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  avgLatencyMs: number;
}

export interface VectorChunkingConfig {
  chunkSizeTokens: number;
  chunkOverlapPercent: number;
  separators: string[];
  stripHtml: boolean;
  normalizeWhitespace: boolean;
}

export interface VectorCollectionItem {
  id: string;
  key: 'candidate_resumes' | 'job_postings' | 'skills_taxonomy' | 'consultation_notes';
  name: string;
  description: string;
  totalVectors: number;
  dimensions: number;
  storageSizeMB: number;
  indexingStatus: 'READY' | 'INDEXING' | 'NEEDS_SYNC' | 'FAILED';
  indexingProgressPercent: number;
  lastIndexedAt: string;
  embeddingModel: string;
  retrievalTopKDefault: number;
  minSimilarityScore: number; // e.g. 0.72
}

export interface VectorQueueMetric {
  queueName: string;
  pendingItems: number;
  processed24h: number;
  failed24h: number;
  throughputPerMinute: number;
  status: 'ACTIVE' | 'IDLE' | 'CONGESTED';
}

// -------------------------------------------------------------
// Playground & Test Runner Payloads
// -------------------------------------------------------------

export interface PromptTestPayload {
  promptId: string;
  modelId: string;
  systemContent: string;
  variables: Record<string, string>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface PromptTestResult {
  output: string;
  inputTokensUsed: number;
  outputTokensUsed: number;
  totalTokensUsed: number;
  latencyMs: number;
  costUSD: number;
  costVND: number;
  modelUsed: string;
  timestamp: string;
}

export interface SemanticSimilarityTestPayload {
  sourceText: string;
  targetText: string;
  modelId: string;
}

export interface SemanticSimilarityTestResult {
  cosineSimilarity: number; // 0.0 - 1.0 (e.g. 0.88 = 88%)
  matchGrade: 'EXCEPTIONAL' | 'STRONG' | 'MODERATE' | 'LOW';
  matchedKeywords: string[];
  latencyMs: number;
  sourceTokens: number;
  targetTokens: number;
  dimensions: number;
  modelUsed: string;
  timestamp: string;
}

export interface AiManagementSummaryMetrics {
  activeModelsCount: number;
  totalPromptsCount: number;
  totalVectorCount: number;
  vectorStorageSizeMB: number;
  avgInferenceLatencyMs: number;
  avgEmbeddingLatencyMs: number;
  totalAiCost24hUSD: number;
  totalAiCost24hVND: number;
  primaryProvider: string;
  systemStatus: 'OPERATIONAL' | 'DEGRADED';
}
