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

export async function getJobs() { await delay(); return mockJobs; }
export async function getJobById(id: string) { await delay(); return mockJobs.find((job) => job.id === id); }
export async function getResumes() { await delay(); return mockResumes; }
export async function getCandidateProfile() { await delay(); return mockProfile; }
export async function getRecommendations() { await delay(); return mockJobs.slice(0, 3); }

