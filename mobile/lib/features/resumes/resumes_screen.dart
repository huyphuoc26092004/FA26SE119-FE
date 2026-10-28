import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/models.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';

/// Backend resume statuses: DRAFT, REVIEW_REQUIRED, READY (ARCHIVED is hidden).
String resumeStatusLabel(String status) => switch (status) {
      'READY' => tr('Sẵn sàng', 'Ready'),
      'REVIEW_REQUIRED' => tr('Cần xem lại', 'Needs review'),
      'DRAFT' => tr('Bản nháp', 'Draft'),
      _ => status,
    };

TagTone resumeStatusTone(String status) => switch (status) {
      'READY' => TagTone.brand,
      'REVIEW_REQUIRED' => TagTone.warn,
      _ => TagTone.neutral,
    };

class ResumesScreen extends ConsumerStatefulWidget {
  const ResumesScreen({super.key});
  @override
  ConsumerState<ResumesScreen> createState() => _ResumesScreenState();
}

class _ResumesScreenState extends ConsumerState<ResumesScreen> {
  String _filter = 'ALL';
  bool _uploading = false;

  Future<void> _upload() async {
    final picked = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'docx', 'txt'],
    );
    final file = picked.firstOrNull;
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final bytes = await file.readAsBytes();
      final resume = await ref.read(repositoryProvider).upload(bytes: bytes, fileName: file.name);
      ref.invalidate(resumesProvider);
      if (mounted) {
        toast(context, tr('Đã tải lên. Kiểm tra lại nội dung rồi xác nhận.', 'Uploaded. Review the content, then confirm.'));
        if (resume.id.isNotEmpty) context.push('/resumes/${resume.id}');
      }
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(resumesProvider);
    const filters = ['ALL', 'READY', 'REVIEW_REQUIRED', 'DRAFT'];
    return ScreenList(
      onRefresh: () async => ref.invalidate(resumesProvider),
      children: [
        BigButton(
          label: _uploading ? tr('Đang tải lên…', 'Uploading…') : tr('Tải lên CV (PDF, DOCX)', 'Upload a CV (PDF, DOCX)'),
          icon: Icons.upload_file,
          busy: _uploading,
          onPressed: _upload,
        ),
        PillRow(children: [
          for (final f in filters)
            Pill(
              label: f == 'ALL' ? tr('Tất cả', 'All') : resumeStatusLabel(f),
              active: _filter == f,
              onTap: () => setState(() => _filter = f),
            ),
        ]),
        ...async.when(
          loading: () => [const Skeleton()],
          error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(resumesProvider))],
          data: (all) {
            final list = all.where((r) => _filter == 'ALL' || r.status == _filter).toList();
            if (list.isEmpty) return [EmptyBox(title: tr('Chưa có CV nào ở mục này.', 'No CVs here yet.'))];
            return [for (final cv in list) _ResumeCard(cv)];
          },
        ),
      ],
    );
  }
}

class _ResumeCard extends StatelessWidget {
  const _ResumeCard(this.cv);
  final Resume cv;

  @override
  Widget build(BuildContext context) => AppCard(
        onTap: () => context.push('/resumes/${cv.id}'),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.description_outlined, color: AppColors.brand),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(cv.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, height: 1.3)),
                const SizedBox(height: 8),
                Wrap(spacing: 6, runSpacing: 6, children: [
                  if (cv.isPrimary) Tag(tr('CV chính', 'Primary CV'), tone: TagTone.brand),
                  Tag(resumeStatusLabel(cv.status), tone: resumeStatusTone(cv.status)),
                  if (cv.language != null) Tag(cv.language!.toUpperCase()),
                ]),
              ]),
            ),
          ]),
          const Divider(height: 24),
          Text(tr('Cập nhật ${relativeDate(cv.updatedAt)}', 'Updated ${relativeDate(cv.updatedAt)}'),
              style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
        ]),
      );
}
