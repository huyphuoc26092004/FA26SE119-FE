import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';

final _draftsProvider = FutureProvider.autoDispose
    .family<List<ApplicationDraft>, String?>(
      (ref, jobId) =>
          ref.watch(repositoryProvider).applicationDrafts(jobId: jobId),
    );

class ApplicationDraftsScreen extends ConsumerStatefulWidget {
  const ApplicationDraftsScreen({super.key, this.jobId});
  final String? jobId;

  @override
  ConsumerState<ApplicationDraftsScreen> createState() =>
      _ApplicationDraftsScreenState();
}

class _ApplicationDraftsScreenState
    extends ConsumerState<ApplicationDraftsScreen> {
  bool _generating = false;

  Future<void> _generate() async {
    setState(() => _generating = true);
    try {
      final resumes = (await ref.read(
        resumesProvider.future,
      )).where((cv) => cv.status == 'READY').toList();
      if (!mounted) return;
      if (resumes.isEmpty) {
        toast(
          context,
          tr('Cần ít nhất một CV đã xác nhận.', 'Confirm a CV first.'),
        );
        return;
      }
      final choice = await showDialog<({String resumeId, String language})>(
        context: context,
        builder: (context) {
          var resume = resumes.firstWhere(
            (cv) => cv.isPrimary,
            orElse: () => resumes.first,
          );
          var language = AppLanguage.vi.value ? 'vi' : 'en';
          return StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
              title: Text(
                tr('Tạo bản nháp ứng tuyển', 'Generate application drafts'),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButton<String>(
                    isExpanded: true,
                    value: resume.id,
                    items: [
                      for (final cv in resumes)
                        DropdownMenuItem(
                          value: cv.id,
                          child: Text(cv.name, overflow: TextOverflow.ellipsis),
                        ),
                    ],
                    onChanged: (id) => setDialogState(
                      () => resume = resumes.firstWhere((cv) => cv.id == id),
                    ),
                  ),
                  DropdownButton<String>(
                    isExpanded: true,
                    value: language,
                    items: const [
                      DropdownMenuItem(value: 'vi', child: Text('Tiếng Việt')),
                      DropdownMenuItem(value: 'en', child: Text('English')),
                    ],
                    onChanged: (value) =>
                        setDialogState(() => language = value!),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(tr('Hủy', 'Cancel')),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, (
                    resumeId: resume.id,
                    language: language,
                  )),
                  child: Text(tr('Tạo bản nháp', 'Generate')),
                ),
              ],
            ),
          );
        },
      );
      if (choice == null || !mounted) return;
      final drafts = await ref
          .read(repositoryProvider)
          .generateApplicationDrafts(
            widget.jobId!,
            choice.resumeId,
            choice.language,
          );
      if (!mounted) return;
      ref.invalidate(_draftsProvider);
      final email = drafts.where((draft) => draft.isEmail).firstOrNull;
      if (email != null) await _edit(email);
    } catch (error) {
      if (mounted) toast(context, ApiException.from(error).message);
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _edit(ApplicationDraft draft) async {
    final changed = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(builder: (_) => _DraftEditor(draft: draft)));
    if (changed == true && mounted) ref.invalidate(_draftsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final drafts = ref.watch(_draftsProvider(widget.jobId));
    return Scaffold(
      appBar: AppBar(title: Text(tr('Hỗ trợ ứng tuyển', 'Application help'))),
      body: ScreenList(
        children: [
          if (widget.jobId != null)
            BigButton(
              label: tr(
                'AI viết bản nháp ứng tuyển',
                'Generate application drafts',
              ),
              busy: _generating,
              onPressed: _generate,
            ),
          if (widget.jobId == null)
            Text(
              tr(
                'Mở một việc làm để tạo bản nháp mới.',
                'Open a job to generate new drafts.',
              ),
            ),
          drafts.when(
            loading: () => const Skeleton(),
            error: (error, _) => ErrorBox(
              error: error,
              onRetry: () => ref.invalidate(_draftsProvider(widget.jobId)),
            ),
            data: (items) => items.isEmpty
                ? Text(tr('Chưa có bản nháp đã lưu.', 'No saved drafts.'))
                : ListGroup(
                    children: [
                      for (final draft in items)
                        ListRowTile(
                          icon: draft.isEmail
                              ? Icons.mail_outline
                              : Icons.description_outlined,
                          title: _draftTitle(draft),
                          detail: draft.content.split('\n').first,
                          onTap: () => _edit(draft),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

String _draftTitle(ApplicationDraft draft) => draft.isEmail
    ? tr('Email ứng tuyển', 'Application email')
    : tr('Thư xin việc', 'Cover letter');

class _DraftEditor extends ConsumerStatefulWidget {
  const _DraftEditor({required this.draft});
  final ApplicationDraft draft;

  @override
  ConsumerState<_DraftEditor> createState() => _DraftEditorState();
}

class _DraftEditorState extends ConsumerState<_DraftEditor> {
  final _subject = TextEditingController();
  final _content = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final text = widget.draft.content;
    final separator = widget.draft.isEmail ? text.indexOf('\n\n') : -1;
    _subject.text = separator < 0 ? '' : text.substring(0, separator);
    _content.text = separator < 0 ? text : text.substring(separator + 2);
  }

  @override
  void dispose() {
    _subject.dispose();
    _content.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_content.text.trim().isEmpty) {
      toast(context, tr('Nhập nội dung bản nháp.', 'Enter the draft content.'));
      return;
    }
    setState(() => _saving = true);
    try {
      final subject = _subject.text.trim();
      await ref
          .read(repositoryProvider)
          .saveApplicationDraft(
            widget.draft.id,
            subject.isEmpty ? _content.text : '$subject\n\n${_content.text}',
          );
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) toast(context, ApiException.from(error).message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(_draftTitle(widget.draft))),
    body: ScreenList(
      children: [
        if (widget.draft.isEmail)
          TextField(
            controller: _subject,
            enabled: !_saving,
            decoration: InputDecoration(
              labelText: tr('Tiêu đề email', 'Subject'),
            ),
          ),
        TextField(
          controller: _content,
          enabled: !_saving,
          minLines: 8,
          maxLines: null,
          decoration: InputDecoration(labelText: tr('Nội dung', 'Content')),
        ),
        BigButton(
          label: tr('Lưu bản nháp', 'Save draft'),
          busy: _saving,
          onPressed: _save,
        ),
      ],
    ),
  );
}
