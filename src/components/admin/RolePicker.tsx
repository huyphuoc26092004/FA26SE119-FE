import { CheckBox, textLink } from './AdminKit';
import { permissionsForRole } from '../../services/userService';
import type { UserRole } from '../../types/domain';

const ROLE_LABEL: Record<'vi' | 'en', Record<UserRole, string>> = {
  vi: { CANDIDATE: 'Ứng viên', CAREER_CONSULTANT: 'Cố vấn', ADMIN: 'Quản trị viên' },
  en: { CANDIDATE: 'Candidate', CAREER_CONSULTANT: 'Consultant', ADMIN: 'Administrator' },
};

const copy = {
  vi: {
    step1: 'Vai trò',
    step2: (a: number, b: number) => `Quyền hạn (${a}/${b})`,
    selectAll: 'Chọn tất cả',
    desc: {
      CANDIDATE: 'Nộp CV, làm bài kiểm tra, chat AI',
      CAREER_CONSULTANT: 'Tư vấn, xem CV và phản hồi',
      ADMIN: 'Toàn quyền quản trị hệ thống',
    } as Record<UserRole, string>,
  },
  en: {
    step1: 'Role',
    step2: (a: number, b: number) => `Permissions (${a}/${b})`,
    selectAll: 'Select all',
    desc: {
      CANDIDATE: 'Upload CVs, take tests, chat with AI',
      CAREER_CONSULTANT: 'Consult, review CVs, give feedback',
      ADMIN: 'Full system administration',
    } as Record<UserRole, string>,
  },
};

/** Role radio rows + permission checklist, shared by the list and detail pages. */
export function RolePicker({
  lang,
  role,
  onRole,
  permissions,
  onPermissions,
}: {
  lang: 'vi' | 'en';
  role: UserRole;
  onRole: (r: UserRole) => void;
  permissions: string[];
  onPermissions: (p: string[]) => void;
}) {
  const c = copy[lang];
  // Chỉ quyền của vai trò đang chọn; quyền cũ không thuộc vai trò này không được tính.
  const available = permissionsForRole(role);
  const granted = permissions.filter((k) => available.some((p) => p.key === k));
  return (
    <div className="space-y-8">
      <div>
        <p className="border-b border-ink pb-2 text-[15px] font-medium text-ink">{c.step1}</p>
        <div role="radiogroup">
          {(['CANDIDATE', 'CAREER_CONSULTANT', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => onRole(r)}
              className="flex w-full items-center gap-4 border-b border-border py-3.5 text-left"
            >
              <span
                aria-hidden
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${role === r ? 'border-ink' : 'border-slate-400'}`}
              >
                {role === r && <span className="h-2 w-2 rounded-full bg-ink" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15px] ${role === r ? 'text-ink' : 'text-slate-700'}`}>{ROLE_LABEL[lang][r]}</span>
                <span className="block text-[13px] text-slate-500">{c.desc[r]}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <p className="text-[15px] font-medium text-ink">{c.step2(granted.length, available.length)}</p>
          <button
            type="button"
            onClick={() => onPermissions(available.map((p) => p.key))}
            className={`${textLink} text-[13px] text-slate-600`}
          >
            {c.selectAll}
          </button>
        </div>
        <div className="grid gap-x-8 sm:grid-cols-2">
          {available.map((p) => {
            const isChecked = granted.includes(p.key);
            return (
              <CheckBox
                key={p.key}
                checked={isChecked}
                onChange={(checked) =>
                  onPermissions(checked ? [...granted, p.key] : granted.filter((k) => k !== p.key))
                }
                label={p.name}
                description={p.description}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
