import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';

/// Same category codes as the web app (support_tickets.category).
List<(String, String)> get _categories => [
      ('technical', tr('Lỗi kỹ thuật', 'Technical issue')),
      ('billing', tr('Thanh toán', 'Billing')),
      ('ai_accuracy', tr('Kết quả AI chưa đúng', 'AI result is wrong')),
      ('consultation', tr('Tư vấn', 'Consultation')),
      ('feature_request', tr('Góp ý tính năng', 'Feature idea')),
      ('other', tr('Khác', 'Other')),
    ];

String _categoryLabel(String? code) => _categories.where((c) => c.$1 == code).firstOrNull?.$2 ?? (code ?? '');

(String, TagTone) _status(SupportTicket t) => switch (t.status) {
      'IN_PROGRESS' => (tr('Đang xử lý', 'In progress'), TagTone.brand),
      'RESOLVED' => (tr('Đã giải quyết', 'Resolved'), TagTone.neutral),
      'CLOSED' => (tr('Đã đóng', 'Closed'), TagTone.neutral),
      _ => (tr('Đang chờ', 'Open'), TagTone.warn),
    };

class SupportListScreen extends ConsumerWidget {
  const SupportListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(ticketsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('Hỗ trợ', 'Support'))),
      body: ScreenList(
        onRefresh: () async => ref.invalidate(ticketsProvider),
        children: [
          BigButton(label: tr('Gửi yêu cầu hỗ trợ', 'New support request'), icon: Icons.add, onPressed: () => context.push('/support/new')),
          ...async.when(
            loading: () => [const Skeleton(rows: 2)],
            error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(ticketsProvider))],
            data: (list) => list.isEmpty
                ? [EmptyBox(title: tr('Bạn chưa gửi yêu cầu hỗ trợ nào.', 'You have not sent a support request yet.'))]
                : [
                    for (final t in list)
                      AppCard(
                        onTap: () => context.push('/support/${t.id}'),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Expanded(child: Text(t.subject, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500))),
                            const SizedBox(width: 12),
                            Builder(builder: (_) {
                              final (label, tone) = _status(t);
                              return Tag(label, tone: tone);
                            }),
                          ]),
                          const SizedBox(height: 6),
                          Text([_categoryLabel(t.category), relativeDate(t.createdAt)].where((s) => s.isNotEmpty).join(' · '),
                              style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                        ]),
                      ),
                  ],
          ),
        ],
      ),
    );
  }
}

class NewTicketScreen extends ConsumerStatefulWidget {
  const NewTicketScreen({super.key});
  @override
  ConsumerState<NewTicketScreen> createState() => _NewTicketScreenState();
}

class _NewTicketScreenState extends ConsumerState<NewTicketScreen> {
  final _subject = TextEditingController();
  final _description = TextEditingController();
  String _category = 'technical';
  bool _busy = false;

  @override
  void dispose() {
    _subject.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      final t = await ref.read(repositoryProvider).createTicket(
            subject: _subject.text,
            category: _category,
            description: _description.text,
          );
      ref.invalidate(ticketsProvider);
      if (mounted) context.pushReplacement('/support/${t.id}');
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('Yêu cầu hỗ trợ', 'Support request'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Text(tr('Loại vấn đề', 'Category'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final c in _categories) Pill(label: c.$2, active: _category == c.$1, onTap: () => setState(() => _category = c.$1)),
          ]),
          const SizedBox(height: 16),
          Text(tr('Tiêu đề', 'Subject'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const SizedBox(height: 6),
          TextField(controller: _subject, maxLength: 255, onChanged: (_) => setState(() {})),
          const SizedBox(height: 8),
          Text(tr('Mô tả', 'Description'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const SizedBox(height: 6),
          TextField(
            controller: _description,
            minLines: 5,
            maxLines: 10,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(hintText: tr('Bạn gặp vấn đề gì, ở màn hình nào?', 'What went wrong, and where?')),
          ),
          const SizedBox(height: 24),
          BigButton(
            label: tr('Gửi', 'Send'),
            busy: _busy,
            onPressed: _subject.text.trim().isEmpty || _description.text.trim().isEmpty ? null : _submit,
          ),
        ]),
      );
}

class TicketDetailScreen extends ConsumerStatefulWidget {
  const TicketDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends ConsumerState<TicketDetailScreen> {
  final _input = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref.read(repositoryProvider).replyTicket(widget.id, text);
      _input.clear();
      ref.invalidate(ticketProvider(widget.id));
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(ticketProvider(widget.id));
    final t = async.value;
    return Scaffold(
      appBar: AppBar(title: Text(t?.subject ?? tr('Hỗ trợ', 'Support'), maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: Column(children: [
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brand)),
            error: (e, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: ErrorBox(error: e, onRetry: () => ref.invalidate(ticketProvider(widget.id))),
            ),
            data: (t) => RefreshIndicator(
              color: AppColors.brand,
              onRefresh: () async => ref.invalidate(ticketProvider(widget.id)),
              child: ListView(padding: const EdgeInsets.all(16), children: [
                Row(children: [
                  Builder(builder: (_) {
                    final (label, tone) = _status(t);
                    return Tag(label, tone: tone);
                  }),
                  const SizedBox(width: 8),
                  Text(_categoryLabel(t.category), style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                ]),
                const SizedBox(height: 12),
                if (t.description != null) ChatBubble(text: t.description!, mine: true, time: t.createdAt),
                for (final m in t.messages)
                  ChatBubble(
                    text: m.content,
                    mine: m.senderId == t.ownerId,
                    name: m.senderName ?? 'CCV',
                    time: m.createdAt,
                  ),
                if (t.messages.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(tr('Đội ngũ CCV sẽ trả lời ở đây.', 'The CCV team replies here.'),
                        textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
                  ),
              ]),
            ),
          ),
        ),
        if (t != null && !t.isClosed)
          ChatComposer(controller: _input, sending: _sending, onSend: _send, hint: tr('Trả lời…', 'Reply…')),
      ]),
    );
  }
}
