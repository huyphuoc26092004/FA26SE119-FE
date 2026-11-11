import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import OperationalTable, { operationalDate, OperationalPagination } from '../../components/admin/OperationalTable';
import { getManagerCrawlReports } from '../../services/managerService';

export default function ManagerCrawlReportsPage() {
  const [offset, setOffset] = useState(0);
  const query = useQuery({ queryKey: ['manager-crawl-reports', offset], queryFn: () => getManagerCrawlReports(offset), refetchInterval: 30_000 });
  return <main className="space-y-6"><h1 className="text-3xl font-medium">Báo cáo thu thập việc làm</h1><Link to="/manager/jobs" className="text-brand underline">Quản lý và thu thập việc làm</Link>
    <p className="text-sm text-slate-600">Theo dõi các lần chạy gần nhất, số tin thu được và lỗi xử lý.</p>
    {query.isPending && <p>Đang tải báo cáo…</p>}{query.error && <p role="alert" className="text-danger">{query.error.message}</p>}
    {query.data && <OperationalTable rows={query.data} columns={[{ key: 'source_site', label: 'Nguồn' }, { key: 'keyword', label: 'Từ khóa' }, { key: 'status', label: 'Trạng thái' }, { key: 'candidate_urls_discovered', label: 'URL tìm thấy' }, { key: 'parsed_jobs', label: 'Đã phân tích' }, { key: 'imported_jobs', label: 'Tin đã nhập' }, { key: 'skipped_duplicates', label: 'Trùng đã bỏ qua' }, { key: 'rejected_pages', label: 'Trang bị loại' }, { key: 'started_at', label: 'Bắt đầu', render: (row) => operationalDate(row.started_at) }, { key: 'finished_at', label: 'Kết thúc', render: (row) => operationalDate(row.finished_at) }]} />}
    <OperationalPagination offset={offset} count={query.data?.length ?? 0} busy={query.isFetching} onChange={setOffset} />
  </main>;
}
