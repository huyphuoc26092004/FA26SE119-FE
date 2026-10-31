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
  /** Spelling and grammar score from the AI check. */
  languageScore?: number;
  /** Greeting / opening / body / closing structure score from the AI check. */
  structureScore?: number;
  /** When the AI last checked this letter (ISO time). */
  reviewedAt?: string;
}

export type ApplicationIssueCategory =
  | 'SPELLING'
  | 'GRAMMAR'
  | 'TONE'
  | 'CLARITY'
  | 'RELEVANCE'
  | 'STRUCTURE'
  | 'FACT'
  | 'LENGTH';

export type ApplicationIssueSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

/** One concrete fix the AI suggests for a letter the candidate wrote. */
export interface ApplicationReviewIssue {
  id: string;
  category: ApplicationIssueCategory;
  severity: ApplicationIssueSeverity;
  /** Exact text from the letter; empty when something is missing. */
  original: string;
  /** Replacement for `original`, or the text to add when `original` is empty. */
  suggestion: string;
  explanation: string;
  /** Where `original` was found: in the body, the email subject, nowhere (MISSING) or not found (UNKNOWN). */
  location: 'CONTENT' | 'SUBJECT' | 'MISSING' | 'UNKNOWN';
}

/** Result of POST /application-drafts/review. */
export interface ApplicationReviewResult {
  overallScore: number;
  scores: { relevance: number; clarity: number; tone: number; language: number; structure: number };
  summary: string;
  strengths: string[];
  issues: ApplicationReviewIssue[];
  missingKeywords: string[];
  wordCount: number;
  reviewedAt: string;
  /** Text that was checked, used to tell whether the letter changed since. */
  checkedSubject: string;
  checkedContent: string;
}

export interface ReviewApplicationParams {
  jobId: string;
  cvId?: string;
  contentType: ApplicationContentType;
  language: ApplicationLanguage;
  subject?: string;
  content: string;
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
