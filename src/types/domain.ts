export type UserRole = 'CANDIDATE' | 'CAREER_CONSULTANT' | 'ADMIN';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
  avatar?: string;
  createdAt?: string;
}
export interface SkillItem {
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: 'technical' | 'soft' | 'tool';
}

export interface CandidateProfile {
  name: string;
  headline: string;
  location: string;
  email?: string;
  phone?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  avatar?: string;
  targetPosition: string;
  experienceLevel: string;
  employmentType?: string;
  expectedSalary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  careerField?: string;
  preferredLocations?: string[];
  availability?: string;
  careerGoal?: string;
  skills: string[];
  detailedSkills?: SkillItem[];
  softSkills?: string[];
  completion: number;
}
export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  description: string;
  highlights?: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  highlights?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  role?: string;
  techStack?: string[];
  link?: string;
  description: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description?: string;
}

export interface ReferenceItem {
  id: string;
  fullName: string;
  company: string;
  position: string;
  email?: string;
  phone?: string;
}

export interface ActivityItem {
  id: string;
  role: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights?: string[];
}

export interface AtsBreakdown {
  formatting: number;
  keywords: number;
  impactMetrics: number;
  structure: number;
  strengths: string[];
  improvements: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface ExtractedMeta {
  fileName?: string;
  fileSize?: string;
  extractedAt?: string;
  confidenceScore?: number;
  extractionWarnings?: string[];
  rawTextSnippet?: string;
}

export interface Resume {
  id: string;
  name: string;
  position: string;
  language: string;
  updatedAt: string;
  atsScore: number;
  status: 'Draft' | 'Processing' | 'Ready' | 'Needs Review';
  isDefault?: boolean;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  experience?: WorkExperience[];
  education?: EducationItem[];
  skills?: string[];
  detailedSkills?: SkillItem[];
  softSkills?: string[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  languages?: LanguageItem[];
  awards?: AwardItem[];
  interests?: string[];
  references?: ReferenceItem[];
  activities?: ActivityItem[];
  dob?: string;
  avatarUrl?: string;
  atsBreakdown?: AtsBreakdown;
  extractedMeta?: ExtractedMeta;
}

export interface SuggestionItem {
  id: string;
  category: 'content' | 'structure' | 'keywords' | 'impact';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  section: string;
  originalText?: string;
  suggestedText?: string;
  impactGain?: string;
  applied?: boolean;
}

export interface SectionAnalysis {
  id: string;
  name: string;
  score: number;
  status: 'passed' | 'warning' | 'needs_work';
  summary: string;
  strengths: string[];
  issues: string[];
}

export interface TechnicalCheckItem {
  id: string;
  title: string;
  passed: boolean;
  category: string;
  detail: string;
}

export interface ResumeAnalysisResult {
  resumeId: string;
  resumeName: string;
  targetRole: string;
  overallScore: number;
  atsCompatibilityScore: number;
  contentQualityScore: number;
  structureScore: number;
  keywordScore: number;
  grade: 'A+' | 'A' | 'B' | 'C';
  passProbability: number;
  summaryEvaluation: string;
  sections: SectionAnalysis[];
  technicalChecklist: TechnicalCheckItem[];
  suggestions: SuggestionItem[];
  matchedKeywords: string[];
  missingKeywords: string[];
  analyzedAt: string;
}

export interface SemanticMatchingDetail {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  salaryScore: number;
  domainScore: number;
  fitLevel: 'Exceptional Fit' | 'Strong Fit' | 'Moderate Fit' | 'Growth Opportunity';
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  growthAreas: string[];
  recommendation: string;
}

export interface ExternalApplicationSource {
  sourceName: string; // e.g. "TopCV", "ITviec", "VietnamWorks", "LinkedIn", "Company Careers"
  sourceUrl: string;
  sourceBadgeColor?: string;
  applicationDeadline?: string;
  directApplyAvailable?: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  type: string;
  experienceLevel?: 'Fresher' | 'Junior' | 'Middle' | 'Senior' | 'Lead';
  skills: string[];
  match: number;
  posted: string;
  description: string;
  companyLogo?: string;
  department?: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  externalSource?: ExternalApplicationSource;
  semanticMatch?: SemanticMatchingDetail;
}

export interface CvJobFitSkillAnalysis {
  name: string;
  category: 'required' | 'preferred';
  status: 'matched' | 'missing' | 'partial';
  cvMention?: string;
  importance: 'high' | 'medium' | 'low';
}

export interface CvJobFitGapItem {
  title: string;
  description: string;
  impact: 'critical' | 'moderate' | 'minor';
  recommendation: string;
}

export interface CvJobFitResult {
  cvId: string;
  cvName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  cultureScore: number;
  fitGrade: 'A+' | 'A' | 'B' | 'C';
  verdict: string;
  strengths: string[];
  gaps: CvJobFitGapItem[];
  skillsAnalysis: CvJobFitSkillAnalysis[];
  tailoringTips: string[];
  suggestedBulletPoints: {
    section: string;
    text: string;
  }[];
  analyzedAt: string;
}

export interface SalarySkillBooster {
  id: string;
  name: string;
  boostPercentage: number;
  monthlyBoostUSD: number;
  demandTag: 'Rất cao' | 'Cao' | 'Xu hướng';
}

export interface SalaryLevelData {
  level: 'Junior' | 'Middle' | 'Senior' | 'Lead';
  yearsExperience: string;
  baseMinUSD: number;
  baseMedianUSD: number;
  baseMaxUSD: number;
  p10USD: number;
  p25USD: number;
  p50USD: number;
  p75USD: number;
  p90USD: number;
}

export interface CareerSalaryTrack {
  id: string;
  name: string;
  code: string;
  icon: string;
  description: string;
  levels: Record<'Junior' | 'Middle' | 'Senior' | 'Lead', SalaryLevelData>;
  availableSkillBoosters: SalarySkillBooster[];
  marketDemandScore: number;
  annualGrowthRate: string;
  talentScarcity: 'Rất cao' | 'Cao' | 'Ổn định';
  relatedJobCount: number;
  negotiationChecklist: string[];
}

export interface SalaryCalculationResult {
  track: CareerSalaryTrack;
  level: 'Junior' | 'Middle' | 'Senior' | 'Lead';
  location: string;
  locationMultiplier: number;
  selectedSkillIds: string[];
  totalSkillBoostPercentage: number;
  minMonthlyUSD: number;
  medianMonthlyUSD: number;
  maxMonthlyUSD: number;
  minMonthlyVND: number;
  medianMonthlyVND: number;
  maxMonthlyVND: number;
  percentilesUSD: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  percentilesVND: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  skillBonuses: {
    skillName: string;
    boostPercentage: number;
    monthlyValueUSD: number;
    monthlyValueVND: number;
  }[];
}

export * from './assistant';
export * from './application';
export * from './subscription';
export * from './usage';
export * from './support';
export * from './feedback';


