import type { CandidateProfile, Job, Resume } from './domain';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ActionSuggestion {
  label: string;
  prompt: string;
  category?: 'cv' | 'job' | 'interview' | 'salary' | 'career' | 'general';
}

export interface ContextSnapshot {
  cvId?: string;
  cvName?: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  candidateName?: string;
}

export interface AiChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  contextSnapshot?: ContextSnapshot;
  highlights?: string[];
  tips?: string[];
  actionSuggestions?: ActionSuggestion[];
  feedback?: 'like' | 'dislike' | null;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  activeCvId?: string;
  activeJobId?: string;
  messages: AiChatMessage[];
  pinned?: boolean;
}

export interface AssistantContextData {
  profile?: CandidateProfile;
  selectedCv?: Resume;
  selectedJob?: Job;
  resumes: Resume[];
  jobs: Job[];
}

export interface QuickPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'cv' | 'job' | 'interview' | 'career' | 'salary';
  icon: string;
}
