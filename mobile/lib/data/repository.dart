import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import '../core/i18n.dart';
import '../core/json.dart';
import '../features/auth/auth_controller.dart';
import 'models.dart';

/// All candidate calls to the backend, grouped like the API list
/// (backend-docs/Danh-sach-API-backend.md).
class CandidateRepository {
  CandidateRepository(this.api);
  final ApiClient api;

  // Profile
  Future<AppUser> me() async => AppUser.fromJson(asMap(await api.get('/me')));
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

/// Saved jobs have no backend API yet, so they stay on the device.
class SavedJobs extends Notifier<Set<String>> {
  static const _key = 'ccv_saved_jobs';

  @override
  Set<String> build() {
    SharedPreferences.getInstance().then((p) => state = (p.getStringList(_key) ?? const []).toSet());
    return {};
  }

  Future<bool> toggle(String id) async {
    final saved = !state.contains(id);
    final next = saved ? {...state, id} : ({...state}..remove(id));
    state = next;
    final p = await SharedPreferences.getInstance();
    await p.setStringList(_key, next.toList());
    return saved;
  }
}

final savedJobsProvider = NotifierProvider<SavedJobs, Set<String>>(SavedJobs.new);

/// Jobs the user opened the external apply link for (kept on device).
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
