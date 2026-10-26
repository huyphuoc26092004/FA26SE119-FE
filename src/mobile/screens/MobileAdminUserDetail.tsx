import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import UserDetailsPage from '../../pages/admin/UserDetailsPage';
import { getUserById, toggleLockUser } from '../../services/userService';
import { useTranslation } from '../../i18n';
import {
  ActionBar,
  Avatar,
  Bar,
  BigButton,
  Card,
  Empty,
  InfoRow,
  PillLink,
  Screen,
  SectionTitle,
  Sheet,
  Skeleton,
  Tag,
  useToast,
} from '../MobileKit';
import { accountStatusLabel, accountStatusTone, roleLabel } from './MobileAdminUsers';

const copy = {
  vi: {
    notFound: 'Không tìm thấy người dùng.',
    edit: 'Chỉnh sửa, phân quyền',
    verified: 'Đã xác minh',
    info: 'Thông tin',
    phone: 'Điện thoại',
    location: 'Địa điểm',
    created: 'Ngày tạo',
    lastActive: 'Hoạt động gần nhất',
    plan: 'Gói',
    tokens: 'Token tháng này',
    suspendedReason: 'Lý do khoá',
    activity: 'Hoạt động gần đây',
    noActivity: 'Chưa có hoạt động.',
    lock: 'Khoá tài khoản',
    unlock: 'Mở khoá tài khoản',
    lockTitle: 'Khoá tài khoản này?',
    lockBody: 'Người dùng sẽ không đăng nhập được cho đến khi được mở khoá.',
    unlockTitle: 'Mở khoá tài khoản?',
    unlockBody: 'Người dùng sẽ đăng nhập và dùng CCV bình thường trở lại.',
    reason: 'Lý do (không bắt buộc)',
    back: 'Để sau',
    locked: 'Đã khoá tài khoản',
    unlocked: 'Đã mở khoá tài khoản',
  },
  en: {
    notFound: 'User not found.',
    edit: 'Edit, roles',
    verified: 'Verified',
    info: 'Details',
    phone: 'Phone',
    location: 'Location',
    created: 'Created',
    lastActive: 'Last active',
    plan: 'Plan',
    tokens: 'Tokens this month',
    suspendedReason: 'Suspension reason',
    activity: 'Recent activity',
    noActivity: 'No activity yet.',
    lock: 'Suspend account',
    unlock: 'Reactivate account',
    lockTitle: 'Suspend this account?',
    lockBody: 'The user cannot sign in until the account is reactivated.',
    unlockTitle: 'Reactivate this account?',
    unlockBody: 'The user can sign in and use CCV again.',
    reason: 'Reason (optional)',
    back: 'Not now',
    locked: 'Account suspended',
    unlocked: 'Account reactivated',
  },
};

/** `?view=full` opens the full web page (edit form, roles, password reset) inside the app. */
export default function MobileAdminUserDetail() {
  const [params] = useSearchParams();
  return params.get('view') === 'full' ? <UserDetailsPage /> : <DetailScreen />;
}

function DetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const num = (v: number) => v.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-managed-user', id],
    queryFn: () => getUserById(id || ''),
    enabled: !!id,
  });

  const lockMutation = useMutation({
    mutationFn: ({ status, why }: { status: 'ACTIVE' | 'SUSPENDED'; why?: string }) =>
      toggleLockUser(id!, status, why),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-managed-user', id], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      setSheetOpen(false);
      setReason('');
      toast.show(updated.status === 'SUSPENDED' ? c.locked : c.unlocked);
    },
    onError: (err: Error) => toast.show(err.message),
  });

  if (isLoading) {
    return (
      <Screen>
        <Skeleton />
      </Screen>
    );
  }
  if (!user) {
    return (
      <Screen>
        <Empty title={c.notFound} />
      </Screen>
    );
  }

  const suspended = user.status === 'SUSPENDED';

  return (
    <Screen>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={56} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-medium text-ink">{user.name}</p>
            <p className="truncate text-[13px] text-slate-600">{user.email}</p>
            {user.headline && (
              <p className="truncate text-[13px] text-slate-500">{user.headline}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag>{roleLabel[lang][user.role]}</Tag>
          <Tag tone={accountStatusTone[user.status]}>{accountStatusLabel[lang][user.status]}</Tag>
          {user.isVerified && <Tag tone="brand">{c.verified}</Tag>}
        </div>
        <div className="mt-3">
          <PillLink to={`/admin/users/${user.id}?view=full`}>{c.edit}</PillLink>
        </div>
      </Card>

      {suspended && user.suspendedReason && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-[12px] text-danger">{c.suspendedReason}</p>
          <p className="mt-0.5 text-[14px] leading-6 text-ink">{user.suspendedReason}</p>
        </Card>
      )}

      <Card>
        <p className="text-[15px] font-medium text-ink">{c.info}</p>
        <div className="mt-1 divide-y divide-border">
          {user.phone && <InfoRow label={c.phone}>{user.phone}</InfoRow>}
          {user.location && <InfoRow label={c.location}>{user.location}</InfoRow>}
          <InfoRow label={c.plan}>{user.planName}</InfoRow>
          <InfoRow label={c.created}>{user.createdAt}</InfoRow>
          <InfoRow label={c.lastActive}>{user.lastActiveAt}</InfoRow>
        </div>
        {user.tokenMonthlyQuota > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <div className="mb-1 flex justify-between text-[13px]">
              <span className="text-slate-600">{c.tokens}</span>
              <span className="tabular-nums text-ink">
                {num(user.tokensUsedThisMonth)} / {num(user.tokenMonthlyQuota)}
              </span>
            </div>
            <Bar value={(user.tokensUsedThisMonth / user.tokenMonthlyQuota) * 100} />
          </div>
        )}
      </Card>

      <SectionTitle title={c.activity} />
      <Card>
        {user.recentActivities.length === 0 ? (
          <p className="text-[14px] text-slate-500">{c.noActivity}</p>
        ) : (
          <ol className="space-y-4">
            {user.recentActivities.map((a) => (
              <li key={a.id} className="relative pl-5">
                <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-brand" />
                <p className="text-[14px] text-ink">{a.action}</p>
                <p className="text-[13px] leading-5 text-slate-600">{a.details}</p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  {a.timestamp} · {a.ipAddress}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <ActionBar>
        <BigButton tone={suspended ? 'primary' : 'danger'} onClick={() => setSheetOpen(true)}>
          {suspended ? c.unlock : c.lock}
        </BigButton>
      </ActionBar>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <p className="text-[18px] font-medium text-ink">
          {suspended ? c.unlockTitle : c.lockTitle}
        </p>
        <p className="mt-1 text-[14px] leading-6 text-slate-600">
          {suspended ? c.unlockBody : c.lockBody}
        </p>
        {!suspended && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={c.reason}
            rows={3}
            className="mt-4 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink"
          />
        )}
        <div className="mt-5 space-y-2.5">
          <BigButton
            tone={suspended ? 'primary' : 'danger'}
            disabled={lockMutation.isPending}
            onClick={() =>
              lockMutation.mutate(
                suspended
                  ? { status: 'ACTIVE' }
                  : { status: 'SUSPENDED', why: reason.trim() || undefined },
              )
            }
          >
            {suspended ? c.unlock : c.lock}
          </BigButton>
          <BigButton tone="secondary" onClick={() => setSheetOpen(false)}>
            {c.back}
          </BigButton>
        </div>
      </Sheet>
      {toast.node}
    </Screen>
  );
}
