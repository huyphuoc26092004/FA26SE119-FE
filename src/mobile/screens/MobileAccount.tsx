import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CircleCheck,
  CircleDot,
  CreditCard,
  Languages,
  LifeBuoy,
  LogOut,
  Mail,
  UserRound,
} from 'lucide-react';
import { getCandidateProfile } from '../../mocks/services/mockService';
import { getUserSubscription } from '../../services/subscriptionService';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../i18n';
import { Bar, Card, ListGroup, ListRow, Screen, SectionTitle } from '../MobileKit';

const copy = {
  vi: {
    complete: (p: number) => `Hồ sơ hoàn thiện ${p}%`,
    tokens: 'Token còn lại',
    topUp: 'Nạp thêm',
    plan: 'Gói',
    tools: 'Công cụ',
    account: 'Tài khoản',
    settings: 'Cài đặt',
    rows: {
      profile: ['Hồ sơ nghề nghiệp', 'Thông tin, mục tiêu, kỹ năng'],
      fit: ['Độ phù hợp CV', 'So CV với một việc làm'],
      letter: ['Hỗ trợ ứng tuyển', 'Thư xin việc, email'],
      assessment: ['Đánh giá kỹ năng', 'Bài test theo JD'],
      plans: ['Gói đăng ký & token', ''],
      usage: ['Mức sử dụng AI', ''],
      support: ['Hỗ trợ', 'Gửi phiếu, xem tiến độ'],
    },
    language: 'Ngôn ngữ',
    languageValue: 'Tiếng Việt',
    signOut: 'Đăng xuất',
  },
  en: {
    complete: (p: number) => `Profile ${p}% complete`,
    tokens: 'Tokens left',
    topUp: 'Top up',
    plan: 'Plan',
    tools: 'Tools',
    account: 'Account',
    settings: 'Settings',
    rows: {
      profile: ['Career profile', 'Info, goals, skills'],
      fit: ['CV fit', 'Compare a CV with a job'],
      letter: ['Application help', 'Cover letters, emails'],
      assessment: ['Skill assessment', 'Tests built from JDs'],
      plans: ['Plans & tokens', ''],
      usage: ['AI usage', ''],
      support: ['Support', 'Tickets and progress'],
    },
    language: 'Language',
    languageValue: 'English',
    signOut: 'Sign out',
  },
};

export default function MobileAccount() {
  const { isVietnamese, toggleLanguage } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getCandidateProfile });
  const subscription = useMemo(() => getUserSubscription(), []);

  const name = profile?.name ?? user?.name ?? '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  const completion = profile?.completion ?? 85;
  const left = Math.max(0, subscription.tokenLimit - subscription.tokensUsed);
  const num = (v: number) => v.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US');

  return (
    <Screen>
      <Card to="/candidate/profile">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-night text-[20px] font-medium text-white">
            {initials || 'U'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[19px] font-medium text-ink">{name}</p>
            <p className="truncate text-[13px] text-slate-600">
              {profile?.headline ?? user?.email}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Bar value={completion} />
          <p className="mt-1.5 text-[12px] text-slate-600">{c.complete(completion)}</p>
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] text-slate-600">
            {c.tokens} · {c.plan} {subscription.planName}
          </p>
          <Link to="/candidate/subscription" className="text-[14px] text-brand">
            {c.topUp}
          </Link>
        </div>
        <p className="mt-1 text-[26px] font-medium tabular-nums text-ink">
          {num(left)}
          <span className="text-[14px] font-normal text-slate-500">
            {' '}
            / {num(subscription.tokenLimit)}
          </span>
        </p>
        <div className="mt-2">
          <Bar value={subscription.tokenLimit ? (left / subscription.tokenLimit) * 100 : 0} />
        </div>
      </Card>

      <SectionTitle title={c.tools} />
      <ListGroup>
        <ListRow
          to="/candidate/profile"
          icon={<UserRound size={18} />}
          title={c.rows.profile[0]}
          detail={c.rows.profile[1]}
        />
        <ListRow
          to="/candidate/cv-job-fit"
          icon={<CircleDot size={18} />}
          title={c.rows.fit[0]}
          detail={c.rows.fit[1]}
        />
        <ListRow
          to="/candidate/applications"
          icon={<Mail size={18} />}
          title={c.rows.letter[0]}
          detail={c.rows.letter[1]}
        />
        <ListRow
          to="/candidate/assessment"
          icon={<CircleCheck size={18} />}
          title={c.rows.assessment[0]}
          detail={c.rows.assessment[1]}
        />
      </ListGroup>

      <SectionTitle title={c.account} />
      <ListGroup>
        <ListRow
          to="/candidate/subscription"
          icon={<CreditCard size={18} />}
          title={c.rows.plans[0]}
        />
        <ListRow to="/candidate/usage" icon={<Activity size={18} />} title={c.rows.usage[0]} />
        <ListRow
          to="/candidate/support"
          icon={<LifeBuoy size={18} />}
          title={c.rows.support[0]}
          detail={c.rows.support[1]}
        />
      </ListGroup>

      <SectionTitle title={c.settings} />
      <ListGroup>
        <ListRow
          onClick={toggleLanguage}
          icon={<Languages size={18} />}
          title={c.language}
          detail={c.languageValue}
        />
        <ListRow
          danger
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          icon={<LogOut size={18} />}
          title={c.signOut}
        />
      </ListGroup>
      <p className="pb-2 text-center text-[12px] text-slate-400">CCV · FA26SE119</p>
    </Screen>
  );
}
