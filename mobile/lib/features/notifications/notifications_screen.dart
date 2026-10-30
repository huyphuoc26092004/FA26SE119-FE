import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';

/// Unread count for the bell in the top bar.
final unreadCountProvider = Provider.autoDispose<int>(
  (ref) => ref.watch(notificationsProvider).value?.where((n) => !n.isRead).length ?? 0,
);

/// Where a notification leads, from its type / reference.
String? _routeOf(AppNotification n) {
  final type = n.type?.toUpperCase() ?? '';
  final ref = n.referenceType ?? '';
  final id = n.referenceId;
  if (type.startsWith('SUPPORT') || ref.contains('TICKET')) return id == null ? '/support' : '/support/$id';
  if (type.contains('CONSULT') || ref.contains('CONSULT')) return id == null ? '/consultations' : '/consultations/$id';
  if (type.startsWith('PAYMENT') || type.startsWith('SUBSCRIPTION') || ref.contains('ORDER')) return '/plans';
  if (ref.contains('ROADMAP') && id != null) return '/roadmaps/$id';
  if (ref.contains('RESUME') && id != null) return '/resumes/$id';
  return null;
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Future<void> _open(BuildContext context, WidgetRef ref, AppNotification n) async {
    if (!n.isRead) {
      try {
        await ref.read(repositoryProvider).markNotificationRead(n.id);
        ref.invalidate(notificationsProvider);
      } catch (_) {
        // Opening still works if marking as read fails.
      }
    }
    final route = _routeOf(n);
    if (route != null && context.mounted) context.push(route);
  }

  Future<void> _readAll(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(repositoryProvider).markAllNotificationsRead();
      ref.invalidate(notificationsProvider);
    } catch (e) {
      if (context.mounted) toast(context, ApiException.from(e).message);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsProvider);
    final unread = ref.watch(unreadCountProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('Thông báo', 'Notifications')),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: () => _readAll(context, ref),
              style: TextButton.styleFrom(foregroundColor: AppColors.brand),
              child: Text(tr('Đọc hết', 'Mark all read')),
            ),
        ],
      ),
      body: ScreenList(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        children: async.when(
          loading: () => [const Skeleton()],
          error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(notificationsProvider))],
          data: (list) => list.isEmpty
              ? [EmptyBox(title: tr('Bạn chưa có thông báo nào.', 'No notifications yet.'))]
              : [
                  for (final n in list)
                    AppCard(
                      onTap: () => _open(context, ref, n),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 7, right: 12),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: n.isRead ? Colors.transparent : AppColors.brand,
                          ),
                        ),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(n.title,
                                style: TextStyle(fontSize: 15, fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w500)),
                            if (n.content.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(n.content, style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted)),
                            ],
                            const SizedBox(height: 6),
                            Text(relativeDate(n.createdAt), style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                          ]),
                        ),
                      ]),
                    ),
                ],
        ),
      ),
    );
  }
}

/// Bell with an unread badge, shown in the tab bar's top bar.
class NotificationBell extends ConsumerWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadCountProvider);
    return IconButton(
      tooltip: tr('Thông báo', 'Notifications'),
      onPressed: () => context.push('/notifications'),
      icon: Badge(
        isLabelVisible: unread > 0,
        backgroundColor: AppColors.danger,
        label: Text(unread > 9 ? '9+' : '$unread'),
        child: const Icon(Icons.notifications_none),
      ),
    );
  }
}
