import { mockUsers } from '../data/users';
import { mockJobs } from '../data/jobs';
import { mockResumes } from '../data/resumes';
import { mockProfile } from '../data/profile';
import type { User, UserRole } from '../../types/domain';

export const delay = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const USERS_STORAGE_KEY = 'careerpilot-mock-users';
const PASSWORDS_STORAGE_KEY = 'careerpilot-mock-passwords';
const OTPS_STORAGE_KEY = 'careerpilot-mock-otps';

// Initialize and retrieve dynamic users list
function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...mockUsers];
}

function saveStoredUsers(users: User[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getStoredPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveStoredPasswords(passwords: Record<string, string>) {
  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
  } catch {
    // ignore
  }
}

function getStoredOtps(): Record<string, string> {
  try {
    const raw = localStorage.getItem(OTPS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveStoredOtps(otps: Record<string, string>) {
  try {
    localStorage.setItem(OTPS_STORAGE_KEY, JSON.stringify(otps));
  } catch {
    // ignore
  }
}

export async function mockLogin(email: string, password: string) {
  await delay();
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error('Tài khoản không tồn tại trong hệ thống. Vui lòng đăng ký hoặc sử dụng tài khoản demo.');
  }

  const passwords = getStoredPasswords();
  const customPassword = passwords[normalizedEmail];

  // Allow either customized password or global default Demo123!
  const isValidPassword = customPassword ? password === customPassword : password === 'Demo123!';
  if (!isValidPassword) {
    throw new Error('Mật khẩu không chính xác. Với tài khoản demo, hãy nhập Demo123!');
  }

  return { user, accessToken: `mock-${user.id}` };
}

export async function mockRegister(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  await delay();
  const normalizedEmail = params.email.trim().toLowerCase();
  const users = getStoredUsers();

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.');
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: params.name.trim(),
    email: normalizedEmail,
    role: params.role,
    isVerified: false,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);

  // Save password
  const passwords = getStoredPasswords();
  passwords[normalizedEmail] = params.password;
  saveStoredPasswords(passwords);

  // Generate 6-digit OTP (demo standard 123456 or random)
  const otp = '123456';
  const otps = getStoredOtps();
  otps[normalizedEmail] = otp;
  saveStoredOtps(otps);

  return { user: newUser, otp };
}

export async function mockVerifyOtp(email: string, otp: string) {
  await delay();
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();
  const otps = getStoredOtps();
  const expectedOtp = otps[normalizedEmail] || '123456';

  // Allow standard demo OTP 123456 or expected
  if (cleanOtp !== expectedOtp && cleanOtp !== '123456') {
    throw new Error('Mã OTP không chính xác hoặc đã hết hạn. Hãy sử dụng mã demo 123456.');
  }

  const users = getStoredUsers();
  let user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (user) {
    user.isVerified = true;
    saveStoredUsers(users);
  } else {
    // If user registered elsewhere or directly verifying
    user = {
      id: `verified-${Date.now()}`,
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: 'CANDIDATE',
      isVerified: true,
    };
    users.push(user);
    saveStoredUsers(users);
  }

  return {
    success: true,
    user,
    accessToken: `mock-${user.id}`,
  };
}

export async function mockResendOtp(email: string) {
  await delay();
  const normalizedEmail = email.trim().toLowerCase();
  const otps = getStoredOtps();
  const newOtp = '123456';
  otps[normalizedEmail] = newOtp;
  saveStoredOtps(otps);
  return { success: true, otp: newOtp };
}

export async function mockForgotPassword(email: string) {
  await delay();
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error('Không tìm thấy tài khoản với địa chỉ email này.');
  }

  const resetOtp = '888999';
  const otps = getStoredOtps();
  otps[`reset-${normalizedEmail}`] = resetOtp;
  saveStoredOtps(otps);

  return { success: true, otp: resetOtp };
}

export async function mockResetPassword(params: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  await delay();
  const normalizedEmail = params.email.trim().toLowerCase();
  const cleanOtp = params.otp.trim();
  const otps = getStoredOtps();
  const expectedResetOtp = otps[`reset-${normalizedEmail}`] || '888999';

  if (cleanOtp !== expectedResetOtp && cleanOtp !== '888999' && cleanOtp !== '123456') {
    throw new Error('Mã khôi phục không hợp lệ. Vui lòng kiểm tra lại hoặc sử dụng mã demo 888999.');
  }

  const passwords = getStoredPasswords();
  passwords[normalizedEmail] = params.newPassword;
  saveStoredPasswords(passwords);

  return { success: true };
}

const CANDIDATE_PROFILE_KEY = 'careerpilot-mock-candidate-profile';

function getStoredProfile(): import('../../types/domain').CandidateProfile {
  try {
    const raw = localStorage.getItem(CANDIDATE_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { ...mockProfile };
}

function saveStoredProfile(profile: import('../../types/domain').CandidateProfile) {
  try {
    localStorage.setItem(CANDIDATE_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

const RESUMES_STORAGE_KEY = 'careerpilot-mock-resumes';

function getStoredResumes(): import('../../types/domain').Resume[] {
  try {
    const raw = localStorage.getItem(RESUMES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...mockResumes];
}

function saveStoredResumes(resumes: import('../../types/domain').Resume[]) {
  try {
    localStorage.setItem(RESUMES_STORAGE_KEY, JSON.stringify(resumes));
  } catch {
    // ignore
  }
}

export async function getJobs() { await delay(); return mockJobs; }
export async function getJobById(id: string) { await delay(); return mockJobs.find((job) => job.id === id); }

export async function getResumes(): Promise<import('../../types/domain').Resume[]> {
  await delay(250);
  return getStoredResumes();
}

export async function getResumeById(id: string): Promise<import('../../types/domain').Resume | undefined> {
  await delay(200);
  const list = getStoredResumes();
  return list.find((cv) => cv.id === id);
}

export async function createResume(
  data: Partial<import('../../types/domain').Resume>
): Promise<import('../../types/domain').Resume> {
  await delay(350);
  const list = getStoredResumes();
  const id = `cv-${Date.now()}`;
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  // Calculate dynamic ATS Score based on completeness
  let ats = 65;
  if (data.experience && data.experience.length > 0) ats += 12;
  if (data.skills && data.skills.length >= 5) ats += 10;
  if (data.summary && data.summary.length > 50) ats += 5;
  if (data.projects && data.projects.length > 0) ats += 5;
  if (data.education && data.education.length > 0) ats += 3;
  ats = Math.min(ats, 98);

  const newResume: import('../../types/domain').Resume = {
    id,
    name: data.name || 'Bản CV mới',
    position: data.position || 'Software Engineer',
    language: data.language || 'English',
    updatedAt: formattedDate,
    atsScore: data.atsScore || ats,
    status: data.status || 'Ready',
    isDefault: list.length === 0 || data.isDefault,
    fullName: data.fullName || 'Alex Morgan',
    email: data.email || 'candidate@example.com',
    phone: data.phone || '(+84) 912 345 678',
    location: data.location || 'Hồ Chí Minh, Việt Nam',
    website: data.website || '',
    linkedin: data.linkedin || '',
    github: data.github || '',
    summary: data.summary || '',
    experience: data.experience || [],
    education: data.education || [],
    skills: data.skills || [],
    detailedSkills: data.detailedSkills || [],
    softSkills: data.softSkills || [],
    projects: data.projects || [],
    certifications: data.certifications || [],
    atsBreakdown: data.atsBreakdown || {
      formatting: 90,
      keywords: 85,
      impactMetrics: 80,
      structure: 88,
      strengths: [
        'Cấu trúc hồ sơ rõ ràng, thông tin trình bày khoa học.',
        'Kỹ năng công nghệ phù hợp với xu hướng tuyển dụng.',
      ],
      improvements: [
        'Bổ sung thêm các chứng chỉ ngoại ngữ và công nghệ mới.',
        'Định lượng cụ thể hiệu quả công việc bằng số liệu % hoặc doanh thu.',
      ],
      matchedKeywords: data.skills?.slice(0, 5) || ['React', 'TypeScript', 'Web'],
      missingKeywords: ['CI/CD Pipelines', 'System Architecture'],
    },
    extractedMeta: data.extractedMeta,
  };

  const updatedList = [newResume, ...list];
  saveStoredResumes(updatedList);
  return newResume;
}

export async function updateResume(
  id: string,
  updates: Partial<import('../../types/domain').Resume>
): Promise<import('../../types/domain').Resume> {
  await delay(300);
  const list = getStoredResumes();
  const index = list.findIndex((cv) => cv.id === id);
  if (index === -1) {
    throw new Error('Không tìm thấy bản CV cần cập nhật.');
  }

  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  const current = list[index];
  const merged: import('../../types/domain').Resume = {
    ...current,
    ...updates,
    updatedAt: formattedDate,
  };

  list[index] = merged;
  saveStoredResumes(list);
  return merged;
}

export async function deleteResume(id: string): Promise<boolean> {
  await delay(250);
  const list = getStoredResumes();
  const filtered = list.filter((cv) => cv.id !== id);
  if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
    filtered[0].isDefault = true;
  }
  saveStoredResumes(filtered);
  return true;
}

export async function setDefaultResume(id: string): Promise<import('../../types/domain').Resume> {
  await delay(200);
  const list = getStoredResumes();
  let target: import('../../types/domain').Resume | undefined;
  const updated = list.map((cv) => {
    if (cv.id === id) {
      target = { ...cv, isDefault: true };
      return target;
    }
    return { ...cv, isDefault: false };
  });
  saveStoredResumes(updated);
  if (!target) throw new Error('Không tìm thấy CV');
  return target;
}

export async function simulateAiCvExtraction(file: {
  name: string;
  size: number;
}): Promise<Partial<import('../../types/domain').Resume>> {
  await delay(1200); // Simulate realistic OCR & LLM semantic parsing
  const isVietnamese = file.name.toLowerCase().includes('tieng-viet') || file.name.toLowerCase().includes('vn');
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  return {
    name: file.name.replace(/\.[^/.]+$/, ''),
    position: 'Senior Frontend / Fullstack Engineer',
    language: isVietnamese ? 'Vietnamese' : 'English',
    fullName: 'Alex Morgan',
    email: 'candidate@example.com',
    phone: '(+84) 912 345 678',
    location: 'Hồ Chí Minh, Việt Nam',
    website: 'https://alexmorgan.dev',
    linkedin: 'https://linkedin.com/in/alex-morgan-dev',
    github: 'https://github.com/alexmorgan-fe',
    summary:
      'Kỹ sư Phần mềm giàu kinh nghiệm với hơn 4 năm thực chiến phát triển các ứng dụng web quy mô lớn trên nền tảng React, TypeScript, Node.js và Next.js. Am hiểu kiến trúc Micro-frontends, tối ưu hóa hiệu năng ứng dụng (Web Vitals) và tích hợp các giải pháp AI tự động hóa.',
    skills: [
      'React',
      'TypeScript',
      'Next.js',
      'Tailwind CSS',
      'Node.js',
      'GraphQL',
      'Docker',
      'PostgreSQL',
      'RESTful APIs',
      'State Management (Zustand)',
    ],
    detailedSkills: [
      { name: 'React', level: 'Expert', category: 'technical' },
      { name: 'TypeScript', level: 'Advanced', category: 'technical' },
      { name: 'Next.js', level: 'Advanced', category: 'technical' },
      { name: 'Node.js', level: 'Intermediate', category: 'technical' },
      { name: 'Tailwind CSS', level: 'Expert', category: 'technical' },
      { name: 'Docker', level: 'Intermediate', category: 'tool' },
    ],
    softSkills: [
      'Giải quyết vấn đề (Problem Solving)',
      'Làm việc nhóm & Hướng dẫn (Mentoring)',
      'Phương pháp Agile / Scrum',
      'Giao tiếp liên phòng ban',
    ],
    experience: [
      {
        id: `exp-${Date.now()}-1`,
        role: 'Senior Frontend Engineer / Tech Lead',
        company: 'Nexus Tech Global',
        location: 'Hồ Chí Minh',
        startDate: '03/2022',
        endDate: 'Hiện tại',
        isCurrent: true,
        description:
          'Chịu trách nhiệm kiến trúc và dẫn dắt đội ngũ 6 kỹ sư frontend phát triển hệ sinh thái SaaS phục vụ hơn 200,000 người dùng hàng tháng.',
        highlights: [
          'Chuyển đổi hệ thống nguyên khối sang Micro-frontend Next.js, giúp tăng tốc độ triển khai tính năng lên 40%.',
          'Tối ưu hóa điểm Core Web Vitals (LCP giảm từ 3.2s xuống 1.1s), nâng cao trải nghiệm người dùng.',
          'Xây dựng thư viện Design System chuẩn Accessibility (a11y) dùng chung cho 4 dự án nội bộ.',
        ],
      },
      {
        id: `exp-${Date.now()}-2`,
        role: 'Frontend Developer',
        company: 'VinaSoft Technologies',
        location: 'Hà Nội',
        startDate: '06/2020',
        endDate: '02/2022',
        isCurrent: false,
        description:
          'Tham gia phát triển các sản phẩm fintech ngân hàng số và cổng thanh toán trực tuyến.',
        highlights: [
          'Tích hợp các cổng thanh toán bảo mật cao với chuẩn xác thực đa yếu tố (2FA / OTP).',
          'Viết kiểm thử tự động với Jest & React Testing Library đạt trên 80% độ bao phủ mã nguồn.',
        ],
      },
    ],
    education: [
      {
        id: `edu-${Date.now()}-1`,
        school: 'Đại học Bách Khoa (HCMUT)',
        degree: 'Cử nhân Kỹ thuật',
        field: 'Khoa học Máy tính & Kỹ thuật Phần mềm',
        startDate: '2016',
        endDate: '2020',
        gpa: '3.6 / 4.0',
        highlights: ['Tốt nghiệp loại Giỏi', 'Giải Nhì Hackathon Techfest 2019'],
      },
    ],
    projects: [
      {
        id: `proj-${Date.now()}-1`,
        name: 'Intelligent AI CV Matching Agent Platform',
        role: 'Lead Architect',
        techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Gemini AI API'],
        link: 'https://github.com/alexmorgan-fe/career-agent-ui',
        description:
          'Hệ thống ứng dụng AI tự động bóc tách thực thể từ CV, chấm điểm độ tương thích ATS và đề xuất việc làm chuẩn xác.',
      },
    ],
    certifications: [
      {
        id: `cert-${Date.now()}-1`,
        name: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        date: '2023',
      },
    ],
    atsScore: 92,
    status: 'Ready',
    atsBreakdown: {
      formatting: 95,
      keywords: 90,
      impactMetrics: 88,
      structure: 94,
      strengths: [
        'Văn bản được bóc tách với độ chính xác cao (Confidence 98%).',
        'Các đề mục kinh nghiệm và kỹ năng rõ ràng, chuẩn định dạng ATS thế hệ mới.',
        'Đã có số liệu định lượng thành tích thực tế (% tăng trưởng, thời gian tối ưu).',
      ],
      improvements: [
        'Kiểm tra lại định dạng ngày tháng của các công ty trước đây để đảm bảo đồng nhất.',
        'Bổ sung thêm một số từ khóa chuyên môn về CI/CD Pipelines và Cloud Deployment nếu có.',
      ],
      matchedKeywords: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Core Web Vitals', 'Micro-frontend'],
      missingKeywords: ['Kubernetes', 'Serverless'],
    },
    extractedMeta: {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      extractedAt: formattedDate,
      confidenceScore: 96,
      extractionWarnings: [
        'Đã tự động chuẩn hóa định dạng số điện thoại theo chuẩn quốc tế (+84).',
        'Phát hiện 1 vị trí công việc chưa có ngày kết thúc (mặc định là Hiện tại).',
      ],
      rawTextSnippet: `Họ tên: Alex Morgan - Vị trí: Senior Frontend Engineer - SĐT: (+84) 912 345 678 - Email: candidate@example.com - Kỹ năng: React, TypeScript, Next.js, Tailwind, Node.js... Kinh nghiệm: Nexus Tech Global (2022 - Hiện tại)...`,
    },
  };
}

export async function getCandidateProfile(): Promise<import('../../types/domain').CandidateProfile> {
  await delay();
  return getStoredProfile();
}

export async function updateCandidateProfile(
  updates: Partial<import('../../types/domain').CandidateProfile>
): Promise<import('../../types/domain').CandidateProfile> {
  await delay();
  const current = getStoredProfile();
  const merged: import('../../types/domain').CandidateProfile = {
    ...current,
    ...updates,
  };
  // Dynamically calculate completion percentage
  let score = 50;
  if (merged.name && merged.headline) score += 10;
  if (merged.phone && merged.email) score += 10;
  if (merged.bio) score += 5;
  if (merged.targetPosition && (merged.expectedSalary || merged.salaryMin)) score += 10;
  if (merged.skills && merged.skills.length >= 5) score += 10;
  if (merged.linkedin || merged.github) score += 5;
  merged.completion = Math.min(score, 100);

  saveStoredProfile(merged);
  return merged;
}

export async function getRecommendations() { await delay(); return mockJobs.slice(0, 3); }

export interface AiGenerateResumeParams {
  careerTrack: string;
  level: string;
  language: 'Vietnamese' | 'English';
  tone?: 'impact' | 'technical' | 'modern';
  focusKeywords?: string;
  candidateName?: string;
}

export async function generateAiResume(params: AiGenerateResumeParams): Promise<Partial<import('../../types/domain').Resume>> {
  await delay(1100); // Simulate realistic LLM generation

  const isVi = params.language === 'Vietnamese';
  const name = params.candidateName || 'Alex Morgan';
  const track = params.careerTrack || 'frontend';
  const level = params.level || 'Senior';

  // Career track data dictionary
  const tracksData: Record<string, {
    titleEn: string;
    titleVi: string;
    summaryEn: string;
    summaryVi: string;
    skills: string[];
    expEn: import('../../types/domain').WorkExperience[];
    expVi: import('../../types/domain').WorkExperience[];
    projectsEn: import('../../types/domain').ProjectItem[];
    projectsVi: import('../../types/domain').ProjectItem[];
  }> = {
    frontend: {
      titleEn: `${level} Frontend Engineer / Web Architect`,
      titleVi: `Kỹ sư Frontend ${level === 'Senior' ? 'Cao cấp' : level === 'Lead' ? 'Trưởng nhóm' : ''} / Kiến trúc sư Web`,
      summaryEn: `Results-driven ${level} Frontend Engineer with proven expertise in React, TypeScript, Next.js, and modern web architecture. Specializes in building highly responsive, accessible web applications and optimizing Core Web Vitals to deliver exceptional digital experiences for 250,000+ monthly active users.`,
      summaryVi: `Kỹ sư Frontend ${level === 'Senior' ? 'Cao cấp' : level} với kinh nghiệm chuyên sâu về React, TypeScript, Next.js và kiến trúc micro-frontend hiện đại. Đam mê tối ưu hóa hiệu năng ứng dụng web (Core Web Vitals), nâng cao trải nghiệm người dùng và tích hợp các giải pháp AI tự động hóa.`,
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'State Management (Zustand)', 'Docker', 'RESTful APIs', 'Jest / RTL', 'Web Performance & a11y'],
      expEn: [
        {
          id: `exp-${Date.now()}-1`,
          role: `${level} Frontend Engineer`,
          company: 'Nexus Global Software',
          location: 'Ho Chi Minh City, Vietnam',
          startDate: '04/2022',
          endDate: 'Present',
          isCurrent: true,
          description: 'Architected and spearheaded the core frontend development of high-traffic SaaS cloud platforms.',
          highlights: [
            'Spearheaded migration from legacy monolithic UI to Next.js App Router, boosting page load speeds by 42%.',
            'Engineered reusable design system component library with 100% TypeScript type safety and full WCAG accessibility compliance.',
            'Mentored 6 junior/mid engineers and established automated CI/CD unit & E2E testing workflows, achieving 88% test coverage.',
          ],
        },
        {
          id: `exp-${Date.now()}-2`,
          role: 'Frontend Developer',
          company: 'VinaTech Enterprise',
          location: 'Hanoi, Vietnam',
          startDate: '08/2020',
          endDate: '03/2022',
          isCurrent: false,
          description: 'Built customer-facing portals and financial transaction interfaces.',
          highlights: [
            'Developed real-time financial dashboards utilizing WebSocket streams and Zustand state management.',
            'Collaborated cross-functionally with product and design teams in Figma to cut feature delivery cycles by 30%.',
          ],
        },
      ],
      expVi: [
        {
          id: `exp-${Date.now()}-1`,
          role: `Kỹ sư Frontend ${level === 'Senior' ? 'Cao cấp' : level}`,
          company: 'Nexus Global Software',
          location: 'Hồ Chí Minh, Việt Nam',
          startDate: '04/2022',
          endDate: 'Hiện tại',
          isCurrent: true,
          description: 'Chịu trách nhiệm kiến trúc và dẫn dắt phát triển nền tảng web SaaS phục vụ hơn 250,000 người dùng hàng tháng.',
          highlights: [
            'Dẫn dắt chuyển đổi kiến trúc sang Next.js App Router, giúp cải thiện tốc độ tải trang (LCP) nhanh hơn 42%.',
            'Xây dựng thư viện Design System chuẩn TypeScript và tương thích hoàn toàn tiêu chuẩn tiếp cận người dùng (a11y).',
            'Hướng dẫn chuyên môn cho 6 kỹ sư frontend và thiết lập quy trình kiểm thử tự động đạt 88% độ bao phủ mã nguồn.',
          ],
        },
        {
          id: `exp-${Date.now()}-2`,
          role: 'Lập trình viên Frontend',
          company: 'VinaTech Enterprise',
          location: 'Hà Nội, Việt Nam',
          startDate: '08/2020',
          endDate: '03/2022',
          isCurrent: false,
          description: 'Phát triển các cổng thông tin khách hàng và ứng dụng giao dịch tài chính trực tuyến.',
          highlights: [
            'Xây dựng bảng điều khiển tài chính thời gian thực sử dụng kết nối WebSocket và quản lý trạng thái Zustand.',
            'Hợp tác chặt chẽ cùng Product Manager và Designer trên Figma, rút ngắn chu kỳ bàn giao tính năng xuống 30%.',
          ],
        },
      ],
      projectsEn: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'AI-Powered Career Intelligence Platform',
          role: 'Lead Frontend Developer',
          techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'AI Agent API'],
          link: 'https://github.com/alexmorgan-fe/career-agent-ui',
          description: 'Developed an intelligent web portal featuring real-time ATS scoring, resume extraction, and semantic job matching.',
        },
      ],
      projectsVi: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'Nền tảng Hướng nghiệp Thông minh & Đối sánh CV bằng AI',
          role: 'Trưởng nhóm Phát triển Frontend',
          techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'AI Agent API'],
          link: 'https://github.com/alexmorgan-fe/career-agent-ui',
          description: 'Ứng dụng web thông minh hỗ trợ phân tích điểm chuẩn ATS, tự động bóc tách thực thể CV và đối sánh việc làm theo ngữ nghĩa.',
        },
      ],
    },
    backend: {
      titleEn: `${level} Backend Engineer / Microservices Specialist`,
      titleVi: `Kỹ sư Backend ${level === 'Senior' ? 'Cao cấp' : level} / Chuyên gia Microservices`,
      summaryEn: `High-impact ${level} Backend Engineer with deep knowledge of distributed systems, Go, Node.js, PostgreSQL, and cloud infrastructure. Passionate about architecting fault-tolerant microservices, optimizing database performance, and achieving 99.99% service availability.`,
      summaryVi: `Kỹ sư Backend ${level === 'Senior' ? 'Cao cấp' : level} am hiểu sâu sắc về hệ thống phân tán, Go, Node.js, PostgreSQL và hạ tầng đám mây. Có thế mạnh trong thiết kế kiến trúc vi dịch vụ (Microservices), tối ưu hóa cơ sở dữ liệu và duy trì độ khả dụng hệ thống 99.99%.`,
      skills: ['Node.js', 'Go (Golang)', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'gRPC', 'Kafka', 'Microservices', 'AWS / Cloud'],
      expEn: [
        {
          id: `exp-${Date.now()}-1`,
          role: `${level} Backend Engineer`,
          company: 'CloudScale Infrastructure',
          location: 'Ho Chi Minh City, Vietnam',
          startDate: '01/2022',
          endDate: 'Present',
          isCurrent: true,
          description: 'Engineered high-throughput payment and data processing microservices processing 15M+ requests daily.',
          highlights: [
            'Architected distributed microservices in Go and Node.js with gRPC, slashing inter-service latency by 55%.',
            'Implemented asynchronous event streaming with Apache Kafka and Redis caching, achieving 99.99% uptime.',
            'Tuned PostgreSQL database queries and indexes, cutting slow query frequency by 70%.',
          ],
        },
      ],
      expVi: [
        {
          id: `exp-${Date.now()}-1`,
          role: `Kỹ sư Backend ${level === 'Senior' ? 'Cao cấp' : level}`,
          company: 'CloudScale Infrastructure',
          location: 'Hồ Chí Minh, Việt Nam',
          startDate: '01/2022',
          endDate: 'Hiện tại',
          isCurrent: true,
          description: 'Thiết kế và vận hành các vi dịch vụ xử lý thanh toán và dữ liệu quy mô lớn với hơn 15 triệu lượt yêu cầu mỗi ngày.',
          highlights: [
            'Kiến trúc hệ thống vi dịch vụ bằng Go và Node.js qua gRPC, giảm độ trễ giao tiếp giữa các dịch vụ tới 55%.',
            'Triển khai kiến trúc hướng sự kiện bất đồng bộ qua Apache Kafka và bộ đệm Redis, đạt độ khả dụng 99.99%.',
            'Tối ưu hóa các truy vấn và chỉ mục cơ sở dữ liệu PostgreSQL, giảm 70% các truy vấn tải chậm.',
          ],
        },
      ],
      projectsEn: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'Distributed Event-Driven Payment Gateway',
          role: 'Backend Architect',
          techStack: ['Go', 'PostgreSQL', 'Kafka', 'Docker', 'Kubernetes'],
          description: 'Built high-concurrency payment gateway handling 5,000 TPS with zero transaction loss.',
        },
      ],
      projectsVi: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'Cổng thanh toán Phân tán Hướng sự kiện',
          role: 'Kiến trúc sư Backend',
          techStack: ['Go', 'PostgreSQL', 'Kafka', 'Docker', 'Kubernetes'],
          description: 'Xây dựng cổng thanh toán có độ chịu tải cao xử lý 5,000 giao dịch/giây với độ chính xác tuyệt đối.',
        },
      ],
    },
    'ai-ml': {
      titleEn: `${level} AI / Machine Learning Engineer`,
      titleVi: `Kỹ sư AI & Trí tuệ Nhân tạo ${level === 'Senior' ? 'Cao cấp' : level}`,
      summaryEn: `Innovative ${level} AI Engineer specializing in Generative AI, Large Language Models (LLM), Retrieval-Augmented Generation (RAG), and vector databases. Track record of taking state-of-the-art machine learning models from prototype to high-scale production.`,
      summaryVi: `Kỹ sư AI ${level === 'Senior' ? 'Cao cấp' : level} chuyên sâu về Generative AI, mô hình ngôn ngữ lớn (LLM), kiến trúc RAG và cơ sở dữ liệu vector. Có kinh nghiệm triển khai các giải pháp AI tiên tiến từ nguyên mẫu thử nghiệm vào sản xuất thực tế phục vụ quy mô lớn.`,
      skills: ['Python', 'PyTorch', 'LangChain', 'LLMs & Prompt Engineering', 'RAG Pipelines', 'Vector Databases (Chroma/Milvus)', 'FastAPI', 'Docker', 'MLOps', 'Transformers'],
      expEn: [
        {
          id: `exp-${Date.now()}-1`,
          role: `${level} AI / ML Engineer`,
          company: 'Nexus Cognitive Intelligence',
          location: 'Ho Chi Minh City, Vietnam',
          startDate: '02/2023',
          endDate: 'Present',
          isCurrent: true,
          description: 'Spearheaded enterprise AI Agent solutions and semantic search algorithms.',
          highlights: [
            'Built enterprise RAG pipeline combining LangChain and Vector DB, increasing information retrieval precision to 94%.',
            'Fine-tuned open-source LLMs (Llama 3, Mistral) for domain-specific Vietnamese & English legal and recruitment tasks.',
            'Containerized ML inference APIs using FastAPI and Triton Server, achieving sub-200ms response times.',
          ],
        },
      ],
      expVi: [
        {
          id: `exp-${Date.now()}-1`,
          role: `Kỹ sư AI / Machine Learning ${level === 'Senior' ? 'Cao cấp' : level}`,
          company: 'Nexus Cognitive Intelligence',
          location: 'Hồ Chí Minh, Việt Nam',
          startDate: '02/2023',
          endDate: 'Hiện tại',
          isCurrent: true,
          description: 'Dẫn dắt phát triển các giải pháp Trợ lý AI Agent doanh nghiệp và thuật toán tìm kiếm ngữ nghĩa.',
          highlights: [
            'Xây dựng hệ thống RAG kết hợp LangChain và cơ sở dữ liệu Vector, nâng cao độ chính xác truy xuất thông tin lên 94%.',
            'Huấn luyện tinh chỉnh (Fine-tuning) mô hình ngôn ngữ lớn (Llama 3, Mistral) chuyên biệt cho ngôn ngữ Tiếng Việt và Tiếng Anh.',
            'Đóng gói API suy luận AI bằng FastAPI và Triton Server, đạt thời gian phản hồi dưới 200ms.',
          ],
        },
      ],
      projectsEn: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'Autonomous Multi-Agent Recruitment Engine',
          role: 'Lead AI Engineer',
          techStack: ['Python', 'LangChain', 'FastAPI', 'ChromaDB', 'Gemini AI'],
          description: 'Orchestrated collaborative AI agents to parse resumes, evaluate candidate competency, and conduct simulated interviews.',
        },
      ],
      projectsVi: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'Hệ thống Đa Tác nhân AI Tự động Tuyển dụng',
          role: 'Kỹ sư AI Trưởng',
          techStack: ['Python', 'LangChain', 'FastAPI', 'ChromaDB', 'Gemini AI'],
          description: 'Điều phối các AI Agent phối hợp bóc tách CV, chấm điểm năng lực ứng viên và đối sánh tự động.',
        },
      ],
    },
    fullstack: {
      titleEn: `${level} Fullstack Engineer (React / Node / Cloud)`,
      titleVi: `Kỹ sư Fullstack ${level === 'Senior' ? 'Cao cấp' : level} (React / Node.js / Cloud)`,
      summaryEn: `Versatile ${level} Fullstack Engineer with expertise across modern frontend ecosystems and scalable cloud backend services. Adept at rapid prototyping, clean code standards, and delivering complete web products from concept to launch.`,
      summaryVi: `Kỹ sư Fullstack ${level === 'Senior' ? 'Cao cấp' : level} toàn diện với năng lực làm chủ từ giao diện frontend hiện đại đến các dịch vụ backend đám mây có khả năng mở rộng cao. Có thế mạnh về phát triển sản phẩm trọn gói từ ý tưởng đến triển khai.`,
      skills: ['React', 'Node.js', 'TypeScript', 'Next.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'REST & GraphQL', 'AWS', 'CI/CD'],
      expEn: [
        {
          id: `exp-${Date.now()}-1`,
          role: `${level} Fullstack Engineer`,
          company: 'VinaDigital Innovations',
          location: 'Ho Chi Minh City, Vietnam',
          startDate: '03/2022',
          endDate: 'Present',
          isCurrent: true,
          description: 'Delivered end-to-end features and cloud integrations for fintech and marketplace web platforms.',
          highlights: [
            'Designed full-stack web applications with Next.js, Node.js, and PostgreSQL for 180,000+ users.',
            'Built CI/CD automated deployment pipelines on AWS ECS and Docker, cutting deployment time by 60%.',
          ],
        },
      ],
      expVi: [
        {
          id: `exp-${Date.now()}-1`,
          role: `Kỹ sư Fullstack ${level === 'Senior' ? 'Cao cấp' : level}`,
          company: 'VinaDigital Innovations',
          location: 'Hồ Chí Minh, Việt Nam',
          startDate: '03/2022',
          endDate: 'Hiện tại',
          isCurrent: true,
          description: 'Phát triển toàn diện từ frontend đến backend và tích hợp đám mây cho các nền tảng thương mại điện tử và fintech.',
          highlights: [
            'Thiết kế và triển khai ứng dụng full-stack với Next.js, Node.js và PostgreSQL phục vụ hơn 180,000 người dùng.',
            'Xây dựng quy trình CI/CD tự động hóa trên AWS ECS và Docker, rút ngắn 60% thời gian triển khai tính năng.',
          ],
        },
      ],
      projectsEn: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'End-to-End E-Commerce Cloud Platform',
          role: 'Fullstack Architect',
          techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Docker'],
          description: 'Complete marketplace with automated payments, inventory tracking, and analytics dashboards.',
        },
      ],
      projectsVi: [
        {
          id: `proj-${Date.now()}-1`,
          name: 'Nền tảng Thương mại Điện tử Đám mây Trọn gói',
          role: 'Kiến trúc sư Fullstack',
          techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'Docker'],
          description: 'Hệ thống thương mại điện tử tích hợp cổng thanh toán trực tuyến, quản lý tồn kho và bảng phân tích doanh thu.',
        },
      ],
    },
  };

  const selectedTrack = tracksData[track] || tracksData.frontend;
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  // Custom prompt emphasis if provided
  let summary = isVi ? selectedTrack.summaryVi : selectedTrack.summaryEn;
  if (params.focusKeywords) {
    summary += isVi
      ? ` Đặc biệt có thế mạnh và tập trung vào: ${params.focusKeywords}.`
      : ` Particularly focused on: ${params.focusKeywords}.`;
  }

  return {
    name: isVi ? `Bản CV ${selectedTrack.titleVi} (Tạo bởi AI)` : `${selectedTrack.titleEn} (AI Crafted)`,
    position: isVi ? selectedTrack.titleVi : selectedTrack.titleEn,
    language: isVi ? 'Vietnamese' : 'English',
    fullName: name,
    email: 'candidate@example.com',
    phone: '(+84) 912 345 678',
    location: isVi ? 'Hồ Chí Minh, Việt Nam' : 'Ho Chi Minh City, Vietnam',
    website: 'https://alexmorgan.dev',
    linkedin: 'https://linkedin.com/in/alex-morgan-dev',
    github: 'https://github.com/alexmorgan-fe',
    summary,
    skills: selectedTrack.skills,
    experience: isVi ? selectedTrack.expVi : selectedTrack.expEn,
    education: [
      {
        id: `edu-${Date.now()}-1`,
        school: isVi ? 'Đại học Bách Khoa (HCMUT)' : 'Ho Chi Minh City University of Technology (HCMUT)',
        degree: isVi ? 'Cử nhân Kỹ thuật' : 'Bachelor of Engineering',
        field: isVi ? 'Khoa học Máy tính & Kỹ thuật Phần mềm' : 'Computer Science & Software Engineering',
        startDate: '2016',
        endDate: '2020',
        gpa: '3.6 / 4.0',
        highlights: isVi
          ? ['Tốt nghiệp loại Giỏi', 'Giải Nhì Cuộc thi Lập trình Phần mềm Sáng tạo']
          : ['Graduated with Honors', 'Second Prize, Innovative Software Engineering Contest'],
      },
    ],
    projects: isVi ? selectedTrack.projectsVi : selectedTrack.projectsEn,
    certifications: [
      {
        id: `cert-${Date.now()}-1`,
        name: isVi ? 'Chứng chỉ Kỹ sư Chuyên nghiệp AWS' : 'AWS Certified Developer Associate',
        issuer: 'Amazon Web Services',
        date: '2023',
      },
    ],
    atsScore: 95,
    status: 'Ready',
    atsBreakdown: {
      formatting: 96,
      keywords: 95,
      impactMetrics: 94,
      structure: 96,
      strengths: isVi
        ? [
            'Bản CV được tối ưu hóa chuẩn xác theo mô tả công việc (JD) mới nhất của ngành.',
            'Có số liệu thành tích định lượng (STAR format) rõ ràng (% tăng trưởng, thời gian tối ưu).',
            'Định dạng cấu trúc phân cấp chuẩn giúp hệ thống ATS đọc và chấm điểm dễ dàng.',
          ]
        : [
            'Precision-tailored against the latest industry job descriptions and hiring benchmarks.',
            'Strong quantified achievements (STAR methodology) demonstrating real business impact.',
            'Flawless single-column hierarchy ensuring 100% ATS parser readability.',
          ],
      improvements: isVi
        ? ['Có thể bổ sung thêm các liên kết demo trực tiếp đến sản phẩm cá nhân.']
        : ['Consider adding direct live deployment URLs to showcase completed work.'],
      matchedKeywords: selectedTrack.skills.slice(0, 6),
      missingKeywords: ['Agile Leadership', 'System Design'],
    },
    extractedMeta: {
      fileName: 'AI_Generated_Resume.pdf',
      fileSize: '1.1 MB',
      extractedAt: formattedDate,
      confidenceScore: 99,
      rawTextSnippet: summary,
    },
  };
}

export async function translateResumeContent(
  cv: Partial<import('../../types/domain').Resume>,
  targetLanguage: 'Vietnamese' | 'English'
): Promise<Partial<import('../../types/domain').Resume>> {
  await delay(600); // Simulate instant AI translation
  const isTargetVi = targetLanguage === 'Vietnamese';

  // Translate career position
  let translatedPosition = cv.position || '';
  if (isTargetVi) {
    translatedPosition = translatedPosition
      .replace(/Senior/gi, 'Cao cấp (Senior)')
      .replace(/Frontend/gi, 'Frontend')
      .replace(/Engineer/gi, 'Kỹ sư')
      .replace(/Developer/gi, 'Lập trình viên')
      .replace(/Lead/gi, 'Trưởng nhóm (Lead)');
  } else {
    translatedPosition = translatedPosition
      .replace(/Kỹ sư/gi, 'Engineer')
      .replace(/Cao cấp/gi, 'Senior')
      .replace(/Trưởng nhóm/gi, 'Lead')
      .replace(/Lập trình viên/gi, 'Developer');
  }

  // Translate summary
  let translatedSummary = cv.summary || '';
  if (isTargetVi) {
    if (!translatedSummary.includes('Kỹ sư')) {
      translatedSummary = `Kỹ sư ${cv.position || 'Phần mềm'} giàu kinh nghiệm chuyên sâu về công nghệ hiện đại. Đam mê tối ưu hóa hiệu năng ứng dụng, nâng cao trải nghiệm người dùng và áp dụng các giải pháp tự động hóa thông minh vào sản phẩm thực tế.`;
    }
  } else {
    if (!translatedSummary.includes('Engineer')) {
      translatedSummary = `Results-oriented ${cv.position || 'Software Engineer'} with strong expertise in modern technology stacks. Passionate about performance optimization, user experience, and delivering high-impact scalable digital solutions.`;
    }
  }

  // Translate experience description & highlights
  const translatedExp = (cv.experience || []).map((exp) => ({
    ...exp,
    role: isTargetVi
      ? exp.role.replace(/Engineer/gi, 'Kỹ sư').replace(/Developer/gi, 'Lập trình viên')
      : exp.role.replace(/Kỹ sư/gi, 'Engineer').replace(/Lập trình viên/gi, 'Developer'),
    description: isTargetVi
      ? `Chịu trách nhiệm kiến trúc và dẫn dắt phát triển hệ thống phần mềm tại ${exp.company}.`
      : `Led software engineering and architectural delivery of core products at ${exp.company}.`,
    highlights: (exp.highlights || []).map((h) =>
      isTargetVi
        ? h.replace(/Spearheaded/gi, 'Dẫn dắt').replace(/Engineered/gi, 'Xây dựng').replace(/boosting/gi, 'nâng cao')
        : h.replace(/Dẫn dắt/gi, 'Spearheaded').replace(/Xây dựng/gi, 'Engineered').replace(/nâng cao/gi, 'improving')
    ),
  }));

  return {
    ...cv,
    name: isTargetVi
      ? `${cv.name?.replace(/\(AI Crafted\)/gi, '') || 'Bản CV'} (Tiếng Việt)`
      : `${cv.name?.replace(/\(Tạo bởi AI\)/gi, '') || 'Resume'} (English)`,
    position: translatedPosition,
    language: targetLanguage,
    location: isTargetVi ? 'Hồ Chí Minh, Việt Nam' : 'Ho Chi Minh City, Vietnam',
    summary: translatedSummary,
    experience: translatedExp,
  };
}



