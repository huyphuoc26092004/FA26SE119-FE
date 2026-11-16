import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { EmptyRow, Note, SectionHead, brandLink, underlineInput } from '../../components/admin/AdminKit';

interface Resource {
  id: string;
  title: string;
  url: string;
  provider: string;
  resource_type: string;
  language: string;
  is_free: boolean;
  is_active: boolean;
}

export function LearningResourcesTab() {
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'learning-resources'],
    queryFn: async () => (await apiClient.get<Resource[]>('/admin/rag/resources')).data,
  });
  const toggle = useMutation({
    mutationFn: (resource: Resource) => apiClient.post(`/admin/rag/resources/${resource.id}/${resource.is_active ? 'disable' : 'enable'}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'learning-resources'] }),
  });
  const resources = query.data ?? [];
  const needle = search.trim().toLocaleLowerCase('vi');
  const filtered = resources.filter((r) => `${r.title} ${r.provider} ${r.url}`.toLocaleLowerCase('vi').includes(needle));
  return (
    <section className="space-y-4">
      <SectionHead index="03" title="Tài nguyên học" meta={`${resources.length} tài nguyên`} />
      <p className="text-sm text-slate-500">Các đường dẫn tham khảo cho lộ trình học. Tắt tài nguyên để ngừng đề xuất cho ứng viên.</p>
      <input aria-label="Tìm tài nguyên học" className={underlineInput} placeholder="Tìm theo tên, nhà cung cấp hoặc đường dẫn..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {query.isError && <Note tone="danger">Không tải được tài nguyên học. Vui lòng thử lại.</Note>}
      {toggle.isError && <Note tone="danger">Không cập nhật được trạng thái. Vui lòng thử lại.</Note>}
      {query.isLoading ? <EmptyRow>Đang tải...</EmptyRow> : !query.isError && filtered.length === 0 ? <EmptyRow>{search ? 'Không tìm thấy tài nguyên phù hợp.' : 'Chưa có tài nguyên học.'}</EmptyRow> : (
        <ul>
          {filtered.map((r) => (
            <li key={r.id} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_9rem_auto] md:items-baseline md:gap-6">
              <span className="min-w-0">
                <a href={/^https?:\/\//i.test(r.url) ? r.url : undefined} target="_blank" rel="noopener noreferrer" className="block truncate text-[15px] text-ink hover:text-brand">{r.title}</a>
                <span className="block break-all text-xs text-slate-500">{r.url}</span>
                <span className="text-xs text-slate-500">{r.provider} · {r.resource_type === 'ROADMAP' ? 'Lộ trình tham khảo' : r.resource_type} · {r.language} · {r.is_free ? 'Miễn phí' : 'Trả phí'}</span>
              </span>
              <span className={`text-sm ${r.is_active ? 'text-brand' : 'text-slate-500'}`}>{r.is_active ? 'Đang sử dụng' : 'Đã tắt'}</span>
              <button type="button" className={brandLink} disabled={toggle.isPending} onClick={() => toggle.mutate(r)}>{r.is_active ? 'Tắt sử dụng' : 'Bật sử dụng'}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
