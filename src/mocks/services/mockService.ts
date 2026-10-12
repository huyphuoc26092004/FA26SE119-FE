import { mockUsers } from '../data/users';
import { mockJobs } from '../data/jobs';
import { mockResumes } from '../data/resumes';
import { mockProfile } from '../data/profile';
export const delay = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export async function mockLogin(email: string, password: string) { await delay(); if (password !== 'Demo123!') throw new Error('Invalid demo password'); const user = mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase()); if (!user) throw new Error('Demo account not found'); return { user, accessToken: `mock-${user.id}` }; }
export async function getJobs() { await delay(); return mockJobs; }
export async function getJobById(id: string) { await delay(); return mockJobs.find((job) => job.id === id); }
export async function getResumes() { await delay(); return mockResumes; }
export async function getCandidateProfile() { await delay(); return mockProfile; }
export async function getRecommendations() { await delay(); return mockJobs.slice(0, 3); }
