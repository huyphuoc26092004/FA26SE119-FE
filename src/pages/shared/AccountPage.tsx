import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyRow,
  Headline,
  InfoRow,
  Modal,
  Note,
  SectionHead,
  Toast,
  brandLink,
  dangerButton,
  dangerLink,
  fieldLabel,
  outlineButton,
  primaryButton,
  underlineInput,
  underlineSelect,
} from '../../components/admin/AdminKit';
import {
  changePassword,
  deleteOwnAccount,
  getAccount,
  getLoginSessions,
  revokeLoginSession,
  updateAccount,
} from '../../services/accountService';
import { useAuthStore } from '../../stores/authStore';

const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra, thử lại sau.');

/** /{role}/account — hồ sơ cá nhân, đổi mật khẩu, phiên đăng nhập và xoá tài khoản (dùng chung mọi vai trò). */
export default function AccountPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const accountQuery = useQuery({ queryKey: ['me'], queryFn: getAccount });
  const sessionsQuery = useQuery({ queryKey: ['me', 'sessions'], queryFn: getLoginSessions });
  const account = accountQuery.data;

  const [form, setForm] = useState({ fullName: '', avatarUrl: '', githubUrl: '', preferredLanguage: 'vi' as 'vi' | 'en' });
  useEffect(() => {
    if (account) {
      setForm({ fullName: account.fullName, avatarUrl: account.avatarUrl, githubUrl: account.githubUrl, preferredLanguage: account.preferredLanguage });
    }
  }, [account]);

  const saveProfile = useMutation({
    mutationFn: () => updateAccount(form),
    onSuccess: (next) => {
      queryClient.setQueryData(['me'], next);
      const current = useAuthStore.getState().user;
      if (current) useAuthStore.setState({ user: { ...current, name: next.fullName } });
      showToast('Đã lưu thông tin cá nhân');
    },
  });

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const savePassword = useMutation({
    mutationFn: () => changePassword(passwords.current, passwords.next),
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      showToast('Đã đổi mật khẩu');
    },
    onError: (error) => setPasswordError(errorText(error)),
  });
  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwords.next.length < 10) return setPasswordError('Mật khẩu mới cần ít nhất 10 ký tự.');
    if (passwords.next !== passwords.confirm) return setPasswordError('Hai lần nhập mật khẩu mới chưa khớp.');
    savePassword.mutate();
  };

  const revoke = useMutation({
    mutationFn: revokeLoginSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] });
      showToast('Đã đăng xuất phiên đó');
    },
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeAccount = useMutation({
    mutationFn: deleteOwnAccount,
    onSuccess: () => {
      logout();
      navigate('/login', { replace: true });
    },
  });

  const sessions = sessionsQuery.data ?? [];
  const isGoogle = account?.authProvider === 'GOOGLE';

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline
        eyebrow="Tài khoản"
        line1="Tài khoản & bảo mật."
        line2={account?.email}
        intro="Sửa tên hiển thị, đổi mật khẩu và xem các thiết bị đang đăng nhập."
      />
      {accountQuery.isError && <Note tone="danger">{errorText(accountQuery.error)}</Note>}

      <section className="space-y-5">
        <SectionHead index="01" title="Thông tin cá nhân" />
        <form
          className="grid gap-6 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile.mutate();
          }}
        >
          <label className="block">
            <span className={fieldLabel}>Họ và tên</span>
            <input required maxLength={255} className={underlineInput} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Ngôn ngữ ưu tiên</span>
            <select className={underlineSelect} value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value as 'vi' | 'en' })}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="block">
            <span className={fieldLabel}>Ảnh đại diện (URL)</span>
            <input type="url" maxLength={2000} className={underlineInput} value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
          </label>
          <label className="block">
            <span className={fieldLabel}>GitHub</span>
            <input type="url" maxLength={255} className={underlineInput} value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." />
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-6">
            <button type="submit" className={primaryButton} disabled={saveProfile.isPending || !account}>
              {saveProfile.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            {saveProfile.isError && <span className="text-sm text-danger">{errorText(saveProfile.error)}</span>}
          </div>
        </form>
        {account && (
          <dl>
            <InfoRow label="Vai trò">{account.role}</InfoRow>
            <InfoRow label="Đăng nhập bằng">{isGoogle ? 'Google' : 'Email & mật khẩu'}</InfoRow>
            <InfoRow label="Tạo lúc">{account.createdAt || '—'}</InfoRow>
            <InfoRow label="Đăng nhập gần nhất">{account.lastLoginAt || '—'}</InfoRow>
          </dl>
        )}
      </section>

      <section className="space-y-5">
        <SectionHead index="02" title="Đổi mật khẩu" />
        {isGoogle ? (
          <Note>Tài khoản đăng nhập bằng Google nên không có mật khẩu riêng.</Note>
        ) : (
          <form className="grid max-w-3xl gap-6 md:grid-cols-3" onSubmit={submitPassword}>
            <label className="block">
              <span className={fieldLabel}>Mật khẩu hiện tại</span>
              <input type="password" required autoComplete="current-password" className={underlineInput} value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Mật khẩu mới</span>
              <input type="password" required minLength={10} maxLength={72} autoComplete="new-password" className={underlineInput} value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Nhập lại mật khẩu mới</span>
              <input type="password" required autoComplete="new-password" className={underlineInput} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            </label>
            <div className="md:col-span-3 flex flex-wrap items-center gap-6">
              <button type="submit" className={outlineButton} disabled={savePassword.isPending}>
                {savePassword.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
              {passwordError && <span className="text-sm text-danger">{passwordError}</span>}
            </div>
          </form>
        )}
      </section>

      <section className="space-y-5">
        <SectionHead index="03" title="Phiên đăng nhập" meta={`${sessions.length} phiên còn hiệu lực`} />
        {sessions.length === 0 ? (
          <EmptyRow>{sessionsQuery.isLoading ? 'Đang tải...' : 'Không có phiên nào.'}</EmptyRow>
        ) : (
          <ul>
            {sessions.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border py-3.5">
                <span className="text-[15px] text-ink">
                  Phiên {i + 1}
                  <span className="ml-3 text-[13px] text-slate-500">
                    Bắt đầu {s.createdAt} · hết hạn {s.expiresAt}
                  </span>
                </span>
                <button type="button" className={brandLink} disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                  Đăng xuất phiên này
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-5">
        <SectionHead index="04" title="Xoá tài khoản" />
        <Note tone="danger">Tài khoản bị khoá đăng nhập và ẩn khỏi hệ thống. Bạn cần liên hệ admin nếu muốn khôi phục.</Note>
        <button type="button" className={dangerLink} onClick={() => setConfirmDelete(true)}>
          Xoá tài khoản của tôi
        </button>
      </section>

      {confirmDelete && (
        <Modal
          title="Xoá tài khoản?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <button type="button" className={outlineButton} onClick={() => setConfirmDelete(false)}>
                Huỷ
              </button>
              <button type="button" className={dangerButton} disabled={removeAccount.isPending} onClick={() => removeAccount.mutate()}>
                {removeAccount.isPending ? 'Đang xoá...' : 'Xoá tài khoản'}
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">Sau khi xoá, bạn sẽ bị đăng xuất khỏi mọi thiết bị.</p>
          {removeAccount.isError && <p className="mt-3 text-sm text-danger">{errorText(removeAccount.error)}</p>}
        </Modal>
      )}
      <Toast message={toast} />
    </div>
  );
}
