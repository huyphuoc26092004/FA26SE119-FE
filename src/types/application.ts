export type ApplicationContentType =
  | 'cover_letter'
  | 'application_email'
  | 'linkedin_inmail'
  | 'follow_up_email';

export type ApplicationTone = 'professional' | 'impactful' | 'enthusiastic' | 'concise';

export type ApplicationFocus = 'tech_depth' | 'leadership' | 'fast_learner' | 'business_impact';

export type ApplicationLanguage = 'Vietnamese' | 'English';

export interface ApplicationReviewScore {
  overallScore: number;
  relevanceScore: number;
  persuasivenessScore: number;
  clarityScore: number;
  toneScore: number;
  strengths: string[];
  improvements: string[];
  matchedKeywords: string[];
  recommendedAdditions: string[];
  wordCount: number;
  readingTimeMinutes: number;
}

export interface ApplicationDraft {
  id: string;
  title: string;
  contentType: ApplicationContentType;
  tone: ApplicationTone;
  language: ApplicationLanguage;
  focus: ApplicationFocus;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  cvId?: string;
  cvName?: string;
  recipientName?: string;
  subject?: string;
  content: string;
  reviewScore: ApplicationReviewScore;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
}

export interface GenerateApplicationParams {
  contentType: ApplicationContentType;
  tone: ApplicationTone;
  language: ApplicationLanguage;
  focus: ApplicationFocus;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  jobSkills?: string[];
  cvId?: string;
  cvName?: string;
  candidateName?: string;
  candidateRole?: string;
  candidateSkills?: string[];
  candidateExperienceYears?: string;
  recipientName?: string;
  customNotes?: string;
}

export interface RefineApplicationParams {
  currentContent: string;
  currentSubject?: string;
  action: 'make_shorter' | 'add_metrics' | 'more_confident' | 'more_enthusiastic' | 'translate' | 'polish';
  targetLanguage?: ApplicationLanguage;
  jobTitle?: string;
  company?: string;
}
