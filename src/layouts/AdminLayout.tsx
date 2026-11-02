import { DashboardLayout } from './DashboardLayout';
import { adminNav } from '../constants/navigation';
import { useAutoIndexScheduler } from '../services/autoIndexSchedule';

export default function AdminLayout() {
  // Lập chỉ mục việc làm tự động theo giờ đã đặt ở Thu thập việc làm › Kho việc làm.
  useAutoIndexScheduler();
  return <DashboardLayout area="Admin" nav={adminNav} />;
}
