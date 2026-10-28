import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';

/// One job as a tappable card; shared by the home and jobs screens.
class JobCard extends ConsumerWidget {
  const JobCard({super.key, required this.job, this.match});
  final Job job;
  final int? match;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedJobsProvider).contains(job.id);
    final applied = ref.watch(appliedJobsProvider).contains(job.id);
    return AppCard(
      onTap: () => context.push('/jobs/${job.id}'),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CompanyBadge(job.initial),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(job.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, height: 1.3)),
              const SizedBox(height: 2),
              Text(job.company, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13, color: AppColors.muted)),
            ]),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            tooltip: tr('Lưu', 'Save'),
            icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border, color: saved ? AppColors.brand : AppColors.subtle),
            onPressed: () async {
              final now = await ref.read(savedJobsProvider.notifier).toggle(job.id);
              if (context.mounted) toast(context, now ? tr('Đã lưu việc làm', 'Job saved') : tr('Đã bỏ lưu', 'Removed from saved'));
            },
          ),
        ]),
        if (job.location != null) ...[
          const SizedBox(height: 10),
          Row(children: [
            const Icon(Icons.place_outlined, size: 15, color: AppColors.muted),
            const SizedBox(width: 4),
            Expanded(child: Text(job.location!, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, color: AppColors.muted))),
          ]),
        ],
        if (job.salary != null) ...[
          const SizedBox(height: 4),
          Text(job.salary!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        ],
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: Wrap(spacing: 6, runSpacing: 6, children: [
              if (match != null) Tag('$match% ${tr('phù hợp', 'match')}', tone: TagTone.brand),
              if (applied) Tag(tr('Đã ứng tuyển', 'Applied')),
              for (final s in job.skills.take(2)) Tag(s),
            ]),
          ),
          Text(relativeDate(job.postedAt), style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
        ]),
      ]),
    );
  }
}

class CompanyBadge extends StatelessWidget {
  const CompanyBadge(this.letter, {super.key, this.size = 44});
  final String letter;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(size * .28)),
        child: Text(letter, style: TextStyle(fontSize: size * .36, fontWeight: FontWeight.w500, color: AppColors.brand)),
      );
}

enum _Tab { all, recommended, saved, applied }

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({super.key});
  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  final _search = TextEditingController();
  String _keyword = '';
  _Tab _tab = _Tab.all;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _onSearch(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () => setState(() => _keyword = v.trim()));
    setState(() {});
  }

  String _tabLabel(_Tab t) => switch (t) {
        _Tab.all => tr('Tất cả', 'All'),
        _Tab.recommended => tr('Phù hợp', 'For you'),
        _Tab.saved => tr('Đã lưu', 'Saved'),
        _Tab.applied => tr('Đã ứng tuyển', 'Applied'),
      };

  @override
  Widget build(BuildContext context) {
    final saved = ref.watch(savedJobsProvider);
    final applied = ref.watch(appliedJobsProvider);
    final matches = ref.watch(matchesProvider).value ?? const <JobMatch>[];
    final scoreOf = {for (final m in matches) m.job.id: m.score};

    // "For you" lists the latest matching run; other tabs use the job search.
    final AsyncValue<List<Job>> source = _tab == _Tab.recommended
        ? ref.watch(matchesProvider).whenData((m) => m.map((x) => x.job).toList())
        : ref.watch(jobsProvider(_keyword));

    return Column(children: [
      Container(
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.border))),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Column(children: [
          TextField(
            controller: _search,
            onChanged: _onSearch,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: tr('Vị trí, công ty, kỹ năng…', 'Role, company, skill…'),
              prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.subtle),
              suffixIcon: _search.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () {
                        _search.clear();
                        _onSearch('');
                      }),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(99), borderSide: const BorderSide(color: AppColors.border)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(99), borderSide: const BorderSide(color: AppColors.border)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(99), borderSide: const BorderSide(color: AppColors.brand)),
            ),
          ),
          const SizedBox(height: 12),
          PillRow(children: [
            for (final t in _Tab.values) Pill(label: _tabLabel(t), active: _tab == t, onTap: () => setState(() => _tab = t)),
          ]),
        ]),
      ),
      Expanded(
        child: source.when(
          loading: () => const Padding(padding: EdgeInsets.all(16), child: Skeleton()),
          error: (e, _) => Padding(
            padding: const EdgeInsets.all(16),
            child: ErrorBox(error: e, onRetry: () => ref.invalidate(jobsProvider(_keyword))),
          ),
          data: (jobs) {
            final q = _keyword.toLowerCase();
            final list = jobs.where((j) {
              if (_tab == _Tab.recommended && q.isNotEmpty) {
                if (!'${j.title} ${j.company} ${j.skills.join(' ')}'.toLowerCase().contains(q)) return false;
              }
              if (_tab == _Tab.saved) return saved.contains(j.id);
              if (_tab == _Tab.applied) return applied.contains(j.id);
              return true;
            }).toList();
            return ScreenList(
              onRefresh: () async {
                ref.invalidate(jobsProvider(_keyword));
                ref.invalidate(matchesProvider);
              },
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(tr('${list.length} việc làm', '${list.length} jobs'),
                      style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
                ),
                if (list.isEmpty)
                  EmptyBox(
                    title: _tab == _Tab.recommended
                        ? tr('Chưa có kết quả so khớp. Chạy so khớp ở Trang chủ.', 'No matches yet. Run matching from Home.')
                        : tr('Không có việc làm nào khớp.', 'No jobs match.'),
                  ),
                for (final j in list) JobCard(job: j, match: scoreOf[j.id]),
              ],
            );
          },
        ),
      ),
    ]);
  }
}
