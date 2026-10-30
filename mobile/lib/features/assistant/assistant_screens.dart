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

/// Opens a new assistant conversation (optionally about a job or CV)
/// and shows it.
Future<void> startAssistantChat(BuildContext context, WidgetRef ref, {String? title, String? jobId, String? resumeId}) async {
  try {
    final c = await ref.read(repositoryProvider).createConversation(title: title, jobId: jobId, resumeId: resumeId);
    ref.invalidate(conversationsProvider);
    if (context.mounted) context.push('/assistant/${c.id}');
  } catch (e) {
    if (context.mounted) toast(context, ApiException.from(e).message);
  }
}

class AssistantListScreen extends ConsumerStatefulWidget {
  const AssistantListScreen({super.key});
  @override
  ConsumerState<AssistantListScreen> createState() => _AssistantListScreenState();
}

class _AssistantListScreenState extends ConsumerState<AssistantListScreen> {
  bool _creating = false;

  Future<void> _new() async {
    setState(() => _creating = true);
    await startAssistantChat(context, ref, title: tr('Trò chuyện mới', 'New chat'));
    if (mounted) setState(() => _creating = false);
  }

  Future<void> _archive(ChatConversation c) async {
    try {
      await ref.read(repositoryProvider).deleteConversation(c.id);
      ref.invalidate(conversationsProvider);
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(conversationsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('Trợ lý AI', 'AI assistant'))),
      body: ScreenList(
        onRefresh: () async => ref.invalidate(conversationsProvider),
        children: [
          AppCard(
            dark: true,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(tr('Trợ lý nghề nghiệp', 'Career assistant'),
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: Colors.white)),
              const SizedBox(height: 6),
              Text(
                tr('Trợ lý đọc hồ sơ và CV của bạn để trả lời. Hỏi về cách viết CV, kỹ năng cần học hay chuẩn bị phỏng vấn.',
                    'The assistant reads your profile and CVs. Ask about CV writing, skills to learn or interview prep.'),
                style: TextStyle(fontSize: 13, height: 1.5, color: Colors.white.withValues(alpha: .8)),
              ),
            ]),
          ),
          BigButton(label: tr('Cuộc trò chuyện mới', 'New conversation'), icon: Icons.add, busy: _creating, onPressed: _new),
          ...async.when(
            loading: () => [const Skeleton(rows: 2)],
            error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(conversationsProvider))],
            data: (list) => list.isEmpty
                ? [EmptyBox(title: tr('Chưa có cuộc trò chuyện nào.', 'No conversations yet.'))]
                : [
                    for (final c in list)
                      Dismissible(
                        key: ValueKey(c.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          decoration: BoxDecoration(color: AppColors.danger50, borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.archive_outlined, color: AppColors.danger),
                        ),
                        onDismissed: (_) => _archive(c),
                        child: AppCard(
                          onTap: () => context.push('/assistant/${c.id}'),
                          child: Row(children: [
                            const Icon(Icons.chat_bubble_outline, color: AppColors.brand, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(c.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
                                Text(
                                  [
                                    if (c.jobId != null) tr('Về một việc làm', 'About a job'),
                                    if (c.resumeId != null) tr('Về một CV', 'About a CV'),
                                    relativeDate(c.updatedAt),
                                  ].join(' · '),
                                  style: const TextStyle(fontSize: 12, color: AppColors.subtle),
                                ),
                              ]),
                            ),
                            const Icon(Icons.chevron_right, color: AppColors.subtle),
                          ]),
                        ),
                      ),
                    Text(tr('Vuốt sang trái để lưu trữ một cuộc trò chuyện.', 'Swipe left to archive a conversation.'),
                        textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                  ],
          ),
        ],
      ),
    );
  }
}

class AssistantChatScreen extends ConsumerStatefulWidget {
  const AssistantChatScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<AssistantChatScreen> createState() => _AssistantChatScreenState();
}

class _AssistantChatScreenState extends ConsumerState<AssistantChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  String? _pending; // question shown while the AI answers
  final Map<String, bool> _rated = {};

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
      });

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _pending != null) return;
    setState(() => _pending = text);
    _input.clear();
    _toBottom();
    try {
      await ref.read(repositoryProvider).ask(widget.id, text);
      ref.invalidate(conversationProvider(widget.id));
      await ref.read(conversationProvider(widget.id).future);
    } catch (e) {
      _input.text = text;
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _pending = null);
      _toBottom();
    }
  }

  Future<void> _rate(ChatMessage m, bool helpful) async {
    setState(() => _rated[m.id] = helpful);
    try {
      await ref.read(repositoryProvider).rateAnswer(m.id, helpful);
    } catch (e) {
      if (mounted) {
        setState(() => _rated.remove(m.id));
        toast(context, ApiException.from(e).message);
      }
    }
  }

  Widget _footer(ChatMessage m) {
    final rated = _rated[m.id];
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        for (final s in m.sources)
          InkWell(
            onTap: s.url == null ? null : () => launchUrl(Uri.parse(s.url!), mode: LaunchMode.externalApplication),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(children: [
                const Icon(Icons.link, size: 14, color: AppColors.brand),
                const SizedBox(width: 4),
                Flexible(child: Text(s.label, style: const TextStyle(fontSize: 12, color: AppColors.brand))),
              ]),
            ),
          ),
        Row(mainAxisSize: MainAxisSize.min, children: [
          IconButton(
            visualDensity: VisualDensity.compact,
            iconSize: 16,
            tooltip: tr('Hữu ích', 'Helpful'),
            onPressed: rated == null ? () => _rate(m, true) : null,
            icon: Icon(rated == true ? Icons.thumb_up : Icons.thumb_up_outlined, color: AppColors.subtle),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            iconSize: 16,
            tooltip: tr('Chưa đúng', 'Not helpful'),
            onPressed: rated == null ? () => _rate(m, false) : null,
            icon: Icon(rated == false ? Icons.thumb_down : Icons.thumb_down_outlined, color: AppColors.subtle),
          ),
        ]),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(conversationProvider(widget.id));
    final messages = async.value?.messages ?? const <ChatMessage>[];
    return Scaffold(
      appBar: AppBar(title: Text(async.value?.title ?? tr('Trợ lý AI', 'AI assistant'), maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: Column(children: [
        Expanded(
          child: async.isLoading && !async.hasValue
              ? const Center(child: CircularProgressIndicator(color: AppColors.brand))
              : async.hasError && !async.hasValue
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: ErrorBox(error: async.error!, onRetry: () => ref.invalidate(conversationProvider(widget.id))),
                    )
                  : ListView(
                      controller: _scroll,
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (messages.isEmpty && _pending == null)
                          Padding(
                            padding: const EdgeInsets.only(top: 24),
                            child: Text(
                              tr('Hãy hỏi điều bạn muốn biết, ví dụ: “CV của tôi còn thiếu gì cho vị trí Frontend?”',
                                  'Ask anything, e.g. “What is my CV missing for a frontend role?”'),
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 14, height: 1.5, color: AppColors.subtle),
                            ),
                          ),
                        for (final m in messages)
                          ChatBubble(
                            text: m.text,
                            mine: m.fromUser,
                            name: m.fromUser ? null : 'CCV AI',
                            time: m.createdAt,
                            footer: m.fromUser ? null : _footer(m),
                          ),
                        if (_pending != null) ...[
                          ChatBubble(text: _pending!, mine: true),
                          ChatBubble(text: tr('Đang soạn câu trả lời… có thể mất vài phút.', 'Writing an answer… this can take a few minutes.'), mine: false, name: 'CCV AI'),
                        ],
                      ],
                    ),
        ),
        ChatComposer(
          controller: _input,
          sending: _pending != null,
          onSend: _send,
          hint: tr('Hỏi trợ lý…', 'Ask the assistant…'),
        ),
      ]),
    );
  }
}
