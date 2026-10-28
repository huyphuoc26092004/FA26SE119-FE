import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';
import '../auth/auth_controller.dart';

/// Web app address for the tools that are not in the mobile app yet.
const _webUrl = String.fromEnvironment('WEB_URL', defaultValue: 'http://localhost:5173');

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  Future<void> _openWeb(String path) =>
      launchUrl(Uri.parse('$_webUrl$path'), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final profile = ref.watch(careerProfileProvider).value;
    final sub = ref.watch(subscriptionProvider);
    final completion = profile?.completionOrGuess ?? 0;
    final fmt = NumberFormat.decimalPattern(AppLanguage.locale);

    return ScreenList(
      onRefresh: () async {
        ref.invalidate(careerProfileProvider);
        ref.invalidate(subscriptionProvider);
      },
      children: [
        AppCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Initials(user?.name ?? '', size: 64, dark: true),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(user?.name ?? '', overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500)),
                  Text(profile?.headline ?? user?.email ?? '', overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                ]),
              ),
            ]),
            const SizedBox(height: 16),
            ThinBar(value: completion),
            const SizedBox(height: 6),
            Text(tr('Hồ sơ hoàn thiện $completion%', 'Profile $completion% complete'),
                style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          ]),
        ),
        sub.when(
          loading: () => const Skeleton(rows: 1),
          error: (e, _) => ErrorBox(error: e, onRetry: () => ref.invalidate(subscriptionProvider)),
          data: (s) {
            final limit = s.tokenLimit;
            final left = limit == null ? null : (limit - (s.tokensUsed ?? 0)).clamp(0, limit);
            return AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(
                    child: Text('${tr('Token AI còn lại', 'AI tokens left')} · ${tr('Gói', 'Plan')} ${s.planName}',
                        style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                  ),
                  GestureDetector(
                    onTap: () => _openWeb('/candidate/subscription'),
                    child: Text(tr('Nâng cấp', 'Upgrade'), style: const TextStyle(fontSize: 14, color: AppColors.brand)),
                  ),
                ]),
                const SizedBox(height: 4),
                Text.rich(TextSpan(children: [
                  TextSpan(text: left == null ? '–' : fmt.format(left),
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w500)),
                  if (limit != null)
                    TextSpan(text: ' / ${fmt.format(limit)}', style: const TextStyle(fontSize: 14, color: AppColors.subtle)),
                ])),
                if (limit != null && limit > 0) ...[
                  const SizedBox(height: 8),
                  ThinBar(value: left! / limit * 100),
                ],
              ]),
            );
          },
        ),
        SectionTitle(tr('Trên bản web', 'On the web app')),
        ListGroup(children: [
          ListRowTile(
            icon: Icons.person_outline,
            title: tr('Hồ sơ nghề nghiệp', 'Career profile'),
            detail: tr('Thông tin, mục tiêu, kỹ năng', 'Info, goals, skills'),
            onTap: () => _openWeb('/candidate/profile'),
          ),
          ListRowTile(
            icon: Icons.mail_outline,
            title: tr('Hỗ trợ ứng tuyển', 'Application help'),
            detail: tr('Thư xin việc, email', 'Cover letters, emails'),
            onTap: () => _openWeb('/candidate/applications'),
          ),
          ListRowTile(
            icon: Icons.task_alt,
            title: tr('Đánh giá kỹ năng', 'Skill assessment'),
            onTap: () => _openWeb('/candidate/assessment'),
          ),
          ListRowTile(
            icon: Icons.support_agent,
            title: tr('Hỗ trợ', 'Support'),
            onTap: () => _openWeb('/candidate/support'),
          ),
        ]),
        SectionTitle(tr('Cài đặt', 'Settings')),
        ListGroup(children: [
          ListRowTile(
            icon: Icons.translate,
            title: tr('Ngôn ngữ', 'Language'),
            detail: tr('Tiếng Việt', 'English'),
            onTap: AppLanguage.toggle,
          ),
          ListRowTile(
            icon: Icons.logout,
            title: tr('Đăng xuất', 'Sign out'),
            danger: true,
            onTap: () => ref.read(authProvider.notifier).logout(),
          ),
        ]),
        const Center(child: Text('CCV · FA26SE119', style: TextStyle(fontSize: 12, color: AppColors.subtle))),
      ],
    );
  }
}
