import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  ExternalLink,
  History,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  getAssessmentTopics,
  getAssessmentQuestions,
  submitAssessment,
  getAssessmentHistory,
} from '../../mocks/services/mockService';
import type { AssessmentQuestion, AssessmentAttempt, AssessmentResult } from '../../types/assessment';
import { Badge, Button, Card, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { Link } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

type PageView = 'topics' | 'quiz' | 'result' | 'history';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function gradeColor(grade: string) {
  if (grade === 'S') return 'from-yellow-400 to-amber-500';
  if (grade === 'A') return 'from-emerald-400 to-teal-500';
  if (grade === 'B') return 'from-blue-400 to-blue-600';
  if (grade === 'C') return 'from-amber-400 to-orange-500';
  return 'from-red-400 to-rose-500';
}

function gradeLabel(grade: string) {
  if (grade === 'S') return 'Outstanding';
  if (grade === 'A') return 'Excellent';
  if (grade === 'B') return 'Good';
  if (grade === 'C') return 'Fair';
  return 'Needs Work';
}

function difficultyColor(diff: string) {
  if (diff === 'beginner') return 'text-emerald-600 bg-emerald-50';
  if (diff === 'intermediate') return 'text-blue-600 bg-blue-50';
  return 'text-violet-600 bg-violet-50';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TopicCard({
  topic,
  onSelect,
}: {
  topic: { id: string; name: string; icon: string; category: string };
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      id={`topic-${topic.id}`}
      onClick={onSelect}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-3xl">{topic.icon}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
          {topic.category}
        </span>
      </div>
      <div>
        <p className="text-base font-bold text-slate-800">{topic.name}</p>
        <p className="mt-1 text-xs text-slate-500">{t('skillAssessment.startAssessment')}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition">
        <Sparkles size={12} />
        {t('skillAssessment.aiGenerating').split('…')[0]}
      </div>
    </button>
  );
}

function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelect,
  showExplanation,
  onToggleExplanation,
  elapsedSeconds,
  isSubmitted,
}: {
  question: AssessmentQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  showExplanation: boolean;
  onToggleExplanation: () => void;
  elapsedSeconds: number;
  isSubmitted: boolean;
}) {
  const { t } = useTranslation();

  const getOptionStyle = (optionId: string) => {
    if (!isSubmitted) {
      return selectedOptionId === optionId
        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50';
    }
    if (optionId === question.correctOptionId) return 'border-emerald-500 bg-emerald-50 text-emerald-800';
    if (optionId === selectedOptionId && optionId !== question.correctOptionId)
      return 'border-red-400 bg-red-50 text-red-700';
    return 'border-slate-200 bg-white text-slate-500 opacity-60';
  };

  const getOptionIcon = (optionId: string) => {
    if (!isSubmitted) {
      return selectedOptionId === optionId ? (
        <CircleDot size={18} className="text-blue-600 flex-shrink-0" />
      ) : (
        <div className="h-[18px] w-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
      );
    }
    if (optionId === question.correctOptionId) return <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />;
    if (optionId === selectedOptionId) return <XCircle size={18} className="text-red-500 flex-shrink-0" />;
    return <div className="h-[18px] w-[18px] rounded-full border-2 border-slate-200 flex-shrink-0" />;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
            {t('skillAssessment.questionOf')
              .replace('{current}', String(questionNumber))
              .replace('{total}', String(totalQuestions))}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyColor(question.difficulty)}`}>
            {question.difficulty === 'beginner'
              ? t('skillAssessment.diffBeginner')
              : question.difficulty === 'intermediate'
              ? t('skillAssessment.diffIntermediate')
              : t('skillAssessment.diffAdvanced')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {question.topic}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <Clock size={15} className="text-slate-400" />
          {formatTime(elapsedSeconds)}
        </div>
      </div>

      {/* Question text */}
      <Card className="border-slate-200">
        <p className="text-base font-semibold text-slate-800 leading-relaxed">{question.text}</p>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            id={`option-${question.id}-${option.id}`}
            onClick={() => !isSubmitted && onSelect(option.id)}
            disabled={isSubmitted}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm font-medium transition cursor-pointer ${getOptionStyle(option.id)}`}
          >
            {getOptionIcon(option.id)}
            <span className="leading-relaxed">{option.text}</span>
          </button>
        ))}
      </div>

      {/* Explanation (shown after submission or on request) */}
      {isSubmitted && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <button
            onClick={onToggleExplanation}
            className="flex w-full items-center justify-between text-sm font-semibold text-amber-800"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-600" />
              {showExplanation ? t('skillAssessment.hideExplanation') : t('skillAssessment.showExplanation')}
            </div>
            {showExplanation ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showExplanation && (
            <p className="mt-3 text-sm text-amber-700 leading-relaxed">{question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Result View ─────────────────────────────────────────────────────────────

function ResultView({
  result,
  onRetake,
  onNewTopic,
  questions,
}: {
  result: AssessmentResult;
  onRetake: () => void;
  onNewTopic: () => void;
  questions: AssessmentQuestion[];
}) {
  const { t } = useTranslation();
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

  const toggleExp = (id: string) =>
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className={`bg-gradient-to-br ${gradeColor(result.grade)} border-0 text-white`}>
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-3 rounded-2xl bg-white/20 p-4">
            <Trophy size={36} className="text-white" />
          </div>
          <p className="text-lg font-semibold opacity-90">{t('skillAssessment.assessmentComplete')}</p>
          <p className="text-5xl font-black tracking-tight mt-1">{result.score}%</p>
          <p className="text-xl font-bold opacity-90 mt-1">{result.topicName}</p>
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white/25 px-4 py-2">
            <Award size={16} />
            <span className="text-sm font-semibold">
              {t('skillAssessment.grade')}: {result.grade} — {gradeLabel(result.grade)}
            </span>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatItem
          label={t('skillAssessment.correctAnswers')}
          value={`${result.correctAnswers}/${result.totalQuestions}`}
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <StatItem
          label={t('skillAssessment.timeTaken')}
          value={`${result.timeTakenMinutes}m`}
          icon={<Clock size={18} className="text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatItem
          label={t('skillAssessment.strengths')}
          value={String(result.strengths.length)}
          icon={<Zap size={18} className="text-amber-600" />}
          bgColor="bg-amber-50"
        />
        <StatItem
          label={t('skillAssessment.weaknesses')}
          value={String(result.weaknesses.length)}
          icon={<Target size={18} className="text-rose-500" />}
          bgColor="bg-rose-50"
        />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {t('skillAssessment.strengths')}
          </p>
          <ul className="space-y-1.5">
            {result.strengths.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
            <Target size={16} className="text-rose-500" />
            {t('skillAssessment.weaknesses')}
          </p>
          <ul className="space-y-1.5">
            {result.weaknesses.map((w) => (
              <li key={w} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* AI Recommendation */}
      <Card className="border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-600 p-2">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-blue-800">{t('skillAssessment.recommendation')}</p>
            <p className="text-sm text-blue-700 leading-relaxed">{result.recommendation}</p>
            {result.nextTopicSuggestion && (
              <p className="mt-2 text-xs text-blue-600 font-medium">
                {t('skillAssessment.nextSuggestion')}: <strong>{result.nextTopicSuggestion}</strong>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Question Review */}
      <div>
        <h2 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
          <BookOpen size={18} className="text-slate-500" />
          {t('skillAssessment.questionReview')}
        </h2>
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const attempt = result.attempts[idx];
            const isCorrect = attempt?.isCorrect;
            const selected = q.options.find((o) => o.id === attempt?.selectedOptionId);
            const correct = q.options.find((o) => o.id === q.correctOptionId);
            const expanded = expandedExplanations.has(q.id);

            return (
              <Card key={q.id} className={isCorrect ? 'border-emerald-200' : 'border-red-200'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {isCorrect ? (
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                        Q{idx + 1}. {q.text}
                      </p>
                      <div className="mt-2 space-y-1">
                        {!isCorrect && selected && (
                          <p className="text-xs text-red-600">
                            <span className="font-semibold">{t('skillAssessment.incorrect')}:</span>{' '}
                            {selected.text}
                          </p>
                        )}
                        <p className="text-xs text-emerald-700">
                          <span className="font-semibold">{t('skillAssessment.correct')}:</span>{' '}
                          {correct?.text}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExp(q.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition flex-shrink-0"
                  >
                    <Lightbulb size={12} />
                    {expanded ? t('skillAssessment.hideExplanation') : t('skillAssessment.showExplanation')}
                  </button>
                </div>
                {expanded && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 leading-relaxed border border-amber-100">
                    {q.explanation}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onRetake}>
          <RefreshCw size={15} />
          {t('skillAssessment.retake')}
        </Button>
        <Button variant="secondary" onClick={onNewTopic}>
          <BrainCircuit size={15} />
          {t('skillAssessment.tryAnotherTopic')}
        </Button>
        <Link to="/candidate/learning">
          <Button variant="secondary">
            <BookOpen size={15} />
            {t('nav.learningRoadmap')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  icon,
  bgColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <Card className="p-4">
      <div className={`mb-2 inline-flex rounded-xl p-2 ${bgColor}`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </Card>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────

function HistoryView({
  history,
  onBack,
}: {
  history: AssessmentResult[];
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">{t('skillAssessment.historyTitle')}</h2>
      </div>
      {history.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500 py-6">{t('skillAssessment.noHistory')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradeColor(r.grade)} text-white text-lg font-black`}
                >
                  {r.grade}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.topicName}</p>
                  <p className="text-xs text-slate-500">
                    {r.correctAnswers}/{r.totalQuestions} correct · {r.timeTakenMinutes}m
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.completedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-slate-900">{r.score}%</p>
                <p className="text-xs text-slate-500">{gradeLabel(r.grade)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SkillAssessmentPage() {
  const { t } = useTranslation();

  const [view, setView] = useState<PageView>('topics');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Queries
  const { data: topics = [], isPending: isTopicsLoading } = useQuery({
    queryKey: ['assessmentTopics'],
    queryFn: getAssessmentTopics,
  });

  const {
    data: questions = [],
    isPending: isQuestionsLoading,
    refetch: refetchQuestions,
  } = useQuery({
    queryKey: ['assessmentQuestions', selectedTopicId],
    queryFn: () => getAssessmentQuestions(selectedTopicId),
    enabled: !!selectedTopicId && view === 'quiz',
  });

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['assessmentHistory'],
    queryFn: getAssessmentHistory,
  });

  const submitMutation = useMutation({
    mutationFn: submitAssessment,
    onSuccess: (data) => {
      setResult(data);
      setView('result');
      if (timerRef.current) clearInterval(timerRef.current);
      refetchHistory();
    },
  });

  // Timer
  useEffect(() => {
    if (view === 'quiz' && !isSubmitted && questions.length > 0) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, isSubmitted, questions.length]);

  const handleSelectTopic = (topicId: string, topicName: string) => {
    setSelectedTopicId(topicId);
    setSelectedTopicName(topicName);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowExplanations({});
    setIsSubmitted(false);
    setElapsedSeconds(0);
    setResult(null);
    setView('quiz');
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = currentQuestion ? answers[currentQuestion.id] ?? null : null;

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion || isSubmitted) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    },
    [currentQuestion, isSubmitted]
  );

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1);
  };

  const handleSubmit = () => {
    if (submitMutation.isPending) return;
    const attempts: AssessmentAttempt[] = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: answers[q.id] ?? null,
      isCorrect: answers[q.id] === q.correctOptionId,
      timeSpentSeconds: Math.floor(elapsedSeconds / questions.length),
    }));
    submitMutation.mutate({
      topicId: selectedTopicId,
      topicName: selectedTopicName,
      attempts,
      timeTakenMinutes: Math.ceil(elapsedSeconds / 60),
    });
  };

  const handleRetake = () => {
    setAnswers({});
    setShowExplanations({});
    setIsSubmitted(false);
    setElapsedSeconds(0);
    setCurrentQuestionIndex(0);
    setView('quiz');
    refetchQuestions();
  };

  const answeredCount = Object.keys(answers).length;
  const isAllAnswered = answeredCount === questions.length;
  const progress = questions.length > 0 ? ((answeredCount / questions.length) * 100).toFixed(0) : '0';

  // ── Render: Topics ──
  if (view === 'topics') {
    return (
      <>
        <PageTitle
          title={t('skillAssessment.title')}
          subtitle={t('skillAssessment.subtitle')}
          action={
            <Button variant="secondary" onClick={() => setView('history')}>
              <History size={15} />
              {t('skillAssessment.viewHistory')}
            </Button>
          }
        />

        {isTopicsLoading ? (
          <Loading />
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-600 p-2">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">{t('skillAssessment.chooseTopicTitle')}</p>
                  <p className="mt-1 text-xs text-blue-600">{t('skillAssessment.chooseTopicSubtitle')}</p>
                  <p className="mt-1 text-xs text-blue-500">{t('skillAssessment.passMark')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onSelect={() => handleSelectTopic(topic.id, topic.name)}
                />
              ))}
            </div>

            {history.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-slate-400" />
                  {t('skillAssessment.historyTitle')} — {t('common.viewDetails')}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {history.slice(0, 3).map((r) => (
                    <Card key={r.id} className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradeColor(r.grade)} text-white text-sm font-black`}
                      >
                        {r.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{r.topicName}</p>
                        <p className="text-xs text-slate-500">{r.score}% · {r.correctAnswers}/{r.totalQuestions} correct</p>
                      </div>
                    </Card>
                  ))}
                </div>
                <button
                  onClick={() => setView('history')}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                >
                  {t('skillAssessment.viewHistory')} →
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  }

  // ── Render: History ──
  if (view === 'history') {
    return (
      <>
        <PageTitle title={t('skillAssessment.historyTitle')} />
        <HistoryView history={history} onBack={() => setView('topics')} />
      </>
    );
  }

  // ── Render: Result ──
  if (view === 'result' && result) {
    return (
      <>
        <div className="mb-6">
          <button
            onClick={() => setView('topics')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={16} />
            {t('skillAssessment.backToTopics')}
          </button>
        </div>
        <ResultView
          result={result}
          onRetake={handleRetake}
          onNewTopic={() => setView('topics')}
          questions={questions}
        />
      </>
    );
  }

  // ── Render: Quiz ──
  return (
    <>
      {/* Quiz Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setView('topics')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} />
          {t('skillAssessment.backToTopics')}
        </button>
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <span className="rounded-full bg-slate-100 px-3 py-1">{selectedTopicName}</span>
          {!isSubmitted && (
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {answeredCount}/{questions.length} {t('common.filter').toLowerCase()}
            </span>
          )}
        </div>
      </div>

      {/* Loading questions */}
      {isQuestionsLoading ? (
        <Card>
          <div className="flex flex-col items-center py-12 gap-3 text-slate-500">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm font-medium">{t('skillAssessment.aiGenerating')}</p>
          </div>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500 py-8">{t('common.error')}</p>
        </Card>
      ) : (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Progress bar */}
          {!isSubmitted && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>{progress}% answered</span>
                <span className="font-medium">{isAllAnswered ? '✓ All answered' : `${questions.length - answeredCount} remaining`}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Question dots */}
          {!isSubmitted && (
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[q.id]
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Question */}
          {currentQuestion && (
            <Card>
              <QuizQuestion
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                selectedOptionId={selectedOption}
                onSelect={handleSelectOption}
                showExplanation={showExplanations[currentQuestion.id] ?? false}
                onToggleExplanation={() =>
                  setShowExplanations((prev) => ({
                    ...prev,
                    [currentQuestion.id]: !prev[currentQuestion.id],
                  }))
                }
                elapsedSeconds={elapsedSeconds}
                isSubmitted={isSubmitted}
              />
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft size={15} />
              {t('skillAssessment.prevQuestion')}
            </Button>

            {currentQuestionIndex < questions.length - 1 ? (
              <Button variant="primary" onClick={handleNext}>
                {t('skillAssessment.nextQuestion')}
                <ArrowRight size={15} />
              </Button>
            ) : !isSubmitted ? (
              <Button
                id="submit-assessment-btn"
                variant="primary"
                onClick={handleSubmit}
                disabled={!isAllAnswered || submitMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t('skillAssessment.generating')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    {t('skillAssessment.submitAnswers')}
                  </>
                )}
              </Button>
            ) : null}
          </div>

          {!isAllAnswered && currentQuestionIndex === questions.length - 1 && !isSubmitted && (
            <p className="text-center text-xs text-slate-400">{t('skillAssessment.selectAnswer')}</p>
          )}
        </div>
      )}
    </>
  );
}
