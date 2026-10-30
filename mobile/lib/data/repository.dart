import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import '../core/i18n.dart';
import '../core/json.dart';
import '../features/auth/auth_controller.dart';
import 'models.dart';

/// AI calls run on the self-hosted Ollama and can take minutes
/// (the backend allows up to AI_REQUEST_TIMEOUT=PT15M).
const aiTimeout = Duration(minutes: 16);

/// All candidate calls to the backend, grouped like the API list
/// (backend-docs/Danh-sach-API-backend.md).
class CandidateRepository {
  CandidateRepository(this.api);
  final ApiClient api;

  // Profile
  Future<AppUser> me() async => AppUser.fromJson(asMap(await api.get('/me')));

  /// PUT /me replaces every field, so pass the current values you keep.
  Future<AppUser> updateMe({required String fullName, String? githubUrl, String? avatarUrl, String? language}) async =>
      AppUser.fromJson(asMap(await api.put('/me', data: {
        'fullName': fullName.trim(),
        'githubUrl': (githubUrl?.trim().isEmpty ?? true) ? null : githubUrl!.trim(),
        'avatarUrl': (avatarUrl?.trim().isEmpty ?? true) ? null : avatarUrl!.trim(),
        'preferredLanguage': language ?? (AppLanguage.vi.value ? 'vi' : 'en'),
      })));

  Future<void> changePassword(String current, String next) =>
      api.put('/me/password', data: {'currentPassword': current, 'newPassword': next});

  Future<List<LoginSession>> sessions() async =>
      asList(await api.get('/me/sessions')).map(LoginSession.fromJson).toList();
  Future<void> revokeSession(String id) => api.delete('/me/sessions/$id');

  /// Soft-deletes the signed-in account.
  Future<void> deleteAccount() => api.delete('/me');
  Future<CareerProfile> careerProfile() async =>
      CareerProfile.fromJson(asMap(await api.get('/me/career-profile')));

  // Jobs
  Future<List<Job>> jobs({String? keyword, int offset = 0, int limit = 50}) async {
    final res = await api.get('/jobs', query: {
      if (keyword != null && keyword.isNotEmpty) 'q': keyword,
      'limit': limit,
      'offset': offset,
    });
    return asList(res).map(Job.fromJson).toList();
  }

  Future<Job> job(String id) async => Job.fromJson(asMap(await api.get('/jobs/$id')));

  // Saved jobs (wishlist)
  Future<Set<String>> savedJobIds() async =>
      asList(await api.get('/saved-jobs/ids')).map((r) => str(r, ['job_id'])).whereType<String>().toSet();
  /// Newest first; each row has the GET /jobs columns plus `saved_at`.
  Future<List<Job>> savedJobs() async =>
      asList(await api.get('/saved-jobs', query: {'limit': 100, 'offset': 0})).map(Job.fromJson).toList();
  Future<void> saveJob(String id) => api.put('/jobs/$id/saved');
  Future<void> unsaveJob(String id) => api.delete('/jobs/$id/saved');

  /// ATS check of one CV against this job's description.
  Future<AtsResult> ats(String jobId, String resumeId) async =>
      AtsResult.fromJson(asMap(await api.post('/jobs/$jobId/ats', data: {'resumeId': resumeId}, timeout: aiTimeout)));

  /// Records the click and returns the original ITviec/TopCV link.
  Future<String?> externalApply(String jobId) async {
    final body = asMap(await api.post('/jobs/$jobId/external-apply', data: {}));
    return str(body, ['target_url']);
  }

  // Matching
  Future<List<JobMatch>> latestMatches() async {
    final runs = asList(await api.get('/matching', query: {'limit': 1}));
    if (runs.isEmpty) return const [];
    final id = str(runs.first, ['id']);
    if (id == null) return const [];
    return _results(await api.get('/matching/$id'));
  }

  /// basis: ALL_CVS (every READY CV), SELECTED_CV (with resumeIds) or CAREER_PROFILE.
  Future<List<JobMatch>> runMatching({String basis = 'ALL_CVS', List<String>? resumeIds}) async =>
      _results(await api.post('/matching', data: {
        'basis': basis,
        'resumeIds': ?resumeIds,
        'limit': 20,
      }));

  List<JobMatch> _results(dynamic res) {
    final body = asMap(res);
    return maps(body, ['results']).map(JobMatch.fromJson).toList()
      ..sort((a, b) => b.score.compareTo(a.score));
  }

  // Resumes
  Future<List<Resume>> resumes() async => asList(await api.get('/resumes')).map(Resume.fromJson).toList();
  Future<Resume> resume(String id) async => Resume.fromJson(asMap(await api.get('/resumes/$id')));
  /// Multipart upload of a PDF/DOCX/TXT; the backend extracts the content
  /// and returns the new resume (status REVIEW_REQUIRED).
  Future<Resume> upload({required List<int> bytes, required String fileName, String? title}) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
      if (title != null && title.isNotEmpty) 'title': title,
      'language': AppLanguage.vi.value ? 'vi' : 'en',
    });
    return Resume.fromJson(asMap(await api.post('/resumes/upload', data: form)));
  }

  /// Marks an extracted CV as correct so it becomes READY.
  Future<void> confirmResume(String id) => api.post('/resumes/$id/confirm');

  Future<void> setPrimary(String id) => api.post('/resumes/$id/primary');
  Future<void> archiveResume(String id) => api.delete('/resumes/$id');

  Future<List<ResumeAnalysis>> analyses(String resumeId) async =>
      asList(await api.get('/resumes/$resumeId/analyses')).map(ResumeAnalysis.fromJson).toList()
        ..sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));

  Future<ResumeAnalysis> analyse(String resumeId) async =>
      ResumeAnalysis.fromJson(asMap(await api.post('/resumes/$resumeId/analyses')));

  // Consultations
  Future<List<Consultation>> consultations() async =>
      asList(await api.get('/consultations')).map(Consultation.fromJson).toList()
        ..sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));

  Future<Consultation> consultation(String id) async =>
      Consultation.fromJson(asMap(await api.get('/consultations/$id')));

  Future<Consultation> createConsultation({required String subject, String? requestType, required String description}) async =>
      Consultation.fromJson(asMap(await api.post('/consultations', data: {
        'subject': subject,
        'requestType': ?requestType,
        'description': description,
      })));

  Future<List<ConsultationMessage>> messages(String id) async =>
      asList(await api.get('/consultations/$id/messages', query: {'limit': 100})).map(ConsultationMessage.fromJson).toList()
        ..sort((a, b) => (a.createdAt ?? DateTime(0)).compareTo(b.createdAt ?? DateTime(0)));

  Future<void> sendMessage(String id, String content) =>
      api.post('/consultations/$id/messages', data: {'content': content});

  Future<void> closeConsultation(String id) => api.post('/consultations/$id/close');

  // Plan
  Future<SubscriptionInfo> subscription() async =>
      SubscriptionInfo.fromJson(asMap(await api.get('/subscriptions/me')));
  Future<List<PlanTier>> tiers() async =>
      asList(await api.get('/subscriptions/tiers')).map(PlanTier.fromJson).toList()
        ..sort((a, b) => a.monthlyPrice.compareTo(b.monthlyPrice));

  // Notifications
  Future<List<AppNotification>> notifications() async =>
      asList(await api.get('/notifications')).map(AppNotification.fromJson).toList();
  Future<void> markNotificationRead(String id) => api.patch('/notifications/$id/read');
  Future<void> markAllNotificationsRead() => api.post('/notifications/read-all');

  // AI career assistant
  Future<List<ChatConversation>> conversations() async =>
      asList(await api.get('/assistant/conversations'))
          .map(ChatConversation.fromJson)
          .where((c) => c.status == 'ACTIVE')
          .toList()
        ..sort((a, b) => (b.updatedAt ?? DateTime(0)).compareTo(a.updatedAt ?? DateTime(0)));

  Future<ChatConversation> conversation(String id) async =>
      ChatConversation.fromJson(asMap(await api.get('/assistant/conversations/$id')));

  /// The CV / job attached here is the context the backend gives the AI
  /// for the whole conversation.
  Future<ChatConversation> createConversation({String? title, String? jobId, String? resumeId}) async =>
      ChatConversation.fromJson(asMap(await api.post('/assistant/conversations', data: {
        'title': ?title,
        'context_type': jobId != null ? 'job' : resumeId != null ? 'resume' : 'general',
        'related_job_id': ?jobId,
        'related_resume_id': ?resumeId,
      })));

  static final _learningQuestion = RegExp(r'khóa học|khoá học|học|tài liệu|lộ trình|course|learn|tutorial|roadmap', caseSensitive: false);

  /// Returns the assistant's reply. Course retrieval (RAG) needs embeddings,
  /// so it is only asked for on learning questions, like the web app.
  Future<ChatMessage> ask(String conversationId, String text) async => ChatMessage.fromJson(asMap(await api.post(
        '/assistant/conversations/$conversationId/messages',
        data: {'message': text, 'retrieve': _learningQuestion.hasMatch(text)},
        timeout: aiTimeout,
      )));

  /// Archives the conversation (history is kept on the server).
  Future<void> deleteConversation(String id) => api.delete('/assistant/conversations/$id');

  Future<void> rateAnswer(String messageId, bool helpful) => api.post('/assistant/messages/$messageId/feedback',
      data: {'is_helpful': helpful, 'rating': helpful ? 5 : 1});

  // Learning roadmaps
  Future<List<Roadmap>> roadmaps() async => asList(await api.get('/roadmaps')).map(Roadmap.fromJson).toList()
    ..sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
  Future<Roadmap> roadmap(String id) async => Roadmap.fromJson(asMap(await api.get('/roadmaps/$id')));

  /// Plans the required skills of a job that the CV does not show yet.
  Future<Roadmap> createRoadmap({required String jobId, String? resumeId}) async =>
      Roadmap.fromJson(asMap(await api.post('/roadmaps', data: {'jobId': jobId, 'resumeId': ?resumeId}, timeout: aiTimeout)));

  Future<Roadmap> setNodeStatus(String roadmapId, String nodeId, String status) async =>
      Roadmap.fromJson(asMap(await api.patch('/roadmaps/$roadmapId/nodes/$nodeId', data: {'status': status})));

  // Support tickets
  Future<List<SupportTicket>> tickets() async =>
      asList(await api.get('/support/tickets')).map(SupportTicket.fromJson).toList()
        ..sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
  Future<SupportTicket> ticket(String id) async => SupportTicket.fromJson(asMap(await api.get('/support/tickets/$id')));
  Future<SupportTicket> createTicket({required String subject, required String category, required String description}) async =>
      SupportTicket.fromJson(asMap(await api.post('/support/tickets', data: {
        'subject': subject.trim(),
        'category': category,
        'description': description.trim(),
      })));
  Future<void> replyTicket(String id, String content) =>
      api.post('/support/tickets/$id/messages', data: {'content': content.trim()});
}

final repositoryProvider = Provider<CandidateRepository>(
  (ref) => CandidateRepository(ref.watch(apiClientProvider)),
);

final careerProfileProvider = FutureProvider.autoDispose<CareerProfile>(
  (ref) => ref.watch(repositoryProvider).careerProfile(),
);
final jobsProvider = FutureProvider.autoDispose.family<List<Job>, String>(
  (ref, keyword) => ref.watch(repositoryProvider).jobs(keyword: keyword),
);
final jobProvider = FutureProvider.autoDispose.family<Job, String>(
  (ref, id) => ref.watch(repositoryProvider).job(id),
);
final matchesProvider = FutureProvider.autoDispose<List<JobMatch>>(
  (ref) => ref.watch(repositoryProvider).latestMatches(),
);
final resumesProvider = FutureProvider.autoDispose<List<Resume>>(
  (ref) => ref.watch(repositoryProvider).resumes(),
);
final resumeProvider = FutureProvider.autoDispose.family<Resume, String>(
  (ref, id) => ref.watch(repositoryProvider).resume(id),
);
final analysesProvider = FutureProvider.autoDispose.family<List<ResumeAnalysis>, String>(
  (ref, id) => ref.watch(repositoryProvider).analyses(id),
);
final consultationsProvider = FutureProvider.autoDispose<List<Consultation>>(
  (ref) => ref.watch(repositoryProvider).consultations(),
);
final consultationProvider = FutureProvider.autoDispose.family<Consultation, String>(
  (ref, id) => ref.watch(repositoryProvider).consultation(id),
);
final messagesProvider = FutureProvider.autoDispose.family<List<ConsultationMessage>, String>(
  (ref, id) => ref.watch(repositoryProvider).messages(id),
);
final subscriptionProvider = FutureProvider.autoDispose<SubscriptionInfo>(
  (ref) => ref.watch(repositoryProvider).subscription(),
);
final tiersProvider = FutureProvider.autoDispose<List<PlanTier>>(
  (ref) => ref.watch(repositoryProvider).tiers(),
);
final savedJobListProvider = FutureProvider.autoDispose<List<Job>>(
  (ref) => ref.watch(repositoryProvider).savedJobs(),
);
final notificationsProvider = FutureProvider.autoDispose<List<AppNotification>>(
  (ref) => ref.watch(repositoryProvider).notifications(),
);
final sessionsProvider = FutureProvider.autoDispose<List<LoginSession>>(
  (ref) => ref.watch(repositoryProvider).sessions(),
);
final conversationsProvider = FutureProvider.autoDispose<List<ChatConversation>>(
  (ref) => ref.watch(repositoryProvider).conversations(),
);
final conversationProvider = FutureProvider.autoDispose.family<ChatConversation, String>(
  (ref, id) => ref.watch(repositoryProvider).conversation(id),
);
final roadmapsProvider = FutureProvider.autoDispose<List<Roadmap>>(
  (ref) => ref.watch(repositoryProvider).roadmaps(),
);
final roadmapProvider = FutureProvider.autoDispose.family<Roadmap, String>(
  (ref, id) => ref.watch(repositoryProvider).roadmap(id),
);
final ticketsProvider = FutureProvider.autoDispose<List<SupportTicket>>(
  (ref) => ref.watch(repositoryProvider).tickets(),
);
final ticketProvider = FutureProvider.autoDispose.family<SupportTicket, String>(
  (ref, id) => ref.watch(repositoryProvider).ticket(id),
);

/// Ids of the jobs in the wishlist (GET /saved-jobs/ids), updated
/// optimistically when the user taps the bookmark.
class SavedJobs extends Notifier<Set<String>> {
  CandidateRepository get _repo => ref.read(repositoryProvider);

  @override
  Set<String> build() {
    // Reload when the signed-in user changes.
    final signedIn = ref.watch(authProvider.select((a) => a.user?.id));
    if (signedIn != null) _repo.savedJobIds().then((ids) => state = ids).catchError((_) => state);
    return {};
  }

  Future<bool> toggle(String id) async {
    final before = state;
    final saved = !before.contains(id);
    state = saved ? {...before, id} : ({...before}..remove(id));
    try {
      saved ? await _repo.saveJob(id) : await _repo.unsaveJob(id);
      ref.invalidate(savedJobListProvider);
      return saved;
    } catch (_) {
      state = before;
      rethrow;
    }
  }
}

final savedJobsProvider = NotifierProvider<SavedJobs, Set<String>>(SavedJobs.new);

/// Jobs the user opened the external apply link for. The backend logs the
/// click but has no API to read it back yet, so the list stays on device.
class AppliedJobs extends Notifier<Set<String>> {
  static const _key = 'ccv_applied_jobs';

  @override
  Set<String> build() {
    SharedPreferences.getInstance().then((p) => state = (p.getStringList(_key) ?? const []).toSet());
    return {};
  }

  Future<void> add(String id) async {
    state = {...state, id};
    final p = await SharedPreferences.getInstance();
    await p.setStringList(_key, state.toList());
  }
}

final appliedJobsProvider = NotifierProvider<AppliedJobs, Set<String>>(AppliedJobs.new);
