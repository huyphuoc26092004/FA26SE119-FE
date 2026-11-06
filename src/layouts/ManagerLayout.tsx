import { DashboardLayout } from './DashboardLayout';
import { managerNav } from '../constants/navigation';

export default function ManagerLayout() {
  return <DashboardLayout area="Manager" nav={managerNav} />;
}
