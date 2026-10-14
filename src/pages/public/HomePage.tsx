import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LineChart,
  BrainCircuit,
  Compass,
  Bot,
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { MatchScoreBadge } from '../../components/common/MatchScoreBadge';
import { mockJobs } from '../../mocks/data/jobs';
import { useTranslation } from '../../i18n';

export default function HomePage() {
  const { t, isVietnamese } = useTranslation();

  // Get the 4 featured jobs for the homepage preview
  const featuredJobs = mockJobs.slice(0, 4);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>{t('home.badge', 'Đồ án Tốt nghiệp ĐH FPT • Mã dự án FA26SE119')}</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.15]">
              {isVietnamese ? (
                <>
                  Nền tảng Khớp nối CV<br />
                  Thông minh với <span className="text-blue-600">AI Agent</span><br />
                  Platform
                </>
              ) : (
                <>
                  Intelligent CV Matching<br />
                  <span className="text-blue-600">AI Agent</span> Platform
                </>
              )}
            </h1>

            <p className="text-base text-slate-600 sm:text-lg leading-relaxed max-w-2xl mx-auto">
              {t(
                'home.heroSubtitle',
                'Tự động hóa gợi ý việc làm & đồng hành phát triển sự nghiệp dựa trên phân tích ATS chuyên sâu, vector ngữ nghĩa và trí tuệ tương tác thế hệ mới.'
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/guest-trial">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer">
                  <span>{isVietnamese ? 'Trải nghiệm ngay' : t('home.launchDemo', 'Trải nghiệm ngay')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/jobs">
                <Button
                  variant="secondary"
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl shadow-2xs text-sm sm:text-base inline-flex items-center gap-2"
                >
                  <Compass className="h-4 w-4 text-slate-500" />
                  <span>{t('home.exploreJobs', 'Khám phá việc làm hot')}</span>
                </Button>
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-xl mx-auto text-center">
              <div>
                <p className="text-2xl font-black text-slate-900">94%</p>
                <p className="text-xs text-slate-500 font-medium">
                  {t('home.matchAccuracy', 'Độ chính xác khớp nối')}
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{t('home.tenStep', '10 Bước')}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {t('home.resumeBuilder', 'Trình tạo CV chuẩn AI')}
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{t('home.rolesCount', '3 Vai trò')}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {t('home.rolesDesc', 'Ứng viên, Cố vấn & Quản trị')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {t('home.featuresTitle', 'Được thiết kế cho Trí tuệ Nghề nghiệp Hiện đại')}
          </h2>
          <p className="text-sm text-slate-500">
            {t(
              'home.featuresSubtitle',
              'Quy trình làm việc thế hệ mới kết nối kỹ năng ứng viên với các cơ hội việc làm công nghệ hàng đầu.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 hover:border-blue-300 transition-all bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="inline-flex p-3 rounded-xl bg-blue-50 text-blue-600">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('home.semanticFitTitle', 'Khớp nối CV - Việc làm Ngữ nghĩa')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'home.semanticFitDesc',
                'Phân tích đa chiều so sánh kỹ năng công nghệ, quy mô dự án, cấp bậc kinh nghiệm và bằng cấp chuyên môn.'
              )}
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-purple-300 transition-all bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="inline-flex p-3 rounded-xl bg-purple-50 text-purple-600">
              <LineChart className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('home.gapDiagnosisTitle', 'Chẩn đoán Lỗ hổng Kỹ năng')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'home.gapDiagnosisDesc',
                'Phản hồi tức thì các kỹ năng còn thiếu kèm lộ trình học tập từng bước được gợi ý tự động.'
              )}
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-emerald-300 transition-all bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="inline-flex p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('home.aiAgentTitle', 'Trợ lý Nghề nghiệp Tự hành')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t(
                'home.aiAgentDesc',
                'Trợ lý hội thoại chuyên sâu giải đáp tức thì về tối ưu hóa ATS, mức lương thị trường và bí quyết phỏng vấn.'
              )}
            </p>
          </Card>
        </div>
      </section>

      {/* Featured Jobs Preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('home.recommendedTitle', 'Cơ hội Việc làm Đề xuất')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('home.recommendedSubtitle', 'Các cơ hội tuyển dụng chọn lọc phù hợp với hồ sơ ứng viên mẫu')}
            </p>
          </div>
          <Link to="/jobs">
            <Button
              variant="secondary"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>{t('home.viewAllJobs', 'Xem tất cả việc làm')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredJobs.map((job) => (
            <Card
              key={job.id}
              className="p-5 flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all bg-white rounded-2xl border border-slate-200/80"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{job.title}</h4>
                    <p className="text-xs text-slate-500">
                      {job.company} • {job.location}
                    </p>
                  </div>
                  {job.match && <MatchScoreBadge score={job.match} size="sm" />}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-900">{job.salary}</span>
                <Link to={`/jobs/${job.id}`}>
                  <span className="font-semibold text-xs text-blue-600 hover:underline">
                    {t('common.viewDetails', 'Xem chi tiết')}
                  </span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Role Switcher Callout for Lecturers/Evaluators */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1329] text-white p-8 sm:p-10 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-800/90 border border-slate-700/60 px-2.5 py-1 text-xs font-semibold text-blue-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t('home.capstoneEvaluationGuide', 'Hướng dẫn Đánh giá Đồ án')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {t('home.experienceAllRoles', 'Trải nghiệm Ngay Cả 3 Vai trò Hệ thống')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {t(
                  'home.rolesCalloutDesc',
                  'Đăng nhập tức thì dưới vai trò Ứng viên (Alex Nguyễn), Cố vấn nghề nghiệp (TS. Sarah Jenkins), hoặc Quản trị viên hệ thống (Marcus Vance) với 1 cú click.'
                )}
              </p>
            </div>
            <Link to="/login" className="shrink-0">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg whitespace-nowrap cursor-pointer">
                {t('home.goToSignIn', 'Đăng nhập & Chọn vai trò')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
