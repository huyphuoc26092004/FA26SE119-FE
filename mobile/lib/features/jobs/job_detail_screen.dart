import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';
import '../assistant/assistant_screens.dart';
import 'jobs_screen.dart';

class JobDetailScreen extends ConsumerWidget {
  const JobDetailScreen({super.key, required this.jobId});
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(jobProvider(jobId));
    final match = ref.watch(matchesProvider).value?.where((m) => m.job.id == jobId).firstOrNull;
    return Scaffold(
      appBar: AppBar(title: Text(tr('Việc làm', 'Job'))),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: Skeleton()),
        error: (e, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: ErrorBox(error: e, onRetry: () => ref.invalidate(jobProvider(jobId))),
        ),
        data: (job) => _Body(job: job, match: match),
      ),
      bottomNavigationBar: async.hasValue ? _ActionBar(job: async.value!) : null,
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.job, this.match});
  final Job job;
  final JobMatch? match;

  @override
  Widget build(BuildContext context) {
    final facts = <(String, String?)>[
      (tr('Mức lương', 'Salary'), job.salary),
      (tr('Hình thức', 'Type'), _employmentLabel(job.jobType)),
      (tr('Cấp bậc', 'Level'), job.level),
      (tr('Hạn nộp', 'Deadline'),
          job.deadline == null ? null : '${job.deadline!.day}/${job.deadline!.month}/${job.deadline!.year}'),
    ].where((f) => f.$2 != null && f.$2!.isNotEmpty).toList();

    final sections = [
      (tr('Bạn sẽ làm gì', 'What you will do'), job.responsibilities),
      (tr('Yêu cầu', 'Requirements'), job.requirements),
      (tr('Quyền lợi', 'Benefits'), job.benefits),
    ].where((s) => s.$2.isNotEmpty).toList();

    return ScreenList(children: [
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        CompanyBadge(job.initial, size: 56),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(job.title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w500, height: 1.25)),
            const SizedBox(height: 4),
            Text(job.company, style: const TextStyle(fontSize: 14, color: AppColors.muted)),
            const SizedBox(height: 4),
            Text([job.location, relativeDate(job.postedAt)].where((x) => x != null && x.isNotEmpty).join(' · '),
                style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
          ]),
        ),
      ]),
      if (facts.isNotEmpty)
        LayoutBuilder(builder: (context, c) {
          final w = (c.maxWidth - 12) / 2;
          return Wrap(spacing: 12, runSpacing: 12, children: [
            for (final f in facts)
              SizedBox(
                width: w,
                child: AppCard(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(f.$1, style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                    const SizedBox(height: 2),
                    Text(f.$2!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                  ]),
                ),
              ),
          ]);
        }),
      if (match != null)
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              ScoreRing(value: match!.score, size: 64),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(tr('Mức độ phù hợp với bạn', 'How well you fit'),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                  if (match!.explanation != null)
                    Text(match!.explanation!, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                ]),
              ),
            ]),
            if (match!.matchedSkills.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(tr('Bạn đã có', 'You have'), style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final s in match!.matchedSkills) Tag(s, tone: TagTone.brand, icon: Icons.check),
              ]),
            ],
            if (match!.missingSkills.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(tr('Còn thiếu', 'Missing'), style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final s in match!.missingSkills) Tag(s, tone: TagTone.warn),
              ]),
            ],
          ]),
        ),
      _AiTools(job: job),
      if (job.description != null || job.skills.isNotEmpty)
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tr('Mô tả công việc', 'About the job'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            if (job.description != null) ...[
              const SizedBox(height: 8),
              Text(job.description!, style: const TextStyle(fontSize: 14, height: 1.6, color: Color(0xFF3F4843))),
            ],
            if (job.skills.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(spacing: 6, runSpacing: 6, children: [for (final s in job.skills) Tag(s)]),
            ],
          ]),
        ),
      for (var i = 0; i < sections.length; i++) _Collapsible(title: sections[i].$1, items: sections[i].$2, initiallyOpen: i == 0),
    ]);
  }
}

/// AI tools for this job: ATS check of a CV, a learning roadmap for the
/// missing skills, and an assistant chat about the job.
class _AiTools extends ConsumerStatefulWidget {
  const _AiTools({required this.job});
  final Job job;
  @override
  ConsumerState<_AiTools> createState() => _AiToolsState();
}

class _AiToolsState extends ConsumerState<_AiTools> {
  String? _busy; // 'ats' | 'roadmap' | 'chat'
  AtsResult? _ats;
  String? _atsCv;

  Future<Resume?> _pickCv() async {
    final resumes = (await ref.read(resumesProvider.future)).where((r) => r.status == 'READY').toList();
    if (!mounted) return null;
    if (resumes.isEmpty) {
      toast(context, tr('Bạn cần một CV ở trạng thái Sẵn sàng.', 'You need a Ready CV first.'));
      return null;
    }
    if (resumes.length == 1) return resumes.first;
    resumes.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    return showModalBottomSheet<Resume>(
      context: context,
      backgroundColor: AppColors.canvas,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: ListView(shrinkWrap: true, padding: const EdgeInsets.fromLTRB(16, 0, 16, 16), children: [
          Text(tr('Chọn CV', 'Choose a CV'), style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500)),
          const SizedBox(height: 12),
          ListGroup(children: [
            for (final r in resumes)
              ListRowTile(
                icon: Icons.description_outlined,
                title: r.name,
                detail: r.isPrimary ? tr('CV chính', 'Primary CV') : r.position,
                onTap: () => Navigator.of(ctx).pop(r),
              ),
          ]),
        ]),
      ),
    );
  }

  Future<void> _run(String what, Future<void> Function() action) async {
    setState(() => _busy = what);
    try {
      await action();
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _checkAts() async {
    final cv = await _pickCv();
    if (cv == null) return;
    await _run('ats', () async {
      final res = await ref.read(repositoryProvider).ats(widget.job.id, cv.id);
      if (mounted) {
        setState(() {
          _ats = res;
          _atsCv = cv.name;
        });
      }
    });
  }

  Future<void> _roadmap() async {
    final cv = await _pickCv();
    if (cv == null) return;
    await _run('roadmap', () async {
      final r = await ref.read(repositoryProvider).createRoadmap(jobId: widget.job.id, resumeId: cv.id);
      ref.invalidate(roadmapsProvider);
      if (mounted) context.push('/roadmaps/${r.id}');
    });
  }

  Future<void> _chat() => _run('chat', () => startAssistantChat(
        context,
        ref,
        title: tr('Về ${widget.job.title}', 'About ${widget.job.title}'),
        jobId: widget.job.id,
      ));

  Widget _list(String title, List<String> items, {TagTone? tone}) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 12),
        Text(title, style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
        const SizedBox(height: 6),
        if (tone != null)
          Wrap(spacing: 6, runSpacing: 6, children: [for (final s in items) Tag(s, tone: tone)])
        else
          for (final s in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text('• $s', style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF3F4843))),
            ),
      ]);

  @override
  Widget build(BuildContext context) {
    final ats = _ats;
    final slow = tr('AI chạy trên máy chủ, có thể mất vài phút.', 'AI runs on the server and can take a few minutes.');
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(tr('Công cụ AI', 'AI tools'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
        if (_busy != null) ...[
          const SizedBox(height: 4),
          Text(slow, style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
        ],
        if (ats != null) ...[
          const SizedBox(height: 12),
          Row(children: [
            ScoreRing(value: ats.score, size: 56),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('Điểm ATS', 'ATS score'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
                if (_atsCv != null) Text(_atsCv!, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
              ]),
            ),
          ]),
          if (ats.strengths.isNotEmpty) _list(tr('Điểm mạnh', 'Strengths'), ats.strengths),
          if (ats.missingSkills.isNotEmpty) _list(tr('Kỹ năng còn thiếu', 'Missing skills'), ats.missingSkills, tone: TagTone.warn),
          if (ats.suggestions.isNotEmpty) _list(tr('Nên sửa CV', 'Improve your CV'), ats.suggestions),
        ],
        const SizedBox(height: 12),
        BigButton(
          label: ats == null ? tr('Chấm CV theo việc này', 'Score my CV for this job') : tr('Chấm lại', 'Score again'),
          tone: ButtonTone.secondary,
          icon: Icons.fact_check_outlined,
          busy: _busy == 'ats',
          onPressed: _busy == null ? _checkAts : null,
        ),
        const SizedBox(height: 10),
        BigButton(
          label: tr('Tạo lộ trình học kỹ năng còn thiếu', 'Plan the missing skills'),
          tone: ButtonTone.secondary,
          icon: Icons.route_outlined,
          busy: _busy == 'roadmap',
          onPressed: _busy == null ? _roadmap : null,
        ),
        const SizedBox(height: 10),
        BigButton(
          label: tr('Hỏi trợ lý AI về việc này', 'Ask the AI about this job'),
          tone: ButtonTone.secondary,
          icon: Icons.auto_awesome_outlined,
          busy: _busy == 'chat',
          onPressed: _busy == null ? _chat : null,
        ),
      ]),
    );
  }
}

class _Collapsible extends StatelessWidget {
  const _Collapsible({required this.title, required this.items, this.initiallyOpen = false});
  final String title;
  final List<String> items;
  final bool initiallyOpen;

  @override
  Widget build(BuildContext context) => AppCard(
        padding: EdgeInsets.zero,
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            initiallyExpanded: initiallyOpen,
            iconColor: AppColors.muted,
            collapsedIconColor: AppColors.muted,
            tilePadding: const EdgeInsets.symmetric(horizontal: 16),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            title: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            children: [
              for (final item in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      width: 6,
                      height: 6,
                      margin: const EdgeInsets.only(top: 9, right: 10),
                      decoration: const BoxDecoration(color: AppColors.brand, shape: BoxShape.circle),
                    ),
                    Expanded(child: Text(item, style: const TextStyle(fontSize: 14, height: 1.6, color: Color(0xFF3F4843)))),
                  ]),
                ),
            ],
          ),
        ),
      );
}

class _ActionBar extends ConsumerStatefulWidget {
  const _ActionBar({required this.job});
  final Job job;
  @override
  ConsumerState<_ActionBar> createState() => _ActionBarState();
}

class _ActionBarState extends ConsumerState<_ActionBar> {
  bool _busy = false;

  String get _source => widget.job.sourceName ?? 'ITviec / TopCV';

  Future<void> _apply() async {
    Navigator.of(context).pop();
    setState(() => _busy = true);
    try {
      // The backend logs the click and returns the live source link.
      final url = await ref.read(repositoryProvider).externalApply(widget.job.id) ?? widget.job.sourceUrl;
      if (url == null) throw ApiException(tr('Việc làm này không còn link gốc.', 'This job has no source link.'));
      await ref.read(appliedJobsProvider.notifier).add(widget.job.id);
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final saved = ref.watch(savedJobsProvider).contains(widget.job.id);
    final applied = ref.watch(appliedJobsProvider).contains(widget.job.id);
    return Container(
      decoration: const BoxDecoration(color: AppColors.canvas, border: Border(top: BorderSide(color: AppColors.border))),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: SafeArea(
        top: false,
        child: Row(children: [
          SizedBox(
            width: 52,
            height: 52,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                padding: EdgeInsets.zero,
                shape: const CircleBorder(),
                side: BorderSide(color: AppColors.ink.withValues(alpha: .25)),
                backgroundColor: AppColors.surface,
              ),
              onPressed: () => toggleSavedJob(context, ref, widget.job.id),
              child: Icon(saved ? Icons.bookmark : Icons.bookmark_border, color: saved ? AppColors.brand : AppColors.ink),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: BigButton(
              label: applied ? tr('Đã ứng tuyển · Mở lại', 'Applied · Open again') : tr('Ứng tuyển', 'Apply'),
              busy: _busy,
              onPressed: () => showActionSheet(
                context,
                title: tr('Ứng tuyển qua $_source', 'Apply on $_source'),
                body: tr(
                  'Bạn sẽ được chuyển sang $_source để nộp hồ sơ. CCV sẽ đánh dấu việc này là đã ứng tuyển để bạn theo dõi.',
                  'You will continue on $_source to send your application. CCV marks this job as applied so you can track it.',
                ),
                actions: [
                  BigButton(label: tr('Mở $_source', 'Open $_source'), icon: Icons.open_in_new, onPressed: _apply),
                  BigButton(label: tr('Để sau', 'Later'), tone: ButtonTone.secondary, onPressed: () => Navigator.of(context).pop()),
                ],
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

String? _employmentLabel(String? v) => switch (v?.toUpperCase()) {
      null => null,
      'FULL_TIME' => tr('Toàn thời gian', 'Full-time'),
      'PART_TIME' => tr('Bán thời gian', 'Part-time'),
      'CONTRACT' => tr('Hợp đồng', 'Contract'),
      'INTERNSHIP' => tr('Thực tập', 'Internship'),
      'REMOTE' => tr('Từ xa', 'Remote'),
      _ => v,
    };
