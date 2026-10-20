import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Users,
  Wallet,
  Server,
  Cpu,
  HardDrive,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Zap,
  Clock,
  Download,
  Trash2,
  Lock,
  Unlock,
  Eye,
  X,
  CreditCard,
  Layers,
  Sparkles,
  BarChart3,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Card, PageTitle, StatCard, Badge, Button, Loading, ErrorState } from '../../components/ui';
import {
  getAdminDashboardData,
  toggleMaintenanceMode,
  purgeSystemCache,
  toggleUserStatus,
} from '../../services/adminService';
import type { AdminDashboardData } from '../../types/admin';
import type { UserRole } from '../../types/domain';
import { useTranslation } from '../../i18n';

export default function AdminDashboardPage() {
  const { t, isVietnamese } = useTranslation();
  const queryClient = useQueryClient();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'system' | 'ai' | 'revenue' | 'users'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User table search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminDashboardData['userMetrics']['userList'][0] | null>(null);

  // Selected Transaction Receipt Modal
  const [selectedTx, setSelectedTx] = useState<AdminDashboardData['revenueMetrics']['recentTransactions'][0] | null>(null);

  // Maintenance Confirmation Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: dashboardData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-dashboard', timeRange],
    queryFn: () => getAdminDashboardData(timeRange),
  });

  // Maintenance mutation
  const maintenanceMutation = useMutation({
    mutationFn: (enable: boolean) => toggleMaintenanceMode(enable),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowMaintenanceModal(false);
      showToast(res.message);
    },
  });

  // Purge cache mutation
  const purgeCacheMutation = useMutation({
    mutationFn: () => purgeSystemCache(),
    onSuccess: (res) => {
      showToast(
        isVietnamese
          ? `Đã xóa sạch ${res.clearedKeysCount} khóa bộ nhớ đệm (Giải phóng ${res.freedMemoryMB} MB RAM)!`
          : `Purged ${res.clearedKeysCount} cache keys (Freed ${res.freedMemoryMB} MB RAM)!`
      );
    },
  });

  // Toggle user status
  const userStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      toggleUserStatus(userId, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      showToast(
        isVietnamese
          ? `Cập nhật trạng thái người dùng #${res.userId} thành ${res.status} thành công!`
          : `Updated user #${res.userId} status to ${res.status}!`
      );
      if (selectedUser && selectedUser.id === res.userId) {
        setSelectedUser({ ...selectedUser, status: res.status });
      }
    },
  });

  if (isLoading) return <Loading />;
  if (isError || !dashboardData) return <ErrorState />;

  const { systemHealth, aiMetrics, revenueMetrics, userMetrics } = dashboardData;

  // Filtered users
  const filteredUsers = userMetrics.userList.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSearch =
      !userSearch.trim() ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.planName.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Export report as CSV
  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `BÁO CÁO TỔNG QUAN QUẢN TRỊ HỆ THỐNG - CAREERPILOT\n` +
          `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n` +
          `Khung thời gian: ${timeRange}\n\n` +
          `1. HẠ TẦNG KỸ THUẬT\n` +
          `Trạng thái: ${systemHealth.overallStatus}\n` +
          `Uptime: ${systemHealth.uptimePercentage}%\n` +
          `CPU: ${systemHealth.resources.cpuUsagePercent}%\n` +
          `RAM: ${systemHealth.resources.memoryUsedGB}GB / ${systemHealth.resources.memoryTotalGB}GB\n\n` +
          `2. SỬ DỤNG AI\n` +
          `Tổng yêu cầu: ${aiMetrics.totalRequests}\n` +
          `Tổng tokens: ${aiMetrics.totalTokens}\n` +
          `Chi phí ước tính USD: $${aiMetrics.totalCostUSD}\n` +
          `Chi phí ước tính VND: ${aiMetrics.totalCostVND.toLocaleString()} đ\n\n` +
          `3. DOANH THU & GÓI CƯỚC\n` +
          `Tổng doanh thu: ${revenueMetrics.totalRevenueVND.toLocaleString()} đ\n` +
          `MRR: ${revenueMetrics.mrrVND.toLocaleString()} đ\n` +
          `Khách hàng trả phí: ${revenueMetrics.paidSubscribersCount}\n\n` +
          `4. NGƯỜI DÙNG\n` +
          `Tổng tài khoản: ${userMetrics.totalUsers}\n` +
          `Ứng viên: ${userMetrics.candidateCount}\n` +
          `Cố vấn: ${userMetrics.consultantCount}\n` +
          `Quản trị viên: ${userMetrics.adminCount}\n`
      );

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `careerpilot-admin-report-${timeRange}-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(isVietnamese ? 'Đã tải xuống file báo cáo quản trị CSV!' : 'Downloaded admin CSV report!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / System Page Title */}
      <PageTitle
        title={isVietnamese ? 'Bảng Điều Khiển Quản Trị Hệ Thống' : 'System Administration Dashboard'}
        subtitle={
          isVietnamese
            ? 'Giám sát vận hành toàn diện: Hạ tầng kỹ thuật, Mức sử dụng AI, Doanh thu thanh toán và Tăng trưởng người dùng.'
            : 'Comprehensive real-time telemetry: Infrastructure health, AI engine usage, Revenue financials, and User growth.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time range selector */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {(['24h', '7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                    timeRange === range ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range === '24h' ? '24 Giờ' : range === '7d' ? '7 Ngày' : range === '30d' ? '30 Ngày' : '90 Ngày'}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin text-blue-600' : ''} />
              <span>{isVietnamese ? 'Làm mới' : 'Refresh'}</span>
            </button>

            {/* Purge Cache */}
            <button
              onClick={() => purgeCacheMutation.mutate()}
              disabled={purgeCacheMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Xóa bộ nhớ đệm cache"
            >
              <Trash2 size={14} className="text-amber-500" />
              <span>{isVietnamese ? 'Xóa Cache' : 'Purge Cache'}</span>
            </button>

            {/* Export Report */}
            <Button variant="secondary" onClick={handleExportReport} className="text-xs py-2 px-3 gap-1.5">
              <Download size={14} />
              <span>{isVietnamese ? 'Xuất Báo Cáo' : 'Export Report'}</span>
            </Button>

            {/* Maintenance Mode Toggle Button */}
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                systemHealth.overallStatus === 'MAINTENANCE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Radio size={14} className={systemHealth.overallStatus === 'MAINTENANCE' ? 'animate-pulse' : ''} />
              <span>
                {systemHealth.overallStatus === 'MAINTENANCE'
                  ? isVietnamese
                    ? 'Đang Bảo Trì'
                    : 'Maintenance Active'
                  : isVietnamese
                  ? 'Chế Độ Bảo Trì'
                  : 'Maintenance Mode'}
              </span>
            </button>
          </div>
        }
      />

      {/* Hero System Status Alert Banner */}
      <Card
        className={`border p-4 transition-all ${
          systemHealth.overallStatus === 'OPERATIONAL'
            ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/40'
            : 'border-amber-300 bg-amber-50'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${
                systemHealth.overallStatus === 'OPERATIONAL' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            >
              <Server size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {systemHealth.overallStatus === 'OPERATIONAL'
                    ? isVietnamese
                      ? 'Nền tảng vận hành bình thường (All Systems Operational)'
                      : 'All Systems Operational'
                    : isVietnamese
                    ? 'Hệ thống đang trong chế độ bảo trì kỹ thuật'
                    : 'System is in Scheduled Maintenance Mode'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    systemHealth.overallStatus === 'OPERATIONAL'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {systemHealth.uptimePercentage}% Uptime
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isVietnamese
                  ? `Hoạt động liên tục ${systemHealth.uptimeDays} ngày · 6 microservices khỏe mạnh · Lần cập nhật cuối: ${dashboardData.lastUpdated}`
                  : `Running continuously for ${systemHealth.uptimeDays} days · 6 healthy microservices · Last telemetry: ${dashboardData.lastUpdated}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0 font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <Cpu size={14} className="text-blue-500" /> CPU: <strong>{systemHealth.resources.cpuUsagePercent}%</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <HardDrive size={14} className="text-purple-500" /> RAM: <strong>{systemHealth.resources.memoryUsedGB}GB</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Radio size={14} className="text-emerald-500" /> Sockets: <strong>{systemHealth.resources.activeWebsockets}</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* 4 Pillars Executive KPI StatCards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: System & Uptime */}
        <div
          onClick={() => setActiveTab('system')}
          className="cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            label={isVietnamese ? 'Hạ Tầng & Sức Khỏe' : 'System Infrastructure'}
            value={`${systemHealth.uptimePercentage}%`}
            detail={isVietnamese ? '6/6 Microservices trực tuyến' : '6/6 Microservices Online'}
            icon={<Server size={20} className="text-emerald-600" />}
          />
        </div>

        {/* Metric 2: AI Telemetry */}
        <div
          onClick={() => setActiveTab('ai')}
          className="cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            label={isVietnamese ? 'Mức Sử Dụng AI (Tokens)' : 'AI Token Telemetry'}
            value={`${(aiMetrics.totalTokens / 1000000).toFixed(1)}M`}
            detail={
              isVietnamese
                ? `${aiMetrics.totalRequests.toLocaleString()} lượt · $${aiMetrics.totalCostUSD} USD`
                : `${aiMetrics.totalRequests.toLocaleString()} reqs · $${aiMetrics.totalCostUSD} USD`
            }
            icon={<Zap size={20} className="text-amber-500" />}
          />
        </div>

        {/* Metric 3: Revenue & Financials */}
        <div
          onClick={() => setActiveTab('revenue')}
          className="cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            label={isVietnamese ? 'Tổng Doanh Thu (VND)' : 'Total Gross Revenue'}
            value={`${(revenueMetrics.totalRevenueVND / 1000000).toFixed(1)}M đ`}
            detail={
              isVietnamese
                ? `+${revenueMetrics.growthPercentMoM}% MoM · ${revenueMetrics.paidSubscribersCount} gói trả phí`
                : `+${revenueMetrics.growthPercentMoM}% MoM · ${revenueMetrics.paidSubscribersCount} paid subs`
            }
            icon={<Wallet size={20} className="text-blue-600" />}
          />
        </div>

        {/* Metric 4: Total Users */}
        <div
          onClick={() => setActiveTab('users')}
          className="cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            label={isVietnamese ? 'Tổng Người Dùng' : 'Total Registered Users'}
            value={userMetrics.totalUsers.toLocaleString()}
            detail={
              isVietnamese
                ? `+${userMetrics.newUsersThisMonth} mới tháng này · DAU: ${userMetrics.dau}`
                : `+${userMetrics.newUsersThisMonth} new this month · DAU: ${userMetrics.dau}`
            }
            icon={<Users size={20} className="text-indigo-600" />}
          />
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={16} />
          <span>{isVietnamese ? 'Tổng Quan Báo Cáo' : 'Executive Overview'}</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'system'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server size={16} />
          <span>{isVietnamese ? 'Hạ Tầng Kỹ Thuật' : 'System & Services'}</span>
          <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
            {systemHealth.uptimePercentage}%
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap size={16} className="text-amber-500" />
          <span>{isVietnamese ? 'Sử Dụng AI & Tokens' : 'AI Telemetry'}</span>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
            {aiMetrics.totalRequests.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'revenue'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={16} />
          <span>{isVietnamese ? 'Doanh Thu & Gói Cước' : 'Revenue & Subscriptions'}</span>
          <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
            {revenueMetrics.paidSubscribersCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          <span>{isVietnamese ? 'Người Dùng & Hoạt Động' : 'Users & Demographics'}</span>
          <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
            {userMetrics.totalUsers}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW (ALL-IN-ONE COMPACT SNAPSHOT)                   */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 2-Column: AI Token Trend Chart & Revenue Summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Daily Request & Token Bar Chart */}
            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {isVietnamese ? 'Xu Hướng Sử Dụng AI (7 Ngày Gần Nhất)' : 'AI Daily Usage Trend'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isVietnamese ? 'Lượng tokens tiêu thụ và chi phí API ước tính' : 'Token volume & estimated API cost'}
                    </p>
                  </div>
                </div>
                <Badge tone="amber">
                  ${aiMetrics.totalCostUSD} USD · {isVietnamese ? 'Đã tối ưu' : 'Optimized'}
                </Badge>
              </div>

              {/* Simple Visual SVG / HTML Bar Chart */}
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-2 h-44 pt-6 px-2">
                  {aiMetrics.dailyTrend.map((point) => {
                    const maxTokens = 2000000;
                    const heightPercent = Math.min(100, Math.round((point.totalTokens / maxTokens) * 100));
                    return (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 transition">
                          {(point.totalTokens / 1000000).toFixed(1)}M
                        </span>
                        <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-32 relative">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 via-indigo-600 to-amber-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">{point.date}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">{isVietnamese ? 'Tokens Trung Bình / Ngày' : 'Daily Avg Tokens'}</span>
                    <strong className="text-slate-800">1.52M</strong>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">{isVietnamese ? 'Thời Gian Phản Hồi TB' : 'Avg Latency'}</span>
                    <strong className="text-emerald-700">{aiMetrics.avgLatencyMs} ms</strong>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <span className="text-slate-400 block text-[11px]">{isVietnamese ? 'Tỉ Lệ Trúng Cache' : 'Cache Hit Ratio'}</span>
                    <strong className="text-blue-700">{aiMetrics.cacheHitRatioPercent}%</strong>
                  </div>
                </div>
              </div>
            </Card>

            {/* Revenue Trend & Plan Distribution */}
            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {isVietnamese ? 'Doanh Thu Theo Gói Đăng Ký' : 'Subscription Revenue Breakdown'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isVietnamese ? 'Phân bổ tỷ trọng và số lượng gói cước' : 'Plan volume and value split'}
                    </p>
                  </div>
                </div>
                <Badge tone="green">{revenueMetrics.totalRevenueVND.toLocaleString()} đ</Badge>
              </div>

              <div className="space-y-4">
                {revenueMetrics.activeSubscriptionsByPlan.map((plan) => (
                  <div key={plan.planId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{plan.planName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">
                          {plan.activeCount.toLocaleString()} {isVietnamese ? 'người dùng' : 'users'}
                        </span>
                        <strong className="text-slate-900 font-bold">
                          {plan.totalRevenueVND > 0 ? `${plan.totalRevenueVND.toLocaleString()} đ` : 'Miễn phí'}
                        </strong>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${plan.color}`}
                        style={{ width: `${Math.max(4, plan.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Gateway Split */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block mb-2">
                    {isVietnamese ? 'Cổng Thanh Toán Chiếm Ưu Thế' : 'Payment Methods Distribution'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    {revenueMetrics.paymentMethodDistribution.map((m) => (
                      <div key={m.method} className="rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <span className="block text-[10px] text-slate-500 truncate">{m.label.split('(')[0]}</span>
                        <span className="font-bold text-slate-800 text-sm">{m.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Overview Bottom Row: Microservices Status & Recent Transactions */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Microservice Quick Grid */}
            <Card>
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Server size={17} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Tình Trạng Microservices Trực Tuyến' : 'Live Microservice Health'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('system')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {isVietnamese ? 'Xem chi tiết →' : 'View details →'}
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {systemHealth.microservices.slice(0, 4).map((svc) => (
                  <div key={svc.key} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="font-bold text-slate-800">{svc.name}</p>
                        <p className="text-[11px] text-slate-400">{svc.details}</p>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {svc.latencyMs} ms
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Audit Log Preview */}
            <Card>
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={17} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Nhật Ký Sự Kiện Hệ Thống Gần Nhất' : 'Recent System Audit Events'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('system')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {isVietnamese ? 'Xem tất cả →' : 'View all logs →'}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {systemHealth.auditLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                            log.severity === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.severity === 'WARN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.severity}
                        </span>
                        <strong className="text-slate-800">{log.action}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.details}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM HEALTH, MICROSERVICES & RESOURCE TELEMETRY                  */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Microservices Full Grid */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server size={18} className="text-emerald-600" />
                  <span>{isVietnamese ? 'Trạng Thái Từng Cụm Microservice' : 'Microservices Health Matrix'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isVietnamese
                    ? 'Giám sát tính sẵn sàng, độ trễ và tỷ lệ lỗi của từng dịch vụ nền tảng'
                    : 'Real-time uptime, response latency, and failover status per service'}
                </p>
              </div>
              <Badge tone="green">6/6 Healthy</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {systemHealth.microservices.map((svc) => (
                <div
                  key={svc.key}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 space-y-2 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 text-sm">{svc.name}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {svc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{svc.details}</p>

                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                    <span className="text-slate-400">
                      Độ trễ: <strong className="text-emerald-700">{svc.latencyMs} ms</strong>
                    </span>
                    <span className="text-slate-400">
                      Uptime: <strong className="text-slate-700">{svc.uptimePercent}%</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Infrastructure Resource Utilization Gauges */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* CPU */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Cpu size={15} className="text-blue-600" />
                  <span>CPU (8 Cores)</span>
                </span>
                <span className="font-black text-sm text-blue-700">{systemHealth.resources.cpuUsagePercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${systemHealth.resources.cpuUsagePercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                Tải hệ thống ở ngưỡng tối ưu, tự động co giãn HPA.
              </span>
            </Card>

            {/* RAM */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <HardDrive size={15} className="text-purple-600" />
                  <span>Bộ Nhớ RAM</span>
                </span>
                <span className="font-black text-sm text-purple-700">
                  {systemHealth.resources.memoryUsedGB} / {systemHealth.resources.memoryTotalGB} GB
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-600"
                  style={{ width: `${systemHealth.resources.memoryUsagePercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                {systemHealth.resources.memoryUsagePercent}% đã sử dụng · 11.2 GB còn trống.
              </span>
            </Card>

            {/* Disk */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Database size={15} className="text-emerald-600" />
                  <span>Lưu Trữ NVMe</span>
                </span>
                <span className="font-black text-sm text-emerald-700">
                  {systemHealth.resources.diskUsedGB} / {systemHealth.resources.diskTotalGB} GB
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${systemHealth.resources.diskUsagePercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                372 GB dung lượng lưu trữ CV PDF và dữ liệu dự phòng.
              </span>
            </Card>

            {/* Database Connections */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Radio size={15} className="text-amber-600" />
                  <span>Database Pool</span>
                </span>
                <span className="font-black text-sm text-amber-700">
                  {systemHealth.resources.dbPoolActive} / {systemHealth.resources.dbPoolMax}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${Math.round(
                      (systemHealth.resources.dbPoolActive / systemHealth.resources.dbPoolMax) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                PostgreSQL Connection Pooler · P95 Query: 14ms.
              </span>
            </Card>
          </div>

          {/* Background Queues Status */}
          <Card>
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers size={17} className="text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {isVietnamese ? 'Hàng Đợi Xử Lý Nền (Background Worker Queues)' : 'Background Queues'}
                </h3>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              {systemHealth.backgroundQueues.map((q) => (
                <div key={q.queueName} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{q.queueName}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        q.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Đang chờ: <strong>{q.pendingJobs}</strong></span>
                    <span>Đã xử lý: <strong>{q.processedToday.toLocaleString()}</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Lỗi: {q.failedToday} · Tình trạng: Bình thường</span>
                </div>
              ))}
            </div>
          </Card>

          {/* System Audit Event Log Table */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Nhật Ký Kiểm Toán Hoạt Động (Security & System Audit Logs)' : 'Audit Trail Logs'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVietnamese
                      ? 'Ghi lại mọi thay đổi cấu hình, xác thực người dùng và tác vụ quản trị'
                      : 'Historical log of all administrative actions, logins, and configurations'}
                  </p>
                </div>
              </div>
              <Badge tone="blue">{systemHealth.auditLogs.length} events</Badge>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {systemHealth.auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          log.severity === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.severity === 'WARN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.severity}
                      </span>
                      <strong className="text-slate-900 text-sm">{log.action}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">#{log.id}</span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>
                        Thực hiện bởi: <strong>{log.actorName}</strong> ({log.actorEmail})
                      </span>
                      <span>•</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>

                  <span className="text-slate-400 font-mono text-[11px] shrink-0 self-end md:self-center">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI USAGE, MODELS & TELEMETRY                                       */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Hero Summary Banner */}
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-purple-50/40 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm font-bold">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {isVietnamese ? 'Thống Kê Động Cơ Trí Tuệ Nhân Tạo (AI Engine Telemetry)' : 'AI Engine Telemetry'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                    {isVietnamese
                      ? 'Theo dõi số lượng token tiêu thụ theo mô hình Gemini 1.5 Pro, Flash, Embedding-004 và GPT-4o. Phân bổ chi phí API và cơ chế bộ nhớ đệm giúp tiết kiệm chi phí vận hành.'
                      : 'Monitor token consumption across Gemini 1.5 Pro/Flash, Embedding-004 and GPT-4o. Track API cost distribution and cache hit savings.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0 text-center">
                <div className="rounded-xl bg-white p-3 border border-amber-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {isVietnamese ? 'Chi Phí API Ước Tính' : 'Estimated API Cost'}
                  </span>
                  <span className="font-black text-base text-amber-700">
                    ${aiMetrics.totalCostUSD} USD
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ~{aiMetrics.totalCostVND.toLocaleString()} đ
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {isVietnamese ? 'Tiết Kiệm Nhờ Cache' : 'Saved from Cache'}
                  </span>
                  <span className="font-black text-base text-emerald-700">
                    ${aiMetrics.costSavedUSD} USD
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    {aiMetrics.cacheHitRatioPercent}% hit rate
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Model Breakdown Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aiMetrics.modelBreakdown.map((m) => (
              <Card key={m.modelName} className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm truncate">{m.modelName}</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {m.sharePercentage}%
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.sharePercentage}%` }} />
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tokens:</span>
                    <strong className="text-slate-800">{(m.totalTokens / 1000000).toFixed(2)}M</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Yêu cầu:</span>
                    <strong className="text-slate-800">{m.requestCount.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Độ trễ TB:</span>
                    <strong className="text-emerald-700">{m.avgLatencyMs} ms</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chi phí:</span>
                    <strong className="text-amber-700">${m.estimatedCostUSD}</strong>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Feature Token Distribution */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Phân Bổ Token Theo Tính Năng Sản Phẩm' : 'Token Usage by Feature'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVietnamese
                      ? 'Khối lượng token tiêu thụ theo từng nghiệp vụ cốt lõi'
                      : 'Aggregated token volume per feature module'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              {aiMetrics.featureBreakdown.map((f) => (
                <div key={f.featureKey} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{f.featureName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-medium">
                        {f.requestCount.toLocaleString()} {isVietnamese ? 'lượt gọi' : 'requests'}
                      </span>
                      <strong className="text-slate-900">
                        {(f.tokenCount / 1000000).toFixed(2)}M tokens ({f.percentage}%)
                      </strong>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REVENUE, SUBSCRIPTIONS & FINANCIAL TRANSACTIONS                    */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Hero Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-white">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Doanh Thu Định Kỳ Tháng (MRR)' : 'Monthly Recurring Revenue'}
              </span>
              <p className="text-2xl font-black text-blue-700">
                {revenueMetrics.mrrVND.toLocaleString()} đ
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                +{revenueMetrics.growthPercentMoM}% {isVietnamese ? 'so với tháng trước' : 'vs last month'}
              </span>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-white">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Doanh Thu Quy Mô Năm (ARR)' : 'Annual Run Rate'}
              </span>
              <p className="text-2xl font-black text-purple-700">
                {(revenueMetrics.arrVND / 1000000000).toFixed(2)} Tỷ đ
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">Dự báo dựa trên chu kỳ hiện tại</span>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50/50 to-white">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Doanh Thu TB / Người Trả Phí (ARPU)' : 'ARPU (Paid Users)'}
              </span>
              <p className="text-2xl font-black text-emerald-700">
                {revenueMetrics.arpuVND.toLocaleString()} đ
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">Gói Pro & Executive kết hợp</span>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-50/50 to-white">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Tỷ Lệ Chuyển Đổi Trả Phí' : 'Paid Conversion Rate'}
              </span>
              <p className="text-2xl font-black text-amber-700">
                {revenueMetrics.conversionRatePercent}%
              </p>
              <span className="text-[11px] text-slate-500 block mt-1">
                {revenueMetrics.paidSubscribersCount} / {userMetrics.totalUsers} tài khoản
              </span>
            </Card>
          </div>

          {/* Monthly Revenue Trend & Payment Gateways 2-column */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 6-Month Revenue Trend */}
            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Tăng Trưởng Doanh Thu (6 Tháng Gần Nhất)' : '6-Month Revenue Growth'}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {revenueMetrics.monthlyRevenueTrend.map((m) => {
                  const maxRev = 150000000;
                  const pct = Math.round((m.revenueVND / maxRev) * 100);
                  return (
                    <div key={m.month} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-700">{m.month}</span>
                        <div className="flex gap-2">
                          <span className="text-slate-400">{m.transactionsCount} GD</span>
                          <strong className="text-blue-700 font-bold">{m.revenueVND.toLocaleString()} đ</strong>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Payment Gateway Distribution Details */}
            <Card>
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {isVietnamese ? 'Tỷ Trọng Cổng Thanh Toán' : 'Payment Gateways Breakdown'}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {revenueMetrics.paymentMethodDistribution.map((gw) => (
                  <div key={gw.method} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">{gw.label}</span>
                      <span className="font-bold text-slate-900">
                        {gw.amountVND.toLocaleString()} đ ({gw.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${gw.color}`} style={{ width: `${gw.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Financial Transactions Table */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {isVietnamese ? 'Giao Dịch Thanh Toán Gần Nhất' : 'Recent Financial Transactions'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isVietnamese ? 'Cập nhật trạng thái tức thì từ Webhook ngân hàng & ví điện tử' : 'Direct realtime payments log'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="pb-2.5">Mã Đơn</th>
                    <th className="pb-2.5">Khách Hàng</th>
                    <th className="pb-2.5">Gói Đăng Ký</th>
                    <th className="pb-2.5">Số Tiền (VND)</th>
                    <th className="pb-2.5">Phương Thức</th>
                    <th className="pb-2.5">Trạng Thái</th>
                    <th className="pb-2.5">Thời Gian</th>
                    <th className="pb-2.5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revenueMetrics.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-mono font-bold text-slate-800">{tx.orderCode}</td>
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{tx.candidateName}</p>
                        <p className="text-[11px] text-slate-400">{tx.candidateEmail}</p>
                      </td>
                      <td className="py-3 font-medium text-slate-700">{tx.planName}</td>
                      <td className="py-3 font-bold text-emerald-700">{tx.amountVND.toLocaleString()} đ</td>
                      <td className="py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-[11px] text-slate-700">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            tx.status === 'success'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.status === 'success'
                            ? isVietnamese
                              ? 'Thành công'
                              : 'Success'
                            : tx.status === 'pending'
                            ? isVietnamese
                              ? 'Đang xử lý'
                              : 'Pending'
                            : 'Thất bại'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-400">{tx.createdAt}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>{isVietnamese ? 'Hóa đơn' : 'Receipt'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USER MANAGEMENT, DEMOGRAPHICS & ACTIVITIES                         */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Metrics Top Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Ứng Viên (Candidates)' : 'Candidates'}
              </span>
              <p className="text-2xl font-black text-slate-900">
                {userMetrics.candidateCount.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">Chiếm 98.1% tổng người dùng</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Cố Vấn Nghề Nghiệp' : 'Career Consultants'}
              </span>
              <p className="text-2xl font-black text-blue-700">
                {userMetrics.consultantCount}
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">Đã được xác minh chuyên môn</span>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Chỉ Số Gắn Kết (DAU / MAU)' : 'Stickiness (DAU/MAU)'}
              </span>
              <p className="text-2xl font-black text-emerald-700">
                {userMetrics.stickinessRatio}%
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                DAU: {userMetrics.dau} · MAU: {userMetrics.mau}
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-xs text-slate-500 block mb-1">
                {isVietnamese ? 'Xác Thực Tài Khoản OTP' : 'OTP Verified Accounts'}
              </span>
              <p className="text-2xl font-black text-purple-700">
                {userMetrics.verifiedPercent}%
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Churn rate: {userMetrics.churnRatePercent}% (Rất thấp)
              </span>
            </Card>
          </div>

          {/* User Directory Table with Search & Filter */}
          <Card>
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {isVietnamese ? 'Danh Mục Quản Trị Người Dùng' : 'User Accounts Directory'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isVietnamese
                    ? 'Tìm kiếm, xem hồ sơ, gói cước và điều chỉnh quyền truy cập'
                    : 'Manage candidate, consultant, and admin privileges'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={isVietnamese ? 'Tìm theo tên, email...' : 'Search name, email...'}
                    className="w-48 sm:w-64 rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as UserRole | 'ALL')}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">{isVietnamese ? 'Tất cả vai trò' : 'All Roles'}</option>
                  <option value="CANDIDATE">Ứng viên (Candidate)</option>
                  <option value="CAREER_CONSULTANT">Cố vấn (Consultant)</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="pb-2.5">ID</th>
                    <th className="pb-2.5">Người Dùng</th>
                    <th className="pb-2.5">Vai Trò</th>
                    <th className="pb-2.5">Gói Cước</th>
                    <th className="pb-2.5">Token Đã Dùng</th>
                    <th className="pb-2.5">Xác Thực</th>
                    <th className="pb-2.5">Trạng Thái</th>
                    <th className="pb-2.5">Hoạt Động Gần Nhất</th>
                    <th className="pb-2.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-mono font-bold text-slate-400">#{u.id}</td>
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-rose-100 text-rose-800'
                              : u.role === 'CAREER_CONSULTANT'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-700">{u.planName}</td>
                      <td className="py-3 font-mono text-slate-600">{u.tokensUsed.toLocaleString()}</td>
                      <td className="py-3">
                        {u.isVerified ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Đã xác minh</span>
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Chờ OTP</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] text-slate-400">{u.lastActiveAt}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="rounded-lg p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() =>
                              userStatusMutation.mutate({
                                userId: u.id,
                                status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                              })
                            }
                            className={`rounded-lg p-1 cursor-pointer transition ${
                              u.status === 'ACTIVE'
                                ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.status === 'ACTIVE' ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TRANSACTION RECEIPT DETAIL                                       */}
      {/* ========================================================================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isVietnamese ? 'Biên Lai Giao Dịch' : 'Transaction Receipt'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã đơn hàng:</span>
                  <strong className="font-mono text-slate-900">{selectedTx.orderCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách hàng:</span>
                  <strong>{selectedTx.candidateName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono">{selectedTx.candidateEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gói đăng ký:</span>
                  <span className="font-bold text-blue-700">{selectedTx.planName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-bold">Số tiền thanh toán:</span>
                  <strong className="text-base font-black text-emerald-700">
                    {selectedTx.amountVND.toLocaleString()} đ
                  </strong>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Cổng thanh toán:</span>
                <span className="font-semibold text-slate-800">{selectedTx.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái:</span>
                <Badge tone="green">{selectedTx.status.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian giao dịch:</span>
                <span className="font-mono text-slate-600">{selectedTx.createdAt}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="primary" onClick={() => setSelectedTx(null)} className="text-xs">
                {isVietnamese ? 'Đóng biên lai' : 'Close Receipt'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: USER PROFILE QUICK INSPECT                                       */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isVietnamese ? 'Thông Tin Tài Khoản Người Dùng' : 'User Account Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-blue-50/60 p-3.5 border border-blue-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedUser.name}</h4>
                  <p className="text-slate-500 font-mono">{selectedUser.email}</p>
                </div>
                <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-xs">
                  {selectedUser.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Gói Đăng Ký:</span>
                  <strong className="text-slate-800">{selectedUser.planName}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Lượng Token Đã Dùng:</span>
                  <strong className="text-purple-700">{selectedUser.tokensUsed.toLocaleString()}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Ngày Tạo Tài Khoản:</span>
                  <strong className="text-slate-800">{selectedUser.createdAt}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Trạng Thái:</span>
                  <strong className={selectedUser.status === 'ACTIVE' ? 'text-emerald-700' : 'text-red-700'}>
                    {selectedUser.status}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  userStatusMutation.mutate({
                    userId: selectedUser.id,
                    status: selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                  });
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  selectedUser.status === 'ACTIVE'
                    ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {selectedUser.status === 'ACTIVE' ? <Lock size={13} /> : <Unlock size={13} />}
                <span>
                  {selectedUser.status === 'ACTIVE'
                    ? isVietnamese
                      ? 'Khóa tài khoản này'
                      : 'Suspend Account'
                    : isVietnamese
                    ? 'Mở khóa tài khoản'
                    : 'Activate Account'}
                </span>
              </button>

              <Button variant="secondary" onClick={() => setSelectedUser(null)} className="text-xs">
                {isVietnamese ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MAINTENANCE MODE SAFETY CONFIRMATION                             */}
      {/* ========================================================================= */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-slate-900">
                {isVietnamese ? 'Xác Nhận Chế Độ Bảo Trì' : 'Confirm Maintenance Mode'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {systemHealth.overallStatus === 'MAINTENANCE'
                ? isVietnamese
                  ? 'Bạn có chắc chắn muốn tắt chế độ bảo trì và mở lại toàn bộ hệ thống cho người dùng ứng tuyển và cố vấn không?'
                  : 'Are you sure you want to disable maintenance mode and reopen the platform to candidates and consultants?'
                : isVietnamese
                ? 'Khi bật chế độ bảo trì, các tính năng tạo CV, chat AI và thanh toán sẽ tạm thời bị khóa với người dùng thông thường để phục vụ nâng cấp hệ thống.'
                : 'Enabling maintenance mode will temporarily lock CV creation, AI queries, and payments for general users.'}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowMaintenanceModal(false)} className="text-xs">
                {isVietnamese ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  maintenanceMutation.mutate(systemHealth.overallStatus !== 'MAINTENANCE')
                }
                disabled={maintenanceMutation.isPending}
                className="text-xs bg-amber-600 hover:bg-amber-700"
              >
                {systemHealth.overallStatus === 'MAINTENANCE'
                  ? isVietnamese
                    ? 'Mở lại hệ thống'
                    : 'Reopen Platform'
                  : isVietnamese
                  ? 'Bật bảo trì ngay'
                  : 'Enable Maintenance'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
