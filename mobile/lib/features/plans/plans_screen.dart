import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';

/// Plans from GET /subscriptions/tiers. SePay checkout is a signed POST
/// form, so paying continues on the web app.
class PlansScreen extends ConsumerWidget {
  const PlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tiers = ref.watch(tiersProvider);
    final current = ref.watch(subscriptionProvider).value;
    final fmt = NumberFormat.decimalPattern(AppLanguage.locale);
    return Scaffold(
      appBar: AppBar(title: Text(tr('Gói dịch vụ', 'Plans'))),
      body: ScreenList(
        onRefresh: () async {
          ref.invalidate(tiersProvider);
          ref.invalidate(subscriptionProvider);
        },
        children: [
          if (current != null)
            AppCard(
              dark: true,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('Gói hiện tại', 'Current plan'), style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: .7))),
                const SizedBox(height: 4),
                Text(current.planName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w500, color: Colors.white)),
                if (current.expiresAt != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${tr('Hết hạn', 'Expires')} ${DateFormat('dd/MM/yyyy').format(current.expiresAt!)}',
                    style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: .8)),
                  ),
                ],
              ]),
            ),
          ...tiers.when(
            loading: () => [const Skeleton(rows: 2)],
            error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(tiersProvider))],
            data: (list) => [
              for (final t in list)
                AppCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(t.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500))),
                      if (current?.planName == t.name || current?.planName == t.code) Tag(tr('Đang dùng', 'Current'), tone: TagTone.brand),
                    ]),
                    const SizedBox(height: 6),
                    Text(
                      t.monthlyPrice > 0 ? '${fmt.format(t.monthlyPrice)} ${t.currency} / ${tr('tháng', 'month')}' : tr('Miễn phí', 'Free'),
                      style: const TextStyle(fontSize: 15),
                    ),
                    if (t.tokenQuota != null) ...[
                      const SizedBox(height: 4),
                      Text('${fmt.format(t.tokenQuota)} ${tr('token AI mỗi tháng', 'AI tokens a month')}',
                          style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                    ],
                  ]),
                ),
              BigButton(
                label: tr('Nâng cấp trên bản web', 'Upgrade on the web app'),
                icon: Icons.open_in_new,
                onPressed: () => launchUrl(Uri.parse('${AppConfig.webUrl}/candidate/subscription'), mode: LaunchMode.externalApplication),
              ),
              Text(
                tr('Thanh toán qua SePay chạy trên bản web. Gói mới hiện ở đây ngay sau khi thanh toán xong.',
                    'SePay payment runs on the web app. Your new plan shows here as soon as it is paid.'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, height: 1.5, color: AppColors.subtle),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
