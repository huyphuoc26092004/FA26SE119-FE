import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
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
  const JobDetailScreen({super.key, required this.jobId, this.resumeId, this.careerProfile = false});
  final String jobId;
  final String? resumeId;
  final bool careerProfile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(jobProvider(jobId));
    final fit = jobFitProvider((jobId: jobId, resumeId: resumeId, careerProfile: careerProfile));
    final match = ref.watch(fit);
    return Scaffold(
      appBar: AppBar(title: Text(tr('Việc làm', 'Job'))),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: Skeleton()),
        error: (e, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: ErrorBox(error: e, onRetry: () => ref.invalidate(jobProvider(jobId))),
        ),
        data: (job) => _Body(job: job, match: match, retryMatch: () => ref.invalidate(fit)),
      ),
      bottomNavigationBar: async.hasValue ? _ActionBar(job: async.value!, resumeId: resumeId) : null,
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.job, required this.match, required this.retryMatch});
  final Job job;
  final AsyncValue<JobMatch?> match;
  final VoidCallback retryMatch;

  @override
  Widget build(BuildContext context) {
    final detail = match.value;
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
      if (match.isLoading) const Skeleton(),
      if (match.hasError) ErrorBox(error: match.error!, onRetry: retryMatch),
      if (detail != null)
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              ScoreRing(value: detail.scoreAvailable ? detail.score : null, size: 64),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(tr('Mức độ phù hợp với bạn', 'How well you fit'),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                  if (detail.explanation != null)
                    Text(detail.explanation!, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                ]),
              ),
            ]),
            if (detail.matchedSkills.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(tr('Bạn đã có', 'You have'), style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final s in detail.matchedSkills) Tag(s, tone: TagTone.brand, icon: Icons.check),
              ]),
            ],
            if (detail.missingSkills.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(tr('Còn thiếu', 'Missing'), style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final s in detail.missingSkills) Tag(s, tone: TagTone.warn),
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

class _AiTools extends ConsumerStatefulWidget {
  const _AiTools({required this.job});
  final Job job;
  @override
  ConsumerState<_AiTools> createState() => _AiToolsState();
}

class _AiToolsState extends ConsumerState<_AiTools> {
  String? _busy;
  AtsResult? _ats;
  String? _atsCv;
  SalaryEstimate? _salary;

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
    if (_busy != null) return;
    setState(() => _busy = what);
    try {
      await action();
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _checkAts() => _run('ats', () async {
    final cv = await _pickCv();
    if (cv == null || !mounted) return;
    final res = await ref.read(repositoryProvider).ats(widget.job.id, cv.id);
    if (mounted) {
      setState(() {
        _ats = res;
        _atsCv = cv.name;
      });
    }
  });

  Future<void> _roadmap() => _run('roadmap', () async {
    final cv = await _pickCv();
    if (cv == null || !mounted) return;
    final r = await ref.read(repositoryProvider).createRoadmap(jobId: widget.job.id, resumeId: cv.id);
    if (!mounted) return;
    ref.invalidate(roadmapsProvider);
    context.push('/roadmaps/${r.id}');
  });

  Future<void> _estimateSalary() => _run('salary', () async {
    final estimate = await ref.read(repositoryProvider).estimateJobSalary(widget.job.id);
    if (mounted) setState(() => _salary = estimate);
  });

  Future<void> _tailorResume() => _run('resume', () async {
    final cv = await _pickCv();
    if (cv == null || !mounted) return;
    final id = await ref.read(repositoryProvider).createTargetedResume(widget.job, cv.id);
    if (!mounted) return;
    ref.invalidate(resumesProvider);
    context.push('/resumes/$id/edit');
  });

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
    final salary = _salary;
    final money = NumberFormat.decimalPattern(tr('vi_VN', 'en_US'));
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
        if (salary != null) ...[
          Text('${money.format(salary.min.round())} – ${money.format(salary.max.round())} ${salary.currency}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
          if (salary.reasoning.isNotEmpty)
            _list(tr('Cơ sở ước lượng', 'Reasoning'), salary.reasoning.take(4).toList()),
          const SizedBox(height: 10),
        ],
        BigButton(
          label: tr('Ước lượng lương', 'Estimate salary'),
          tone: ButtonTone.secondary,
          busy: _busy == 'salary',
          onPressed: _busy == null ? _estimateSalary : null,
        ),
        const SizedBox(height: 10),
        BigButton(
          label: tr('Tạo CV theo việc này', 'Tailor a CV for this job'),
          tone: ButtonTone.secondary,
          busy: _busy == 'resume',
          onPressed: _busy == null ? _tailorResume : null,
        ),
        const SizedBox(height: 10),
        BigButton(
          label: tr('Hỗ trợ ứng tuyển', 'Application help'),
          tone: ButtonTone.secondary,
          onPressed: _busy == null ? () => context.push('/applications?jobId=${Uri.encodeQueryComponent(widget.job.id)}') : null,
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
  const _ActionBar({required this.job, this.resumeId});
  final Job job;
  final String? resumeId;
  @override
  ConsumerState<_ActionBar> createState() => _ActionBarState();
}

class _ActionBarState extends ConsumerState<_ActionBar> {
  bool _busy = false;

  String get _source => widget.job.sourceName ?? 'ITviec / TopCV';

  Future<void> _apply(String? resumeId) async {
    setState(() => _busy = true);
    try {
      // The backend logs the click and returns the live source link.
      final url = await ref.read(repositoryProvider).externalApply(widget.job.id, resumeId: resumeId) ?? widget.job.sourceUrl;
      if (url == null) throw ApiException(tr('Việc làm này không còn link gốc.', 'This job has no source link.'));
      if (!mounted) return;
      await ref.read(appliedJobsProvider.notifier).add(widget.job.id);
      if (!await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication)) {
        throw ApiException(tr('Không mở được trang tuyển dụng.', 'Could not open the job source.'));
      }
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirmApply() async {
    final resumes = ref.read(resumesProvider).value ?? const <Resume>[];
    var resumeId = widget.resumeId ?? '';
    final ready = resumes.where((cv) => cv.status == 'READY').toList();
    if (!ready.any((cv) => cv.id == resumeId)) resumeId = '';
    final choice = await showDialog<String>(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) => AlertDialog(
        title: Text(tr('Ứng tuyển qua $_source', 'Apply on $_source')),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(tr('Bạn sẽ được chuyển sang $_source để nộp hồ sơ.', 'Continue on $_source to submit your application.')),
          if (ready.isNotEmpty)
            DropdownButton<String>(
              value: resumeId,
              isExpanded: true,
              items: [
                DropdownMenuItem(value: '', child: Text(tr('Không chọn CV', 'No CV selected'))),
                for (final cv in ready)
                  DropdownMenuItem(value: cv.id, child: Text(cv.name, overflow: TextOverflow.ellipsis)),
              ],
              onChanged: (id) => setDialogState(() => resumeId = id ?? ''),
            ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(tr('Hủy', 'Cancel'))),
          FilledButton(onPressed: () => Navigator.pop(context, resumeId), child: Text(tr('Mở $_source', 'Open $_source'))),
        ],
      )),
    );
    if (choice != null && mounted) await _apply(choice.isEmpty ? null : choice);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(resumesProvider);
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
              onPressed: _confirmApply,
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
