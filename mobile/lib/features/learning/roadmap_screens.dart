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

String _hours(num? h) => h == null || h == 0 ? '' : '${h % 1 == 0 ? h.toInt() : h} ${tr('giờ', 'h')}';

class RoadmapListScreen extends ConsumerWidget {
  const RoadmapListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(roadmapsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('Lộ trình học', 'Learning roadmaps'))),
      body: ScreenList(
        onRefresh: () async => ref.invalidate(roadmapsProvider),
        children: [
          Text(
            tr('Mỗi lộ trình gồm các kỹ năng một việc làm cần mà CV của bạn chưa thể hiện. Tạo lộ trình mới ở trang chi tiết việc làm.',
                'Each roadmap covers the skills a job needs that your CV does not show yet. Create one from a job page.'),
            style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted),
          ),
          ...async.when(
            loading: () => [const Skeleton(rows: 2)],
            error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(roadmapsProvider))],
            data: (list) => list.isEmpty
                ? [
                    EmptyBox(
                      title: tr('Bạn chưa có lộ trình nào.', 'You have no roadmap yet.'),
                      action: BigButton(label: tr('Tìm việc làm', 'Browse jobs'), tone: ButtonTone.secondary, onPressed: () => context.go('/jobs')),
                    ),
                  ]
                : [
                    for (final r in list)
                      AppCard(
                        onTap: () => context.push('/roadmaps/${r.id}'),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(r.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500))),
                            if (r.outdated) Tag(tr('Cần cập nhật', 'Outdated'), tone: TagTone.warn),
                          ]),
                          const SizedBox(height: 10),
                          ThinBar(value: r.progress),
                          const SizedBox(height: 6),
                          Text(
                            [tr('Hoàn thành ${r.progress}%', '${r.progress}% done'), _hours(r.totalHours), relativeDate(r.createdAt)]
                                .where((s) => s.isNotEmpty)
                                .join(' · '),
                            style: const TextStyle(fontSize: 12, color: AppColors.subtle),
                          ),
                        ]),
                      ),
                  ],
          ),
        ],
      ),
    );
  }
}

class RoadmapDetailScreen extends ConsumerStatefulWidget {
  const RoadmapDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<RoadmapDetailScreen> createState() => _RoadmapDetailScreenState();
}

class _RoadmapDetailScreenState extends ConsumerState<RoadmapDetailScreen> {
  String? _saving;

  static const _order = ['not_started', 'in_progress', 'completed'];

  (String, TagTone, IconData) _status(String s) => switch (s) {
        'completed' => (tr('Đã xong', 'Done'), TagTone.brand, Icons.check_circle),
        'in_progress' => (tr('Đang học', 'Learning'), TagTone.warn, Icons.timelapse),
        _ => (tr('Chưa học', 'Not started'), TagTone.neutral, Icons.radio_button_unchecked),
      };

  Future<void> _cycle(Roadmap r, RoadmapNode n) async {
    final next = _order[(_order.indexOf(n.status) + 1) % _order.length];
    setState(() => _saving = n.id);
    try {
      await ref.read(repositoryProvider).setNodeStatus(r.id, n.id, next);
      ref.invalidate(roadmapProvider(r.id));
      ref.invalidate(roadmapsProvider);
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _saving = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(roadmapProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: Text(tr('Lộ trình học', 'Roadmap'))),
      body: async.when(
        loading: () => const Padding(padding: EdgeInsets.all(16), child: Skeleton()),
        error: (e, _) => Padding(
          padding: const EdgeInsets.all(16),
          child: ErrorBox(error: e, onRetry: () => ref.invalidate(roadmapProvider(widget.id))),
        ),
        data: (r) => ScreenList(
          onRefresh: () async => ref.invalidate(roadmapProvider(widget.id)),
          children: [
            AppCard(
              dark: true,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(r.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: Colors.white)),
                const SizedBox(height: 12),
                ThinBar(value: r.progress, dark: true),
                const SizedBox(height: 6),
                Text(
                  [tr('Hoàn thành ${r.progress}%', '${r.progress}% done'), _hours(r.totalHours)].where((s) => s.isNotEmpty).join(' · '),
                  style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: .8)),
                ),
                if (r.jobId != null) ...[
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => context.push('/jobs/${r.jobId}'),
                    child: Text(tr('Xem việc làm', 'View the job'), style: const TextStyle(fontSize: 14, color: AppColors.mint)),
                  ),
                ],
              ]),
            ),
            if (r.nodes.isEmpty) EmptyBox(title: tr('CV của bạn đã có đủ kỹ năng việc này cần.', 'Your CV already shows every skill this job needs.')),
            for (final n in r.nodes)
              AppCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: Text(n.skill, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
                    if (_hours(n.hours).isNotEmpty) Text(_hours(n.hours), style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                  ]),
                  if (n.description != null) ...[
                    const SizedBox(height: 6),
                    Text(n.description!, style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted)),
                  ],
                  for (final res in n.resources)
                    InkWell(
                      onTap: res.url == null ? null : () => launchUrl(Uri.parse(res.url!), mode: LaunchMode.externalApplication),
                      child: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Row(children: [
                          const Icon(Icons.menu_book_outlined, size: 16, color: AppColors.brand),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              res.provider == null ? res.title : '${res.title} · ${res.provider}',
                              style: const TextStyle(fontSize: 13, color: AppColors.brand),
                            ),
                          ),
                        ]),
                      ),
                    ),
                  const SizedBox(height: 12),
                  Builder(builder: (_) {
                    final (label, tone, icon) = _status(n.status);
                    return Row(children: [
                      Tag(label, tone: tone, icon: icon),
                      const Spacer(),
                      TextButton(
                        onPressed: _saving == null ? () => _cycle(r, n) : null,
                        style: TextButton.styleFrom(foregroundColor: AppColors.brand),
                        child: _saving == n.id
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : Text(switch (n.status) {
                                'not_started' => tr('Bắt đầu học', 'Start'),
                                'in_progress' => tr('Đánh dấu đã xong', 'Mark done'),
                                _ => tr('Học lại', 'Reset'),
                              }),
                      ),
                    ]);
                  }),
                ]),
              ),
          ],
        ),
      ),
    );
  }
}
