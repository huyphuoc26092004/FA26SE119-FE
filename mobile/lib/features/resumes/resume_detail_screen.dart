import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';
import 'resumes_screen.dart';

class ResumeDetailScreen extends ConsumerStatefulWidget {
  const ResumeDetailScreen({super.key, required this.resumeId});
  final String resumeId;
  @override
  ConsumerState<ResumeDetailScreen> createState() => _ResumeDetailScreenState();
}

class _ResumeDetailScreenState extends ConsumerState<ResumeDetailScreen> {
  String? _busy; // which action is running

  CandidateRepository get _repo => ref.read(repositoryProvider);

  Future<void> _run(String key, Future<void> Function() action, {String? done}) async {
    setState(() => _busy = key);
    try {
      await action();
      ref.invalidate(resumeProvider(widget.resumeId));
      ref.invalidate(resumesProvider);
      if (mounted && done != null) toast(context, done);
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  void _confirmArchive() => showActionSheet(
        context,
        title: tr('Xoá CV này?', 'Delete this CV?'),
        body: tr('CV sẽ bị ẩn khỏi danh sách và không dùng để gợi ý việc làm nữa.',
            'The CV is removed from your list and no longer used for job suggestions.'),
        actions: [
          BigButton(
            label: tr('Xoá CV', 'Delete CV'),
            tone: ButtonTone.danger,
            onPressed: () async {
              Navigator.of(context).pop();
              await _run('archive', () => _repo.archiveResume(widget.resumeId));
              if (mounted) Navigator.of(context).pop();
            },
          ),
          BigButton(label: tr('Huỷ', 'Cancel'), tone: ButtonTone.secondary, onPressed: () => Navigator.of(context).pop()),
        ],
      );

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(resumeProvider(widget.resumeId));
    final analyses = ref.watch(analysesProvider(widget.resumeId));
    final latest = analyses.value?.firstOrNull;

    return Scaffold(
      appBar: AppBar(title: const Text('CV')),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: Skeleton()),
        error: (e, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: ErrorBox(error: e, onRetry: () => ref.invalidate(resumeProvider(widget.resumeId))),
        ),
        data: (cv) {
          final contacts = <(IconData, String?)>[
            (Icons.mail_outline, cv.email),
            (Icons.phone_outlined, cv.phone),
            (Icons.place_outlined, cv.location),
          ].where((c) => c.$2 != null && c.$2!.isNotEmpty).toList();

          return ScreenList(
            onRefresh: () async {
              ref.invalidate(resumeProvider(widget.resumeId));
              ref.invalidate(analysesProvider(widget.resumeId));
            },
            children: [
              AppCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    ScoreRing(value: latest?.score, size: 68),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(cv.fullName ?? cv.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500, height: 1.3)),
                        if (cv.fullName != null)
                          Text(cv.name, style: const TextStyle(fontSize: 14, color: AppColors.muted)),
                        const SizedBox(height: 8),
                        Wrap(spacing: 6, runSpacing: 6, children: [
                          if (cv.isPrimary) Tag(tr('CV chính', 'Primary CV'), tone: TagTone.brand),
                          Tag(resumeStatusLabel(cv.status), tone: resumeStatusTone(cv.status)),
                        ]),
                      ]),
                    ),
                  ]),
                  if (contacts.isNotEmpty) ...[
                    const Divider(height: 28),
                    for (final c in contacts)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(children: [
                          Icon(c.$1, size: 15, color: AppColors.subtle),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c.$2!, style: const TextStyle(fontSize: 13))),
                        ]),
                      ),
                  ],
                ]),
              ),
              if (cv.status == 'REVIEW_REQUIRED' || cv.status == 'DRAFT')
                AppCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(
                      tr('Kiểm tra nội dung bên dưới. Khi đã đúng, xác nhận để dùng CV này so khớp việc làm.',
                          'Check the content below. Once it is right, confirm it to use this CV for matching.'),
                      style: const TextStyle(fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 12),
                    BigButton(
                      label: tr('Xác nhận CV', 'Confirm CV'),
                      busy: _busy == 'confirm',
                      onPressed: () => _run('confirm', () => _repo.confirmResume(cv.id),
                          done: tr('CV đã sẵn sàng', 'CV is ready')),
                    ),
                  ]),
                ),
              BigButton(
                label: latest == null ? tr('Phân tích CV', 'Analyse CV') : tr('Phân tích lại', 'Analyse again'),
                busy: _busy == 'analyse',
                onPressed: () => _run('analyse', () async {
                  await _repo.analyse(cv.id);
                  ref.invalidate(analysesProvider(cv.id));
                }),
              ),
              if (!cv.isPrimary && cv.status == 'READY')
                BigButton(
                  label: tr('Đặt làm CV chính', 'Make primary'),
                  tone: ButtonTone.secondary,
                  busy: _busy == 'primary',
                  onPressed: () => _run('primary', () => _repo.setPrimary(cv.id), done: tr('Đã đặt làm CV chính', 'Set as primary CV')),
                ),
              if (latest != null) _AnalysisCard(latest),
              if (cv.summary != null) _Section(tr('Giới thiệu', 'Summary'), [Text(cv.summary!, style: _body)]),
              if (cv.experience.isNotEmpty)
                _Section(tr('Kinh nghiệm', 'Experience'), [for (final e in cv.experience) _Entry(e)]),
              if (cv.education.isNotEmpty)
                _Section(tr('Học vấn', 'Education'), [for (final e in cv.education) _Entry(e)]),
              if (cv.skills.isNotEmpty)
                _Section(tr('Kỹ năng', 'Skills'), [
                  Wrap(spacing: 6, runSpacing: 6, children: [for (final s in cv.skills) Tag(s)]),
                ]),
              BigButton(label: tr('Xoá CV', 'Delete CV'), tone: ButtonTone.danger, busy: _busy == 'archive', onPressed: _confirmArchive),
            ],
          );
        },
      ),
    );
  }
}

const _body = TextStyle(fontSize: 14, height: 1.6, color: Color(0xFF3F4843));

class _Section extends StatelessWidget {
  const _Section(this.title, this.children);
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
          const SizedBox(height: 10),
          ...children,
        ]),
      );
}

class _Entry extends StatelessWidget {
  const _Entry(this.e);
  final ResumeEntry e;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(e.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
          Text([e.subtitle, e.period].where((x) => x != null && x.isNotEmpty).join(' · '),
              style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          if (e.description != null) ...[const SizedBox(height: 4), Text(e.description!, style: _body.copyWith(fontSize: 13))],
        ]),
      );
}

class _AnalysisCard extends StatelessWidget {
  const _AnalysisCard(this.a);
  final ResumeAnalysis a;

  Widget _list(String title, List<String> items, Color dot) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 12),
        Text(title, style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
        const SizedBox(height: 6),
        for (final i in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(width: 6, height: 6, margin: const EdgeInsets.only(top: 8, right: 10), decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
              Expanded(child: Text(i, style: _body)),
            ]),
          ),
      ]);

  @override
  Widget build(BuildContext context) => AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(tr('Kết quả phân tích', 'Analysis'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
            Text(relativeDate(a.createdAt), style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
          ]),
          const SizedBox(height: 10),
          ThinBar(value: a.score),
          if (a.summary != null) ...[const SizedBox(height: 10), Text(a.summary!, style: _body)],
          if (a.strengths.isNotEmpty) _list(tr('Điểm mạnh', 'Strengths'), a.strengths, AppColors.brand),
          if (a.weaknesses.isNotEmpty) _list(tr('Cần cải thiện', 'To improve'), a.weaknesses, AppColors.warning),
        ]),
      );
}
