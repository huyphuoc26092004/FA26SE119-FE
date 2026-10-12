import { create } from 'zustand';
import type { User, UserRole } from '../types/domain';
import { mockLogin } from '../mocks/services/mockService';
interface AuthState { user: User | null; accessToken: string | null; isAuthenticated: boolean; role: UserRole | null; login: (email:string,password:string)=>Promise<void>; logout:()=>void; setUser:(user:User)=>void; restoreSession:()=>void; }
const KEY = 'careerpilot-demo-session';
export const useAuthStore = create<AuthState>((set) => ({
 user:null, accessToken:null, isAuthenticated:false, role:null,
 login: async (email,password) => { const session = await mockLogin(email,password); sessionStorage.setItem(KEY,JSON.stringify(session)); set({ ...session,isAuthenticated:true,role:session.user.role }); },
 logout: () => { sessionStorage.removeItem(KEY); set({user:null,accessToken:null,isAuthenticated:false,role:null}); },
 setUser: (user) => set({user,role:user.role}),
 restoreSession: () => { try { const raw = sessionStorage.getItem(KEY); if (!raw) return; const session = JSON.parse(raw) as {user:User;accessToken:string}; if (!session.accessToken.startsWith('mock-') || !session.user?.role) return; set({...session,isAuthenticated:true,role:session.user.role}); } catch { sessionStorage.removeItem(KEY); } }
}));
