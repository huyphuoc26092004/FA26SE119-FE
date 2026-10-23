import type { Job } from '../types/domain';
import type { AssessmentQuestion, LearningResource } from '../types/assessment';
import { getAppliedJobIds, getCandidateProfile, getJobs, getLearningResources, getSavedJobIds } from '../mocks/services/mockService';
import { findSkillTestGroup, skillTestGroups } from '../mocks/data/skillTests';

// =====================================================================
// SKILL JOURNEY
// One flow per job: read the JD → generate skill tests → score them →
// analyse the skill gap → build a learning roadmap. Stored per job in
// localStorage so the candidate can come back to it.
// =====================================================================

export type SkillImportance = 'critical' | 'high' | 'medium';
export type SkillStatus = 'strong' | 'present' | 'gap' | 'missing';
export type Readiness = 'ready' | 'near' | 'developing' | 'early';
export type PhaseKind = 'bridge' | 'strengthen' | 'practice';

export interface JdSkill {
  name: string;
  importance: SkillImportance;
  /** Test group that covers this skill; null when no test exists for it. */
  testId: string | null;
}

export interface SkillTest {
  id: string;
  name: string;
  skills: string[];
  importance: SkillImportance;
  minutes: number;
  questions: AssessmentQuestion[];
}

export interface SkillTestResult {
  testId: string;
  score: number;
  correct: number;
  total: number;
  timeSeconds: number;
  answers: Record<string, string>;
  completedAt: string;
  strongTopics: string[];
  weakTopics: string[];
}

export interface SkillGapRow {
  skill: string;
  importance: SkillImportance;
  requiredLevel: number;
  candidateLevel: number;
  status: SkillStatus;
  source: 'test' | 'profile';
  testId: string | null;
  weeks: number;
}

export interface JourneyGap {
  analyzedAt: string;
  matchScore: number;
  readiness: Readiness;
  weeksToReady: number;
  skills: SkillGapRow[];
}

export interface JourneyPhase {
  id: string;
  kind: PhaseKind;
  startWeek: number;
  endWeek: number;
  skills: string[];
  resources: LearningResource[];
  done: boolean;
}

export interface JourneyRoadmap {
  generatedAt: string;
  totalWeeks: number;
  phases: JourneyPhase[];
}

export interface SkillJourney {
  jobId: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  jdSkills: JdSkill[];
  tests: SkillTest[];
  results: Record<string, SkillTestResult>;
  gap?: JourneyGap;
  roadmap?: JourneyRoadmap;
}

const STORAGE_KEY = 'careerpilot-skill-journeys';
const MAX_TESTS = 5;
const QUESTIONS_PER_TEST = 5;

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

function readAll(): Record<string, SkillJourney> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function writeAll(all: Record<string, SkillJourney>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function saveJourney(journey: SkillJourney): SkillJourney {
  const all = readAll();
  all[journey.jobId] = journey;
  writeAll(all);
  return journey;
}

function requireJourney(jobId: string): SkillJourney {
  const journey = readAll()[jobId];
  if (!journey) throw new Error('Skill journey not found');
  return journey;
}

const importanceRank: Record<SkillImportance, number> = { critical: 3, high: 2, medium: 1 };
const requiredLevelFor: Record<SkillImportance, number> = { critical: 80, high: 70, medium: 60 };

/** Earlier skills in a JD are usually the must-haves. */
function importanceAt(index: number): SkillImportance {
  if (index < 2) return 'critical';
  if (index < 4) return 'high';
  return 'medium';
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export async function getAssessableJobs(): Promise<{ applied: Job[]; saved: Job[]; others: Job[] }> {
  const [ids, savedIds, jobs] = await Promise.all([getAppliedJobIds(), getSavedJobIds(), getJobs({ sortBy: 'match' })]);
  // Saved jobs that were already applied to only show up under applied.
  const saved = savedIds.filter((id) => !ids.includes(id));
  return {
    applied: jobs.filter((j) => ids.includes(j.id)),
    saved: jobs.filter((j) => saved.includes(j.id)),
    others: jobs.filter((j) => !ids.includes(j.id) && !saved.includes(j.id)),
  };
}

// ─── Journey ────────────────────────────────────────────────────────────────

export async function listSkillJourneys(): Promise<SkillJourney[]> {
  await delay(150);
  return Object.values(readAll()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSkillJourney(jobId: string): Promise<SkillJourney | null> {
  await delay(150);
  return readAll()[jobId] ?? null;
}

/** Read the JD, extract skills and generate one test per covered skill group. */
export async function createSkillJourney(job: Job): Promise<SkillJourney> {
  await delay(1600);

  const jdSkills: JdSkill[] = job.skills.map((name, i) => ({
    name,
    importance: importanceAt(i),
    testId: findSkillTestGroup(name)?.id ?? null,
  }));

  const byGroup = new Map<string, { skills: string[]; importance: SkillImportance; order: number }>();
  jdSkills.forEach((s, i) => {
    if (!s.testId) return;
    const entry = byGroup.get(s.testId);
    if (entry) {
      entry.skills.push(s.name);
      if (importanceRank[s.importance] > importanceRank[entry.importance]) entry.importance = s.importance;
    } else {
      byGroup.set(s.testId, { skills: [s.name], importance: s.importance, order: i });
    }
  });

  const tests: SkillTest[] = Array.from(byGroup.entries())
    .sort((a, b) => importanceRank[b[1].importance] - importanceRank[a[1].importance] || a[1].order - b[1].order)
    .slice(0, MAX_TESTS)
    .map(([groupId, info]) => {
      const group = skillTestGroups.find((g) => g.id === groupId)!;
      const questions = group.questions.slice(0, QUESTIONS_PER_TEST);
      return {
        id: groupId,
        name: group.name,
        skills: info.skills,
        importance: info.importance,
        minutes: Math.max(3, Math.round(questions.length * 1.2)),
        questions,
      };
    });

  // Skills whose group did not make the cut are judged from the profile.
  const testIds = new Set(tests.map((t) => t.id));
  const normalisedSkills = jdSkills.map((s) => (s.testId && testIds.has(s.testId) ? s : { ...s, testId: null }));

  return saveJourney({
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    createdAt: new Date().toISOString(),
    jdSkills: normalisedSkills,
    tests,
    results: {},
  });
}

export async function submitSkillTest(params: {
  jobId: string;
  testId: string;
  answers: Record<string, string>;
  timeSeconds: number;
}): Promise<SkillTestResult> {
  await delay(900);
  const journey = requireJourney(params.jobId);
  const test = journey.tests.find((t) => t.id === params.testId);
  if (!test) throw new Error('Skill test not found');

  const correctIds = test.questions.filter((qq) => params.answers[qq.id] === qq.correctOptionId).map((qq) => qq.id);
  const total = test.questions.length;
  const correct = correctIds.length;
  const topicsOf = (right: boolean) => [
    ...new Set(test.questions.filter((qq) => correctIds.includes(qq.id) === right).map((qq) => qq.topic)),
  ];
  const weakTopics = topicsOf(false);
  const strongTopics = topicsOf(true).filter((tp) => !weakTopics.includes(tp));

  const result: SkillTestResult = {
    testId: test.id,
    score: total ? Math.round((correct / total) * 100) : 0,
    correct,
    total,
    timeSeconds: params.timeSeconds,
    answers: params.answers,
    completedAt: new Date().toISOString(),
    strongTopics,
    weakTopics,
  };

  // New results invalidate any earlier analysis.
  saveJourney({ ...journey, results: { ...journey.results, [test.id]: result }, gap: undefined, roadmap: undefined });
  return result;
}

/** Combine test scores (and the profile for untested skills) into a gap analysis. */
export async function analyzeJourneyGap(jobId: string): Promise<JourneyGap> {
  const [profile] = await Promise.all([getCandidateProfile(), delay(1300)]);
  const journey = requireJourney(jobId);
  const profileSkills = (profile?.skills ?? []).map((s) => s.toLowerCase());

  const skills: SkillGapRow[] = journey.jdSkills.map((s) => {
    const requiredLevel = requiredLevelFor[s.importance];
    const result = s.testId ? journey.results[s.testId] : undefined;
    const inProfile = profileSkills.some((p) => p.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(p));
    const candidateLevel = result ? result.score : inProfile ? 55 : 15;
    const status: SkillStatus =
      candidateLevel >= requiredLevel ? 'strong' : candidateLevel >= requiredLevel - 15 ? 'present' : candidateLevel >= 30 ? 'gap' : 'missing';
    const weeks = status === 'strong' ? 0 : status === 'present' ? 1 : status === 'gap' ? 2 : s.importance === 'critical' ? 4 : 3;
    return {
      skill: s.name,
      importance: s.importance,
      requiredLevel,
      candidateLevel,
      status,
      source: result ? 'test' : 'profile',
      testId: result ? s.testId : null,
      weeks,
    };
  });

  const weightTotal = skills.reduce((sum, s) => sum + importanceRank[s.importance], 0) || 1;
  const matchScore = Math.round(
    (skills.reduce((sum, s) => sum + importanceRank[s.importance] * Math.min(1, s.candidateLevel / s.requiredLevel), 0) /
      weightTotal) *
      100
  );
  const readiness: Readiness = matchScore >= 85 ? 'ready' : matchScore >= 70 ? 'near' : matchScore >= 50 ? 'developing' : 'early';

  const gap: JourneyGap = {
    analyzedAt: new Date().toISOString(),
    matchScore,
    readiness,
    weeksToReady: skills.reduce((sum, s) => sum + s.weeks, 0),
    skills,
  };
  saveJourney({ ...journey, gap, roadmap: undefined });
  return gap;
}

/** Turn the gap analysis into phased learning with matching resources. */
export async function generateJourneyRoadmap(jobId: string): Promise<JourneyRoadmap> {
  const [resources] = await Promise.all([getLearningResources(), delay(1100)]);
  const journey = requireJourney(jobId);
  if (!journey.gap) throw new Error('Run the gap analysis first');

  const resourcesFor = (skills: string[]) => {
    const seen = new Set<string>();
    const picked: LearningResource[] = [];
    skills.forEach((skill) => {
      const s = skill.toLowerCase();
      const group = findSkillTestGroup(skill);
      resources
        .filter((r) => {
          const rs = r.skill.toLowerCase();
          return rs.includes(s.split(' ')[0]) || s.includes(rs.split(' ')[0]) || (group && group.keywords.some((k) => rs.includes(k)));
        })
        .slice(0, 2)
        .forEach((r) => {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            picked.push(r);
          }
        });
    });
    return picked.slice(0, 4);
  };

  const rows = journey.gap.skills;
  const bridge = rows.filter((s) => (s.status === 'gap' || s.status === 'missing') && s.importance !== 'medium');
  const strengthen = rows.filter((s) => !bridge.includes(s) && s.status !== 'strong');
  const practiceSkills = rows.filter((s) => s.importance !== 'medium').map((s) => s.skill);

  const plan: { kind: PhaseKind; skills: string[]; weeks: number }[] = [];
  if (bridge.length) plan.push({ kind: 'bridge', skills: bridge.map((s) => s.skill), weeks: bridge.reduce((n, s) => n + s.weeks, 0) });
  if (strengthen.length)
    plan.push({ kind: 'strengthen', skills: strengthen.map((s) => s.skill), weeks: Math.max(1, strengthen.reduce((n, s) => n + s.weeks, 0)) });
  plan.push({ kind: 'practice', skills: practiceSkills, weeks: 2 });

  let week = 1;
  const phases: JourneyPhase[] = plan.map((p, i) => {
    const phase: JourneyPhase = {
      id: `phase-${i + 1}`,
      kind: p.kind,
      startWeek: week,
      endWeek: week + p.weeks - 1,
      skills: p.skills,
      resources: resourcesFor(p.skills),
      done: false,
    };
    week += p.weeks;
    return phase;
  });

  const roadmap: JourneyRoadmap = { generatedAt: new Date().toISOString(), totalWeeks: week - 1, phases };
  saveJourney({ ...journey, roadmap });
  return roadmap;
}

export async function togglePhaseDone(jobId: string, phaseId: string): Promise<JourneyRoadmap> {
  await delay(120);
  const journey = requireJourney(jobId);
  if (!journey.roadmap) throw new Error('No roadmap yet');
  const roadmap = {
    ...journey.roadmap,
    phases: journey.roadmap.phases.map((p) => (p.id === phaseId ? { ...p, done: !p.done } : p)),
  };
  saveJourney({ ...journey, roadmap });
  return roadmap;
}

export async function resetSkillJourney(jobId: string): Promise<void> {
  await delay(150);
  const all = readAll();
  delete all[jobId];
  writeAll(all);
}
