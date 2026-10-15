import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  Compass,
  DollarSign,
  ExternalLink,
  Flame,
  Globe2,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  MapPin,
  Percent,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  getSalaryTracks,
  getLocationMultipliers,
  calculateSalaryEstimate,
} from '../../mocks/services/mockService';
import type { CareerSalaryTrack } from '../../types/domain';
import { Badge, Button, Card, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function SalaryEstimationPage() {
  const { t } = useTranslation();

  // Queries
  const { data: tracks = [], isPending } = useQuery({
    queryKey: ['salaryTracks'],
    queryFn: getSalaryTracks,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locationMultipliers'],
    queryFn: getLocationMultipliers,
  });

  // State
  const [selectedTrackId, setSelectedTrackId] = useState<string>('ai-fullstack');
  const [selectedLevel, setSelectedLevel] = useState<'Junior' | 'Middle' | 'Senior' | 'Lead'>('Senior');
  const [selectedLocation, setSelectedLocation] = useState<string>('Ho Chi Minh');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(['rag-llm', 'nextjs']);
  const [currency, setCurrency] = useState<'USD' | 'VND'>('USD');

  // Active track
  const activeTrack = useMemo(() => {
    return tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  }, [tracks, selectedTrackId]);

  // When track changes, default select first 2 skill boosters
  const handleTrackChange = (trackId: string) => {
    setSelectedTrackId(trackId);
    const newTrack = tracks.find((t) => t.id === trackId);
    if (newTrack && newTrack.availableSkillBoosters.length > 0) {
      setSelectedSkillIds(newTrack.availableSkillBoosters.slice(0, 2).map((s) => s.id));
    } else {
      setSelectedSkillIds([]);
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  // Calculation result
  const result = useMemo(() => {
    if (!tracks.length) return null;
    return calculateSalaryEstimate({
      trackId: selectedTrackId,
      level: selectedLevel,
      location: selectedLocation,
      selectedSkillIds,
    });
  }, [tracks, selectedTrackId, selectedLevel, selectedLocation, selectedSkillIds]);

  // Format currency helpers
  const formatSalary = (usd: number, vnd: number) => {
    if (currency === 'USD') {
      return `$${usd.toLocaleString('en-US')}`;
    }
    const millionVND = Math.round(vnd / 100000) / 10;
    return `${millionVND} Tr VNĐ`;
  };

  const formatVNDText = (vnd: number) => {
    const millionVND = Math.round(vnd / 100000) / 10;
    return `${millionVND} Triệu VNĐ`;
  };

  if (isPending || !activeTrack || !result) {
    return <Loading />;
  }

  const levelLabels: Record<'Junior' | 'Middle' | 'Senior' | 'Lead', { label: string; years: string }> = {
    Junior: { label: 'Junior', years: '1 - 2 năm' },
    Middle: { label: 'Middle', years: '2 - 4 năm' },
    Senior: { label: 'Senior', years: '4 - 7 năm' },
    Lead: { label: 'Lead / Architect', years: '7+ năm' },
  };

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Dự báo & Ước tính Lương (Salary Estimation)
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700 shadow-2xs">
              <Sparkles size={13} className="text-emerald-600 animate-pulse" />
              AI Market Intelligence 2026
            </span>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Mô hình phân tích dữ liệu thị trường IT độc quyền, ước tính dải lương theo vị trí nghề nghiệp, cấp bậc kinh nghiệm, địa điểm và kỹ năng công nghệ chuyên sâu.
          </p>
        </div>

        {/* Currency Switcher & Quick Navigation */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              USD ($/tháng)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('VND')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                currency === 'VND'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              VND (Triệu/tháng)
            </button>
          </div>

          <Link
            to="/candidate/jobs"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <BriefcaseBusiness size={14} className="text-blue-600" />
            <span>Xem việc làm</span>
          </Link>
        </div>
      </div>

      {/* Career Track Selector Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Chọn định hướng nghề nghiệp (Career Track):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tracks.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleTrackChange(track.id)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-2xl">{track.icon}</span>
                  <span className="rounded-full bg-emerald-100/90 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5">
                    {track.annualGrowthRate}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mb-1">
                  {track.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-auto">
                  {track.relatedJobCount} việc làm mở
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Parameters Configuration Card */}
      <Card className="p-5 md:p-6 border border-slate-200/90 bg-white shadow-2xs rounded-3xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Experience Level & Location */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                2. Cấp bậc & Số năm kinh nghiệm:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Junior', 'Middle', 'Senior', 'Lead'] as const).map((lvl) => {
                  const active = selectedLevel === lvl;
                  const info = levelLabels[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{info.label}</span>
                        {active && <Check size={13} className="text-white" />}
                      </div>
                      <span className={`text-[10px] block mt-0.5 ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                        {info.years}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                3. Thị trường làm việc & Vị trí địa lý:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {locations.map((loc) => {
                  const active = selectedLocation === loc.location;
                  return (
                    <button
                      key={loc.location}
                      type="button"
                      onClick={() => setSelectedLocation(loc.location)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-xs">{loc.label}</span>
                      </div>
                      {active && <Check size={13} className="text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Skill Boosters */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                4. Tổ hợp kỹ năng chuyên sâu (+% Tăng giá trị thị trường):
              </label>
              <span className="text-[11px] text-blue-600 font-bold">
                +{result.totalSkillBoostPercentage}% tăng thêm
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {activeTrack.availableSkillBoosters.map((booster) => {
                const isChecked = selectedSkillIds.includes(booster.id);
                return (
                  <div
                    key={booster.id}
                    onClick={() => toggleSkill(booster.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      isChecked
                        ? 'border-blue-400 bg-blue-50/60 shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent div
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {booster.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        +{booster.boostPercentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        (~+${booster.monthlyBoostUSD}/tháng)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-normal">
              💡 <em>Các kỹ năng chuyên sâu được tính lũy tiến dựa trên dữ liệu tuyển dụng thực tế và nhu cầu khát nhân lực của doanh nghiệp.</em>
            </p>
          </div>
        </div>
      </Card>

      {/* Salary Result Hero Display */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 md:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-60 -top-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Range */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-500/20 border border-blue-400/40 px-3 py-1 text-xs font-bold text-blue-300">
                {activeTrack.name} • {selectedLevel}
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                Hệ số vùng: {Math.round(result.locationMultiplier * 100)}%
              </span>
              {result.totalSkillBoostPercentage > 0 && (
                <span className="rounded-full bg-purple-500/20 border border-purple-400/40 px-3 py-1 text-xs font-bold text-purple-300">
                  Bonus kỹ năng: +{result.totalSkillBoostPercentage}%
                </span>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Khoảng lương dự báo thị trường (Market Range):
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                  {formatSalary(result.minMonthlyUSD, result.minMonthlyVND)} – {formatSalary(result.maxMonthlyUSD, result.maxMonthlyVND)}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / tháng
                </span>
              </div>

              {currency === 'USD' ? (
                <p className="text-xs text-blue-200/90 mt-1">
                  Tương đương khoảng <strong className="text-white">{formatVNDText(result.minMonthlyVND)}</strong> đến <strong className="text-white">{formatVNDText(result.maxMonthlyVND)}</strong> / tháng
                </p>
              ) : (
                <p className="text-xs text-blue-200/90 mt-1">
                  Tương đương khoảng <strong className="text-white">${result.minMonthlyUSD.toLocaleString()}</strong> đến <strong className="text-white">${result.maxMonthlyUSD.toLocaleString()} USD</strong> / tháng
                </p>
              )}
            </div>
          </div>

          {/* Median Score Tile */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 text-center flex flex-col justify-center items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Mức trung vị thị trường (Median / P50)
            </span>
            <p className="text-3xl sm:text-4xl font-black text-amber-300 mt-1 mb-1">
              {formatSalary(result.medianMonthlyUSD, result.medianMonthlyVND)}
            </p>
            <p className="text-2xs text-slate-300">
              50% kỹ sư có cùng trình độ nhận mức lương cao hơn con số này.
            </p>
          </div>
        </div>
      </div>

      {/* Percentiles Spectrum Gauge */}
      <Card className="p-5 md:p-6 border border-slate-200/90 bg-white shadow-2xs rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Phổ phân vị mức lương thị trường (Percentiles Spectrum)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân vị P10 đến P90 đo lường từ mức khởi điểm cơ bản đến mức thu nhập của nhóm 10% kỹ sư xuất sắc nhất.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            Dữ liệu quý 4/2026
          </span>
        </div>

        {/* 5 Percentile Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              id: 'P10',
              label: 'P10 • Khởi điểm',
              desc: '10% thấp nhất',
              usd: result.percentilesUSD.p10,
              vnd: result.percentilesVND.p10,
              color: 'text-slate-700 bg-slate-50 border-slate-200',
            },
            {
              id: 'P25',
              label: 'P25 • Mức cơ bản',
              desc: '25% phổ biến',
              usd: result.percentilesUSD.p25,
              vnd: result.percentilesVND.p25,
              color: 'text-slate-800 bg-slate-50 border-slate-200',
            },
            {
              id: 'P50',
              label: 'P50 • Trung vị',
              desc: '50% trung bình',
              usd: result.percentilesUSD.p50,
              vnd: result.percentilesVND.p50,
              color: 'text-blue-700 bg-blue-50/80 border-blue-300 ring-1 ring-blue-400 font-extrabold',
            },
            {
              id: 'P75',
              label: 'P75 • Mức khá giỏi',
              desc: 'Top 25% thị trường',
              usd: result.percentilesUSD.p75,
              vnd: result.percentilesVND.p75,
              color: 'text-indigo-800 bg-indigo-50 border-indigo-200',
            },
            {
              id: 'P90',
              label: 'P90 • Đỉnh cao',
              desc: 'Top 10% xuất sắc',
              usd: result.percentilesUSD.p90,
              vnd: result.percentilesVND.p90,
              color: 'text-purple-900 bg-purple-50 border-purple-200 font-black',
            },
          ].map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border text-center transition-all ${item.color}`}
            >
              <span className="text-xs font-bold block">{item.label}</span>
              <p className="text-lg sm:text-xl font-black mt-1.5 mb-0.5">
                {formatSalary(item.usd, item.vnd)}
              </p>
              <span className="text-[10px] text-slate-400 block">{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Visual Gradient Spectrum Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-blue-300 via-indigo-500 to-purple-600 shadow-inner" />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>Mức cơ sở</span>
            <span className="text-blue-600 font-bold">▲ Mức bạn đang khảo sát (P50)</span>
            <span>Mức Top đầu</span>
          </div>
        </div>
      </Card>

      {/* Two Column Section: Career Ladder Progression & Market Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Ladder Progression */}
        <Card className="p-5 md:p-6 border border-slate-200/90 bg-white shadow-2xs rounded-3xl">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Lộ trình tăng lương theo cấp bậc ({activeTrack.name})
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            So sánh bước nhảy thu nhập khi thăng cấp qua các giai đoạn sự nghiệp.
          </p>

          <div className="space-y-3">
            {(['Junior', 'Middle', 'Senior', 'Lead'] as const).map((lvl) => {
              const data = activeTrack.levels[lvl];
              const isCurrent = selectedLevel === lvl;
              const usdMedian = Math.round(data.baseMedianUSD * result.locationMultiplier);
              const vndMedian = Math.round(usdMedian * 25500);

              return (
                <div
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/70 shadow-2xs ring-1 ring-blue-400'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-xl font-bold text-xs ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lvl.charAt(0)}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {lvl}
                        {isCurrent && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] text-blue-700">
                            Đang xem
                          </span>
                        )}
                      </h4>
                      <p className="text-2xs text-slate-400">{data.yearsExperience}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {formatSalary(usdMedian, vndMedian)}
                    </p>
                    <span className="text-[10px] text-slate-400">Trung vị / tháng</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Skill Boosters Breakdown */}
        <Card className="p-5 md:p-6 border border-slate-200/90 bg-white shadow-2xs rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Giá trị gia tăng từ Kỹ năng ({result.skillBonuses.length} kỹ năng)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mỗi kỹ năng chuyên môn đặc thù giúp bạn tự tin yêu cầu mức thù lao cao hơn.
            </p>

            {result.skillBonuses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa chọn kỹ năng tăng giá trị nào. Hãy tick chọn các kỹ năng ở mục 4 để xem giá trị cộng thêm!
              </div>
            ) : (
              <div className="space-y-2.5">
                {result.skillBonuses.map((bonus) => (
                  <div
                    key={bonus.skillName}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">
                        {bonus.skillName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700">
                        +{formatSalary(bonus.monthlyValueUSD, bonus.monthlyValueVND)}/tháng
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        (+{bonus.boostPercentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick CTA to Jobs */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Có <strong className="text-slate-900 font-bold">{activeTrack.relatedJobCount}</strong> việc làm đang tuyển vị trí này
            </span>
            <Link
              to={`/candidate/jobs?search=${encodeURIComponent(activeTrack.name)}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <span>Xem việc làm thực tế</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

      {/* AI Salary Negotiation Tactics Card */}
      <Card className="p-5 md:p-6 border border-slate-200/90 bg-gradient-to-br from-white to-blue-50/40 shadow-2xs rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <Lightbulb size={20} />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bí quyết đàm phán lương hiệu quả từ AI (AI Negotiation Advice)
            </h3>
            <p className="text-xs text-slate-500">
              Chiến lược giúp bạn đạt mức lương tiệm cận P75 - P90 trong buổi phỏng vấn.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {activeTrack.negotiationChecklist.map((tip, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-white font-extrabold text-xs">
                {index + 1}
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
