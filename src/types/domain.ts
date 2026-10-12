export type UserRole = 'CANDIDATE' | 'CAREER_CONSULTANT' | 'ADMIN';
export interface User { id: string; name: string; email: string; role: UserRole; }
export interface CandidateProfile { name: string; headline: string; location: string; targetPosition: string; experienceLevel: string; skills: string[]; completion: number; }
export interface Resume { id: string; name: string; position: string; language: string; updatedAt: string; atsScore: number; status: 'Draft' | 'Processing' | 'Ready' | 'Needs Review'; }
export interface Job { id: string; title: string; company: string; location: string; salary: string; type: string; skills: string[]; match: number; posted: string; description: string; }
