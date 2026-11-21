import { DashboardLayout } from './DashboardLayout';
import { staffNav } from '../constants/navigation';

export default function StaffLayout() {
  return <DashboardLayout area="Staff" nav={staffNav} />;
}
