import '../core/json.dart';

/// Domain objects read from the backend. Each `fromJson` accepts a few
/// alternative key names so a renamed DTO field degrades to an empty value
/// instead of a crash; the first key in each list is the expected one.

class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.avatarUrl,
    this.githubUrl,
    this.preferredLanguage,
    this.authProvider,
  });
  final String id;
  final String email;
  final String name;
  final String role; // CANDIDATE, CAREER_CONSULTANT, ADMIN
  final String? avatarUrl;
  final String? githubUrl;
  final String? preferredLanguage; // vi | en
  final String? authProvider; // EMAIL | GOOGLE

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
      githubUrl: str(j, ['github_url', 'githubUrl']),
      preferredLanguage: str(j, ['preferred_language', 'preferredLanguage']),
      authProvider: str(j, ['auth_provider', 'authProvider']),
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

/// GET /subscriptions/tiers: active plans with their monthly AI token quota.
class PlanTier {
  PlanTier({required this.id, required this.code, required this.name, required this.monthlyPrice, this.currency = 'VND', this.tokenQuota});
  final String id;
  final String code;
  final String name;
  final num monthlyPrice;
  final String currency;
  final int? tokenQuota;

  factory PlanTier.fromJson(Json j) {
    final tokens = maps(j, ['quotas']).where((q) => q['feature_code'] == 'AI_TOTAL_TOKENS').firstOrNull;
    final code = str(j, ['tier_code']) ?? '';
    return PlanTier(
      id: str(j, ['id']) ?? '',
      code: code,
      name: str(j, ['display_name']) ?? code,
      monthlyPrice: number(j, ['price_monthly']) ?? 0,
      currency: str(j, ['currency']) ?? 'VND',
      tokenQuota: tokens == null ? null : number(tokens, ['quota_value'])?.round(),
    );
  }
}

/// A personal notification (GET /notifications).
class AppNotification {
  AppNotification({required this.id, required this.title, required this.content, required this.isRead, this.type, this.referenceType, this.referenceId, this.createdAt});
  final String id;
  final String title;
  final String content;
  final bool isRead;
  final String? type;
  final String? referenceType;
  final String? referenceId;
  final DateTime? createdAt;

  factory AppNotification.fromJson(Json j) => AppNotification(
        id: str(j, ['id']) ?? '',
        title: str(j, ['title']) ?? '',
        content: str(j, ['content']) ?? '',
        isRead: flag(j, ['is_read']),
        type: str(j, ['type']),
        referenceType: str(j, ['reference_type'])?.toUpperCase(),
        referenceId: str(j, ['reference_id']),
        createdAt: date(j, ['created_at']),
      );
}

/// A signed-in device (refresh token still valid), GET /me/sessions.
class LoginSession {
  LoginSession({required this.id, this.createdAt, this.expiresAt});
  final String id;
  final DateTime? createdAt;
  final DateTime? expiresAt;

  factory LoginSession.fromJson(Json j) =>
      LoginSession(id: str(j, ['id']) ?? '', createdAt: date(j, ['created_at']), expiresAt: date(j, ['expires_at']));
}

class TicketMessage {
  TicketMessage({required this.id, required this.content, required this.senderId, this.senderName, this.createdAt});
  final String id;
  final String content;
  final String senderId;
  final String? senderName;
  final DateTime? createdAt;
}

/// Support ticket; the detail call also returns its `messages`.
class SupportTicket {
  SupportTicket({
    required this.id,
    required this.subject,
    required this.status,
    required this.ownerId,
    this.category,
    this.description,
    this.createdAt,
    this.messages = const [],
  });
  final String id;
  final String subject;
  final String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  final String ownerId;
  final String? category;
  final String? description;
  final DateTime? createdAt;
  final List<TicketMessage> messages;

  bool get isClosed => status == 'CLOSED' || status == 'RESOLVED';

  factory SupportTicket.fromJson(Json j) => SupportTicket(
        id: str(j, ['id']) ?? '',
        subject: str(j, ['subject']) ?? '—',
        status: (str(j, ['status']) ?? 'OPEN').toUpperCase(),
        ownerId: str(j, ['user_id']) ?? '',
        category: str(j, ['category']),
        description: str(j, ['description']),
        createdAt: date(j, ['created_at']),
        messages: maps(j, ['messages'])
            .map((m) => TicketMessage(
                  id: str(m, ['id']) ?? '',
                  content: str(m, ['content']) ?? '',
                  senderId: str(m, ['sender_user_id']) ?? '',
                  senderName: str(m, ['full_name']),
                  createdAt: date(m, ['created_at']),
                ))
            .toList(),
      );
}

class ChatSource {
  ChatSource({required this.label, this.url});
  final String label;
  final String? url;
}

class ChatMessage {
  ChatMessage({required this.id, required this.text, required this.fromUser, this.createdAt, this.sources = const []});
  final String id;
  final String text;
  final bool fromUser;
  final DateTime? createdAt;
  final List<ChatSource> sources;

  factory ChatMessage.fromJson(Json j, [List<Json> sources = const []]) => ChatMessage(
        id: str(j, ['id']) ?? '',
        text: str(j, ['message_text', 'content']) ?? '',
        fromUser: str(j, ['sender_type'])?.toUpperCase() == 'USER',
        createdAt: date(j, ['created_at']),
        sources: [...maps(j, ['sources']), ...sources]
            .where((s) => str(s, ['source_url', 'source_label']) != null)
            .map((s) => ChatSource(label: str(s, ['source_label', 'source_url'])!, url: str(s, ['source_url'])))
            .toList(),
      );
}

/// AI career assistant conversation (/assistant/conversations).
class ChatConversation {
  ChatConversation({required this.id, required this.title, required this.status, this.jobId, this.resumeId, this.updatedAt, this.messages = const []});
  final String id;
  final String title;
  final String status; // ACTIVE, ARCHIVED, CLOSED
  final String? jobId;
  final String? resumeId;
  final DateTime? updatedAt;
  final List<ChatMessage> messages;

  factory ChatConversation.fromJson(Json j) {
    final sources = maps(j, ['sources']);
    return ChatConversation(
      id: str(j, ['id']) ?? '',
      title: str(j, ['title']) ?? 'Trợ lý nghề nghiệp',
      status: (str(j, ['status']) ?? 'ACTIVE').toUpperCase(),
      jobId: str(j, ['related_job_id']),
      resumeId: str(j, ['related_resume_id']),
      updatedAt: date(j, ['last_message_at', 'updated_at', 'created_at']),
      messages: maps(j, ['messages'])
          .map((m) => ChatMessage.fromJson(m, sources.where((s) => s['message_id'] == m['id']).toList()))
          .toList(),
    );
  }
}

/// POST /jobs/{id}/ats: one CV scored against one job description.
class AtsResult {
  AtsResult({required this.score, this.strengths = const [], this.missingSkills = const [], this.suggestions = const [], this.createdAt});
  final int score;
  final List<String> strengths;
  final List<String> missingSkills;
  final List<String> suggestions;
  final DateTime? createdAt;

  factory AtsResult.fromJson(Json j) => AtsResult(
        score: percent(number(j, ['ats_score', 'ats_report.overall_score'])),
        strengths: strings(j, ['strengths_json', 'ats_report.strengths']),
        missingSkills: strings(j, ['missing_skills_json', 'ats_report.missing_skills']),
        suggestions: strings(j, ['improvement_suggestions_json', 'ats_report.suggestions']),
        createdAt: date(j, ['created_at']),
      );
}

class LearningResource {
  LearningResource({required this.title, this.url, this.provider});
  final String title;
  final String? url;
  final String? provider;
}

class RoadmapNode {
  RoadmapNode({required this.id, required this.skill, required this.status, this.description, this.hours, this.order = 0, this.resources = const []});
  final String id;
  final String skill;
  final String status; // not_started, in_progress, completed
  final String? description;
  final num? hours;
  final num order;
  final List<LearningResource> resources;
}

/// Learning roadmap for the skills a job needs (/roadmaps).
class Roadmap {
  Roadmap({required this.id, required this.title, required this.progress, this.jobId, this.totalHours, this.createdAt, this.outdated = false, this.nodes = const []});
  final String id;
  final String title;
  final int progress;
  final String? jobId;
  final num? totalHours;
  final DateTime? createdAt;
  final bool outdated;
  final List<RoadmapNode> nodes;

  factory Roadmap.fromJson(Json j) {
    final nodes = maps(j, ['nodes'])
        .map((n) {
          final status = str(n, ['status'])?.toLowerCase();
          return RoadmapNode(
            id: str(n, ['id']) ?? '',
            skill: str(n, ['skill_name']) ?? '—',
            status: status == 'in_progress' || status == 'completed' ? status! : 'not_started',
            description: str(n, ['description']),
            hours: number(n, ['estimated_hours']),
            order: number(n, ['sequence_order']) ?? 0,
            resources: maps(n, ['resources'])
                .map((r) => LearningResource(
                      title: str(r, ['title', 'course_title', 'source_label', 'url']) ?? '—',
                      url: str(r, ['url', 'source_url', 'course_url']),
                      provider: str(r, ['provider', 'platform']),
                    ))
                .toList(),
          );
        })
        .toList()
      ..sort((a, b) => a.order.compareTo(b.order));
    return Roadmap(
      id: str(j, ['id']) ?? '',
      title: str(j, ['title']) ?? 'Lộ trình học',
      progress: (number(j, ['progress_percent']) ?? 0).round().clamp(0, 100),
      jobId: str(j, ['market_job_id']),
      totalHours: number(j, ['estimated_total_hours']),
      createdAt: date(j, ['created_at']),
      outdated: flag(j, ['is_outdated']),
      nodes: nodes,
    );
  }
}
