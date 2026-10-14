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
  atsBreakdown?: AtsBreakdown;
  extractedMeta?: ExtractedMeta;
}
export interface Job { id: string; title: string; company: string; location: string; salary: string; type: string; skills: string[]; match: number; posted: string; description: string; }
