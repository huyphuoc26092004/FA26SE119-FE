import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { EmptyRow, Headline, Note, SectionHead, UnderlineTabs, brandLink } from '../../components/admin/AdminKit';
import {
  type UserNotification,
  getAnnouncements,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';

type Filter = 'all' | 'unread';

/** Trang mở ra khi bấm vào thông báo; null nếu thông báo không gắn với màn nào. */
function notificationLink(area: string, n: UserNotification): string | null {
  if (n.referenceType !== 'CONSULTATION' || !n.referenceId) return null;
  if (area === 'admin') return '/admin?tab=consultations';
  if (area === 'candidate' || area === 'consultant') return `/${area}/consultations/${n.referenceId}`;
  return null;
}

/** /{role}/inbox — thông báo cá nhân và thông báo hệ thống đang hiệu lực. */
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const area = useLocation().pathname.split('/')[1] ?? '';
  const [filter, setFilter] = useState<Filter>('all');
  const notificationsQuery = useQuery({ queryKey: ['notifications', filter], queryFn: () => getNotifications(filter === 'unread') });
  const announcementsQuery = useQuery({ queryKey: ['announcements'], queryFn: getAnnouncements });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });

  const list = notificationsQuery.data ?? [];
  const unread = list.filter((n) => !n.isRead).length;
  const announcements = announcementsQuery.data ?? [];

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline eyebrow="Hộp thư" line1="Thông báo." line2={unread ? `${unread} chưa đọc` : 'Đã đọc hết'} />

      {announcements.length > 0 && (
        <section className="space-y-4">
          <SectionHead index="01" title="Thông báo từ hệ thống" />
          <ul>
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-border py-4">
                <p className="text-[15px] font-medium text-ink">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-7 text-slate-700">{a.content}</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  {a.publishAt || a.createdAt}
                  {a.expiresAt && ` · hết hạn ${a.expiresAt}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <SectionHead
          index={announcements.length ? '02' : '01'}
          title="Thông báo của bạn"
          action={
            <button type="button" className={brandLink} disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}>
              Đánh dấu đã đọc tất cả
            </button>
          }
        />
        <UnderlineTabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'Tất cả' },
            { value: 'unread', label: 'Chưa đọc' },
          ]}
        />
        {notificationsQuery.isError && <Note tone="danger">Không tải được thông báo.</Note>}
        {list.length === 0 ? (
          <EmptyRow>{notificationsQuery.isLoading ? 'Đang tải...' : 'Chưa có thông báo nào.'}</EmptyRow>
        ) : (
          <ul>
            {list.map((n) => {
              const link = notificationLink(area, n);
              return (
                <li key={n.id} className="flex items-start justify-between gap-6 border-b border-border py-4">
                  <div className="min-w-0">
                    <p className={`text-[15px] ${n.isRead ? 'text-slate-700' : 'font-medium text-ink'}`}>
                      {!n.isRead && <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full bg-brand" />}
                      {link ? (
                        <Link to={link} className="hover:text-brand hover:underline" onClick={() => !n.isRead && markOne.mutate(n.id)}>
                          {n.title || n.type}
                        </Link>
                      ) : (
                        n.title || n.type
                      )}
                    </p>
                    {n.content && <p className="mt-1 whitespace-pre-line text-[14px] leading-6 text-slate-600">{n.content}</p>}
                    <p className="mt-1 text-[12px] text-slate-500">{n.createdAt}</p>
                  </div>
                  {!n.isRead && (
                    <button type="button" className={`${brandLink} shrink-0`} onClick={() => markOne.mutate(n.id)}>
                      Đã đọc
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
