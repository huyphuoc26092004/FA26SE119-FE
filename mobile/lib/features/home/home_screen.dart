import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';
import '../auth/auth_controller.dart';
import '../jobs/jobs_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _matching = false;

  Future<void> _runMatching() async {
    setState(() => _matching = true);
    try {
      await ref.read(repositoryProvider).runMatching();
      ref.invalidate(matchesProvider);
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _matching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final profile = ref.watch(careerProfileProvider).value;
    final resumes = ref.watch(resumesProvider).value ?? const <Resume>[];
    final matches = ref.watch(matchesProvider);

    final name = (user?.name ?? '').split(' ').where((p) => p.isNotEmpty).lastOrNull ?? '';
    final completion = profile?.completionOrGuess ?? 0;
    final primary = resumes.where((r) => r.isPrimary).firstOrNull ?? resumes.firstOrNull;
    final readyCount = resumes.where((r) => r.status == 'READY').length;
    final list = matches.value ?? const <JobMatch>[];
    final avg = list.isEmpty ? null : (list.map((m) => m.score).reduce((a, b) => a + b) / list.length).round();

    final actions = <(IconData, String, String)>[
      (Icons.description_outlined, tr('CV của tôi', 'My CVs'), '/resumes'),
      (Icons.work_outline, tr('Việc làm', 'Jobs'), '/jobs'),
      (Icons.forum_outlined, tr('Gặp cố vấn', 'Advisor'), '/consultations'),
      (Icons.person_outline, tr('Tài khoản', 'Account'), '/account'),
    ];

    return ScreenList(
      onRefresh: () async {
        ref.invalidate(careerProfileProvider);
        ref.invalidate(resumesProvider);
        ref.invalidate(matchesProvider);
      },
      children: [
        AppCard(
          dark: true,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tr('Chào $name', 'Hi $name'),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w500, color: Colors.white)),
            if (profile?.targetPosition != null || profile?.headline != null) ...[
              const SizedBox(height: 4),
              Text(profile!.targetPosition ?? profile.headline!,
                  style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: .7))),
            ],
            const SizedBox(height: 16),
            ThinBar(value: completion, dark: true),
            const SizedBox(height: 8),
            Text(tr('Hồ sơ đã hoàn thiện $completion%', 'Profile $completion% complete'),
                style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: .8))),
          ]),
        ),
        Row(children: [
          Expanded(child: _Stat(value: '${resumes.length}', label: tr('CV · $readyCount sẵn sàng', 'CVs · $readyCount ready'), onTap: () => context.go('/resumes'))),
          const SizedBox(width: 12),
          Expanded(child: _Stat(value: '${list.length}', label: tr('Việc phù hợp', 'Matching jobs'), onTap: () => context.go('/jobs'))),
          const SizedBox(width: 12),
          Expanded(child: _Stat(value: avg == null ? '–' : '$avg%', label: tr('Khớp trung bình', 'Avg. match'), accent: true)),
        ]),
        SectionTitle(tr('Làm nhanh', 'Quick actions')),
        Row(children: [
          for (final a in actions)
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => context.go(a.$3),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Column(children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Icon(a.$1, color: AppColors.brand, size: 21),
                    ),
                    const SizedBox(height: 8),
                    Text(a.$2, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, height: 1.2)),
                  ]),
                ),
              ),
            ),
        ]),
        SectionTitle(tr('Việc làm cho bạn', 'Jobs for you'),
            action: list.isEmpty ? null : tr('Xem tất cả', 'See all'), onAction: () => context.go('/jobs')),
        ...matches.when(
          loading: () => [const Skeleton(rows: 2)],
          error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(matchesProvider))],
          data: (m) => m.isEmpty
              ? [
                  EmptyBox(
                    title: readyCount == 0
                        ? tr('Bạn cần ít nhất một CV ở trạng thái Sẵn sàng để so khớp việc làm.',
                            'You need at least one Ready CV to match jobs.')
                        : tr('Chưa có kết quả so khớp.', 'No matching results yet.'),
                    action: readyCount == 0
                        ? null
                        : BigButton(label: tr('So khớp việc làm với CV', 'Match jobs to my CVs'), busy: _matching, onPressed: _runMatching),
                  ),
                ]
              : [
                  for (final x in m.take(5)) JobCard(job: x.job, match: x.score),
                  BigButton(
                    label: tr('So khớp lại', 'Run matching again'),
                    tone: ButtonTone.secondary,
                    busy: _matching,
                    onPressed: _runMatching,
                  ),
                ],
        ),
        if (primary != null)
          AppCard(
            onTap: () => context.push('/resumes/${primary.id}'),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(primary.isPrimary ? tr('CV chính', 'Primary CV') : 'CV',
                  style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
              const SizedBox(height: 2),
              Text(primary.name, maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
              const SizedBox(height: 4),
              Text(tr('Cập nhật ${relativeDate(primary.updatedAt)}', 'Updated ${relativeDate(primary.updatedAt)}'),
                  style: const TextStyle(fontSize: 13, color: AppColors.muted)),
            ]),
          ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, this.onTap, this.accent = false});
  final String value;
  final String label;
  final VoidCallback? onTap;
  final bool accent;

  @override
  Widget build(BuildContext context) => AppCard(
        onTap: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
        child: Column(children: [
          Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w500, color: accent ? AppColors.brand : AppColors.ink)),
          const SizedBox(height: 4),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
        ]),
      );
}
