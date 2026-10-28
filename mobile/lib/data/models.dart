import '../core/json.dart';

/// Domain objects read from the backend. Each `fromJson` accepts a few
/// alternative key names so a renamed DTO field degrades to an empty value
/// instead of a crash; the first key in each list is the expected one.

class AppUser {
  AppUser({required this.id, required this.email, required this.name, required this.role, this.avatarUrl});
  final String id;
  final String email;
  final String name;
  final String role; // CANDIDATE, CAREER_CONSULTANT, ADMIN
  final String? avatarUrl;

  bool get isCandidate => role == 'CANDIDATE' || role == 'USER' || role.isEmpty;

  factory AppUser.fromJson(Json j) {
    var role = str(j, ['role', 'roleName', 'userRole']) ?? '';
    final roles = strings(j, ['roles', 'authorities']);
    if (role.isEmpty && roles.isNotEmpty) role = roles.first;
    role = role.toUpperCase().replaceFirst('ROLE_', '');
    final email = str(j, ['email']) ?? '';
    return AppUser(
      id: str(j, ['id', 'userId']) ?? '',
      email: email,
      name: str(j, ['full_name', 'fullName', 'name']) ?? email.split('@').first,
      role: role,
      avatarUrl: str(j, ['avatar_url', 'avatarUrl']),
    );
  }
}

class CareerProfile {
  CareerProfile({this.headline, this.targetPosition, this.skills = const [], this.completion});
  final String? headline;
  final String? targetPosition;
  final List<String> skills;
  final int? completion;

  factory CareerProfile.fromJson(Json j) => CareerProfile(
        headline: str(j, ['current_job_title', 'headline']),
        targetPosition: str(j, ['target_job_title', 'targetPosition']),
        skills: strings(j, ['skills']),
        completion: null,
      );

  /// Rough completion when the backend does not send one.
  int get completionOrGuess {
    if (completion != null) return completion!.clamp(0, 100);
    var filled = 1;
    if (headline != null) filled++;
    if (targetPosition != null) filled++;
    if (skills.isNotEmpty) filled++;
    return (filled / 4 * 100).round();
  }
}

class Job {
  Job({
    required this.id,
    required this.title,
    required this.company,
    this.location,
    this.salary,
    this.skills = const [],
    this.description,
    this.responsibilities = const [],
    this.requirements = const [],
    this.benefits = const [],
    this.postedAt,
    this.deadline,
    this.jobType,
    this.level,
    this.sourceName,
    this.sourceUrl,
  });

  final String id;
  final String title;
  final String company;
  final String? location;
  final String? salary;
  final List<String> skills;
  final String? description;
  final List<String> responsibilities;
  final List<String> requirements;
  final List<String> benefits;
  final DateTime? postedAt;
  final DateTime? deadline;
  final String? jobType;
  final String? level;
  final String? sourceName;
  final String? sourceUrl;

  factory Job.fromJson(Json j) {
    var salary = str(j, ['salary_text', 'salaryText', 'salary']);
    if (salary == null) {
      final min = number(j, ['salaryMin', 'minSalary']);
      final max = number(j, ['salaryMax', 'maxSalary']);
      final cur = str(j, ['salaryCurrency', 'currency']) ?? '';
      if (min != null || max != null) {
        salary = [min, max].whereType<num>().map(_money).join(' – ') + (cur.isEmpty ? '' : ' $cur');
      }
    }
    return Job(
      id: str(j, ['id', 'market_job_id']) ?? '',
      title: str(j, ['job_title', 'title']) ?? '—',
      company: str(j, ['company_name', 'companyName']) ?? '—',
      location: str(j, ['location']),
      salary: salary,
      skills: strings(j, ['skills']),
      description: str(j, ['parsed_description', 'description', 'original_content']),
      responsibilities: strings(j, ['parsed_responsibilities', 'responsibilities']),
      requirements: strings(j, ['parsed_requirements', 'requirements']),
      benefits: strings(j, ['parsed_benefits', 'benefits']),
      postedAt: date(j, ['posted_at', 'collected_at']),
      deadline: date(j, ['valid_through']),
      jobType: str(j, ['employment_type']),
      level: str(j, ['parsed_seniority', 'role_category']),
      sourceName: str(j, ['source_site', 'original_source_site']),
      sourceUrl: str(j, ['source_url', 'original_source_url']),
    );
  }

  String get initial => company.isEmpty || company == '—' ? '?' : company.characters0;
}

String _money(num v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(v % 1000000 == 0 ? 0 : 1)}tr';
  return v.toStringAsFixed(0);
}

extension on String {
  String get characters0 => substring(0, 1).toUpperCase();
}

/// One job inside a matching run.
class JobMatch {
  JobMatch({
    required this.id,
    required this.job,
    required this.score,
    this.matchedSkills = const [],
    this.missingSkills = const [],
    this.explanation,
  });
  final String id;
  final Job job;
  final int score;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final String? explanation;

  factory JobMatch.fromJson(Json j) {
    final jobJson = pick(j, ['job']) is Map ? Json.from(pick(j, ['job']) as Map) : j;
    return JobMatch(
      id: str(j, ['id']) ?? '',
      job: Job.fromJson({...jobJson, 'id': str(j, ['market_job_id', 'job_id']) ?? jobJson['id']}),
      score: percent(number(j, ['final_score', 'llm_rerank_score', 'vector_similarity_score', 'score'])),
      matchedSkills: strings(j, ['strengths_json', 'strengths']),
      missingSkills: strings(j, ['skill_gaps_json', 'skill_gaps']),
      explanation: str(j, ['match_reason_json.reason', 'explanation.reason']),
    );
  }
}

class ResumeEntry {
  ResumeEntry({required this.title, this.subtitle, this.period, this.description});
  final String title;
  final String? subtitle;
  final String? period;
  final String? description;
}

class Resume {
  Resume({
    required this.id,
    required this.name,
    required this.status,
    this.isPrimary = false,
    this.position,
    this.updatedAt,
    this.score,
    this.fullName,
    this.email,
    this.phone,
    this.location,
    this.summary,
    this.skills = const [],
    this.experience = const [],
    this.education = const [],
    this.language,
  });

  final String id;
  final String name;
  final String status; // DRAFT, PROCESSING, NEEDS_REVIEW, READY, ARCHIVED…
  final bool isPrimary;
  final String? position;
  final DateTime? updatedAt;
  final int? score;
  final String? fullName;
  final String? email;
  final String? phone;
  final String? location;
  final String? summary;
  final List<String> skills;
  final List<ResumeEntry> experience;
  final List<ResumeEntry> education;
  final String? language;

  factory Resume.fromJson(Json j) {
    // CV content may be flat or nested under content / parsedData / data.
    Json c = j;
    for (final k in const ['structured_data']) {
      if (j[k] is Map) {
        c = {...Json.from(j[k] as Map), ...j};
        break;
      }
    }
    final s = number(c, ['ats_score', 'overall_score', 'latest_score']);
    return Resume(
      id: str(j, ['id', 'resumeId']) ?? '',
      name: str(j, ['title', 'file_name']) ?? 'CV',
      status: (str(j, ['status']) ?? 'DRAFT').toUpperCase(),
      isPrimary: flag(j, ['is_primary']),
      position: str(c, ['target_job_title', 'headline', 'job_title']),
      updatedAt: date(j, ['updated_at', 'created_at']),
      score: s == null ? null : percent(s),
      fullName: str(c, ['full_name']),
      email: str(c, ['email']),
      phone: str(c, ['phone']),
      location: str(c, ['location']),
      summary: str(c, ['summary']),
      skills: strings(c, ['skills']),
      experience: maps(c, ['experiences', 'experience'])
          .map((e) => ResumeEntry(
                title: str(e, ['job_title', 'role']) ?? '',
                subtitle: str(e, ['company_name']),
                period: _period(e),
                description: str(e, ['description']),
              ))
          .toList(),
      education: maps(c, ['educations', 'education'])
          .map((e) => ResumeEntry(
                title: str(e, ['school_name']) ?? '',
                subtitle: [str(e, ['degree']), str(e, ['major'])]
                    .whereType<String>()
                    .join(' · '),
                period: _period(e),
              ))
          .toList(),
      language: str(c, ['language']),
    );
  }
}

String? _period(Json e) {
  final a = str(e, ['start_date']);
  final b = str(e, ['end_date']);
  final current = flag(e, ['is_current']);
  if (a == null && b == null) return null;
  return '${a ?? ''} – ${current ? 'nay' : (b ?? '')}';
}

class ResumeAnalysis {
  ResumeAnalysis({
    required this.id,
    required this.score,
    this.summary,
    this.strengths = const [],
    this.weaknesses = const [],
    this.suggestions = const [],
    this.createdAt,
  });
  final String id;
  final int score;
  final String? summary;
  final List<String> strengths;
  final List<String> weaknesses;
  final List<String> suggestions;
  final DateTime? createdAt;

  factory ResumeAnalysis.fromJson(Json j) {
    Json r = j;
    if (j['result'] is Map) r = {...Json.from(j['result'] as Map), ...j};
    return ResumeAnalysis(
      id: str(j, ['id']) ?? '',
      score: percent(number(r, ['overall_score', 'ats_score'])),
      summary: str(r, ['summary']),
      strengths: strings(r, ['strengths_json', 'strengths']),
      weaknesses: strings(r, ['issues_json', 'issues']),
      suggestions: strings(r, ['suggestions']),
      createdAt: date(j, ['created_at']),
    );
  }
}

class Consultation {
  Consultation({
    required this.id,
    required this.topic,
    required this.status,
    this.goal,
    this.consultantName,
    this.consultantId,
    this.createdAt,
  });
  final String id;
  final String topic;
  final String status; // PENDING, ASSIGNED, IN_PROGRESS, CLOSED…
  final String? goal;
  final String? consultantName;
  final String? consultantId;
  final DateTime? createdAt;

  bool get isClosed => const ['CLOSED', 'COMPLETED', 'CANCELLED'].contains(status);

  factory Consultation.fromJson(Json j) => Consultation(
        id: str(j, ['id']) ?? '',
        topic: str(j, ['subject', 'request_type']) ?? '—',
        status: (str(j, ['status']) ?? 'PENDING').toUpperCase(),
        goal: str(j, ['request_description']),
        consultantName: str(j, ['consultant_name']),
        consultantId: str(j, ['consultant_user_id']),
        createdAt: date(j, ['created_at']),
      );
}

class ConsultationMessage {
  ConsultationMessage({required this.id, required this.content, required this.senderId, this.senderRole, this.senderName, this.createdAt});
  final String id;
  final String content;
  final String senderId;
  final String? senderRole;
  final String? senderName;
  final DateTime? createdAt;

  factory ConsultationMessage.fromJson(Json j) => ConsultationMessage(
        id: str(j, ['id']) ?? '',
        content: str(j, ['content']) ?? '',
        senderId: str(j, ['sender_user_id']) ?? '',
        senderRole: str(j, ['role'])?.toUpperCase(),
        senderName: str(j, ['full_name']),
        createdAt: date(j, ['sent_at']),
      );
}

class SubscriptionInfo {
  SubscriptionInfo({required this.planName, this.tokenLimit, this.tokensUsed, this.expiresAt});
  final String planName;
  final int? tokenLimit;
  final int? tokensUsed;
  final DateTime? expiresAt;

  /// GET /subscriptions/me → { tier: {...}, quotas: [{feature_code, quota_value}], tokensUsedThisMonth }.
  factory SubscriptionInfo.fromJson(Json j) {
    final quotas = maps(j, ['quotas']);
    final tokens = quotas.where((q) => q['feature_code'] == 'AI_TOTAL_TOKENS').firstOrNull;
    return SubscriptionInfo(
      planName: str(j, ['tier.display_name', 'tier.tier_code']) ?? 'FREE',
      tokenLimit: tokens == null ? null : number(tokens, ['quota_value'])?.round(),
      tokensUsed: number(j, ['tokensUsedThisMonth'])?.round(),
      expiresAt: date(j, ['tier.expires_at']),
    );
  }
}
