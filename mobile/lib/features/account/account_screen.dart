import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';
import '../auth/auth_controller.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  Future<void> _openWeb(String path) =>
      launchUrl(Uri.parse('${AppConfig.webUrl}$path'), mode: LaunchMode.externalApplication);

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) => showActionSheet(
        context,
        title: tr('Xoá tài khoản?', 'Delete your account?'),
        body: tr('CV, hồ sơ và lịch sử của bạn sẽ bị khoá và bạn sẽ bị đăng xuất. Bạn không đăng nhập lại được bằng tài khoản này.',
            'Your CVs, profile and history are locked and you are signed out. You cannot sign in with this account again.'),
        actions: [
          BigButton(
            label: tr('Xoá tài khoản', 'Delete account'),
            tone: ButtonTone.danger,
            onPressed: () async {
              Navigator.of(context).pop();
              try {
                await ref.read(repositoryProvider).deleteAccount();
                await ref.read(authProvider.notifier).forget();
              } catch (e) {
                if (context.mounted) toast(context, ApiException.from(e).message);
              }
            },
          ),
          BigButton(label: tr('Huỷ', 'Cancel'), tone: ButtonTone.secondary, onPressed: () => Navigator.of(context).pop()),
        ],
      );

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
                    onTap: () => context.push('/plans'),
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
        SectionTitle(tr('Công cụ', 'Tools')),
        ListGroup(children: [
          ListRowTile(
            icon: Icons.auto_awesome_outlined,
            title: tr('Trợ lý AI', 'AI assistant'),
            detail: tr('Hỏi về CV, việc làm, kỹ năng', 'Ask about CVs, jobs, skills'),
            onTap: () => context.push('/assistant'),
          ),
          ListRowTile(
            icon: Icons.route_outlined,
            title: tr('Lộ trình học', 'Learning roadmaps'),
            detail: tr('Kỹ năng còn thiếu cho từng việc', 'Missing skills for each job'),
            onTap: () => context.push('/roadmaps'),
          ),
          ListRowTile(
            icon: Icons.workspace_premium_outlined,
            title: tr('Gói dịch vụ', 'Plans'),
            detail: sub.value == null ? null : '${tr('Đang dùng', 'Current')} ${sub.value!.planName}',
            onTap: () => context.push('/plans'),
          ),
          ListRowTile(
            icon: Icons.support_agent,
            title: tr('Hỗ trợ', 'Support'),
            detail: tr('Báo lỗi, hỏi về thanh toán', 'Report a problem, billing'),
            onTap: () => context.push('/support'),
          ),
        ]),
        SectionTitle(tr('Tài khoản', 'Account')),
        ListGroup(children: [
          ListRowTile(
            icon: Icons.badge_outlined,
            title: tr('Thông tin cá nhân', 'Personal info'),
            detail: user?.email,
            onTap: () => context.push('/account/profile'),
          ),
          if (user?.authProvider != 'GOOGLE')
            ListRowTile(
              icon: Icons.lock_outline,
              title: tr('Đổi mật khẩu', 'Change password'),
              onTap: () => context.push('/account/password'),
            ),
          ListRowTile(
            icon: Icons.devices_outlined,
            title: tr('Phiên đăng nhập', 'Sign-in sessions'),
            onTap: () => context.push('/account/sessions'),
          ),
        ]),
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
          ListRowTile(
            icon: Icons.delete_outline,
            title: tr('Xoá tài khoản', 'Delete account'),
            danger: true,
            onTap: () => _confirmDelete(context, ref),
          ),
        ]),
        const Center(child: Text('CCV · FA26SE119', style: TextStyle(fontSize: 12, color: AppColors.subtle))),
      ],
    );
  }
}
