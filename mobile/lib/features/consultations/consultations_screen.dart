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

/// Consultation threads are OPEN or CLOSED; an open one without a
/// consultant is still waiting for the admin to assign someone.
(String, TagTone) consultationStatus(Consultation c, {bool hasConsultant = false}) {
  if (c.isClosed) return (tr('Đã đóng', 'Closed'), TagTone.neutral);
  if (!hasConsultant) return (tr('Chờ phân công', 'Waiting'), TagTone.warn);
  return (tr('Đang tư vấn', 'In progress'), TagTone.brand);
}

class ConsultationsScreen extends ConsumerWidget {
  const ConsultationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(consultationsProvider);
    return ScreenList(
      onRefresh: () async => ref.invalidate(consultationsProvider),
      children: [
        AppCard(
          dark: true,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tr('Tư vấn nghề nghiệp', 'Career advice'),
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: Colors.white)),
            const SizedBox(height: 6),
            Text(
              tr('Gửi câu hỏi về CV, định hướng hay phỏng vấn. Quản trị viên sẽ phân công một cố vấn trả lời bạn.',
                  'Ask about your CV, career path or interviews. An admin assigns an advisor to reply.'),
              style: TextStyle(fontSize: 13, height: 1.5, color: Colors.white.withValues(alpha: .8)),
            ),
          ]),
        ),
        BigButton(label: tr('Gửi yêu cầu tư vấn', 'Request a session'), onPressed: () => context.push('/consultations/new')),
        SectionTitle(tr('Yêu cầu của bạn', 'Your requests')),
        ...async.when(
          loading: () => [const Skeleton(rows: 2)],
          error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(consultationsProvider))],
          data: (list) => list.isEmpty
              ? [EmptyBox(title: tr('Bạn chưa gửi yêu cầu nào.', 'You have not sent any request yet.'))]
              : [
                  for (final c in list)
                    AppCard(
                      onTap: () => context.push('/consultations/${c.id}'),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Expanded(child: Text(c.topic, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, height: 1.3))),
                          const SizedBox(width: 12),
                          Builder(builder: (_) {
                            final (label, tone) = consultationStatus(c, hasConsultant: c.consultantId != null);
                            return Tag(label, tone: tone);
                          }),
                        ]),
                        if (c.goal != null) ...[
                          const SizedBox(height: 6),
                          Text(c.goal!, maxLines: 2, overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted)),
                        ],
                        const Divider(height: 24),
                        Text(relativeDate(c.createdAt), style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                      ]),
                    ),
                ],
        ),
      ],
    );
  }
}

class NewConsultationScreen extends ConsumerStatefulWidget {
  const NewConsultationScreen({super.key});
  @override
  ConsumerState<NewConsultationScreen> createState() => _NewConsultationScreenState();
}

class _NewConsultationScreenState extends ConsumerState<NewConsultationScreen> {
  final _subject = TextEditingController();
  final _description = TextEditingController();
  bool _busy = false;

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      final c = await ref.read(repositoryProvider).createConsultation(
            subject: _subject.text.trim(),
            description: _description.text.trim(),
          );
      ref.invalidate(consultationsProvider);
      if (mounted) context.pushReplacement('/consultations/${c.id}');
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('Yêu cầu tư vấn', 'New request'))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Text(tr('Chủ đề', 'Subject'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const SizedBox(height: 6),
          TextField(
            controller: _subject,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(hintText: tr('Ví dụ: Góp ý CV Frontend', 'e.g. Review my frontend CV')),
          ),
          const SizedBox(height: 16),
          Text(tr('Bạn cần hỗ trợ gì?', 'What do you need help with?'), style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          const SizedBox(height: 6),
          TextField(controller: _description, minLines: 5, maxLines: 10, onChanged: (_) => setState(() {})),
          const SizedBox(height: 24),
          BigButton(
            label: tr('Gửi yêu cầu', 'Send request'),
            busy: _busy,
            onPressed: _subject.text.trim().isEmpty || _description.text.trim().isEmpty ? null : _submit,
          ),
        ]),
      );
}

class ConsultationDetailScreen extends ConsumerStatefulWidget {
  const ConsultationDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ConsultationDetailScreen> createState() => _ConsultationDetailScreenState();
}

class _ConsultationDetailScreenState extends ConsumerState<ConsultationDetailScreen> {
  final _input = TextEditingController();
  bool _sending = false;

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref.read(repositoryProvider).sendMessage(widget.id, text);
      _input.clear();
      ref.invalidate(messagesProvider(widget.id));
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _close() async {
    Navigator.of(context).pop();
    try {
      await ref.read(repositoryProvider).closeConsultation(widget.id);
      ref.invalidate(consultationProvider(widget.id));
      ref.invalidate(consultationsProvider);
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(authProvider).user?.id;
    final thread = ref.watch(consultationProvider(widget.id));
    final messages = ref.watch(messagesProvider(widget.id));
    final closed = thread.value?.isClosed ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(thread.value?.topic ?? tr('Tư vấn', 'Consultation'), maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: tr('Tải lại', 'Refresh'),
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(messagesProvider(widget.id)),
          ),
          if (thread.hasValue && !closed)
            IconButton(
              tooltip: tr('Đóng yêu cầu', 'Close request'),
              icon: const Icon(Icons.check_circle_outline),
              onPressed: () => showActionSheet(
                context,
                title: tr('Đóng yêu cầu này?', 'Close this request?'),
                body: tr('Sau khi đóng, hai bên không gửi tin nhắn được nữa.', 'Once closed, no more messages can be sent.'),
                actions: [
                  BigButton(label: tr('Đóng yêu cầu', 'Close request'), onPressed: _close),
                  BigButton(label: tr('Huỷ', 'Cancel'), tone: ButtonTone.secondary, onPressed: () => Navigator.of(context).pop()),
                ],
              ),
            ),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: messages.when(
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brand)),
            error: (e, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: ErrorBox(error: e, onRetry: () => ref.invalidate(messagesProvider(widget.id))),
            ),
            data: (list) => RefreshIndicator(
              color: AppColors.brand,
              onRefresh: () async => ref.invalidate(messagesProvider(widget.id)),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (thread.value?.goal != null)
                    AppCard(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(tr('Yêu cầu', 'Request'), style: const TextStyle(fontSize: 13, color: AppColors.subtle)),
                        const SizedBox(height: 4),
                        Text(thread.value!.goal!, style: const TextStyle(fontSize: 14, height: 1.5)),
                      ]),
                    ),
                  const SizedBox(height: 16),
                  if (list.isEmpty)
                    Text(
                      tr('Chưa có tin nhắn. Cố vấn sẽ trả lời ở đây.', 'No messages yet. Your advisor replies here.'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 13, color: AppColors.subtle),
                    ),
                  for (final m in list) _Bubble(m, mine: m.senderId == me),
                ],
              ),
            ),
          ),
        ),
        if (!closed)
          Container(
            decoration: const BoxDecoration(color: AppColors.canvas, border: Border(top: BorderSide(color: AppColors.border))),
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
            child: SafeArea(
              top: false,
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    minLines: 1,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: tr('Nhắn cho cố vấn…', 'Message your advisor…'),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: AppColors.ink),
                  onPressed: _sending ? null : _send,
                  icon: _sending
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.arrow_upward, color: Colors.white),
                ),
              ]),
            ),
          ),
      ]),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble(this.m, {required this.mine});
  final ConsultationMessage m;
  final bool mine;

  @override
  Widget build(BuildContext context) => Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .78),
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: mine ? AppColors.ink : AppColors.surface,
            border: mine ? null : Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (!mine && m.senderName != null)
              Text(m.senderName!, style: const TextStyle(fontSize: 12, color: AppColors.brand)),
            Text(m.content, style: TextStyle(fontSize: 14, height: 1.45, color: mine ? Colors.white : AppColors.ink)),
            const SizedBox(height: 2),
            Text(relativeDate(m.createdAt),
                style: TextStyle(fontSize: 11, color: mine ? Colors.white.withValues(alpha: .6) : AppColors.subtle)),
          ]),
        ),
      );
}
