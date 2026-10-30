import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../data/repository.dart';
import '../../widgets/kit.dart';
import '../auth/auth_controller.dart';

Widget _label(String text) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
    );

/// Name and GitHub link (PUT /me).
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});
  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final _name = TextEditingController(text: ref.read(authProvider).user?.name ?? '');
  late final _github = TextEditingController(text: ref.read(authProvider).user?.githubUrl ?? '');
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _github.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final user = ref.read(authProvider).user;
    setState(() => _busy = true);
    try {
      await ref.read(repositoryProvider).updateMe(
            fullName: _name.text,
            githubUrl: _github.text,
            avatarUrl: user?.avatarUrl,
            language: user?.preferredLanguage,
          );
      await ref.read(authProvider.notifier).reloadUser();
      if (mounted) {
        toast(context, tr('Đã lưu hồ sơ', 'Profile saved'));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) toast(context, ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = ref.watch(authProvider).user?.email ?? '';
    return Scaffold(
      appBar: AppBar(title: Text(tr('Thông tin cá nhân', 'Personal info'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _label('Email'),
        TextField(controller: TextEditingController(text: email), enabled: false),
        const SizedBox(height: 16),
        _label(tr('Họ và tên', 'Full name')),
        TextField(controller: _name, onChanged: (_) => setState(() {})),
        const SizedBox(height: 16),
        _label('GitHub'),
        TextField(
          controller: _github,
          keyboardType: TextInputType.url,
          decoration: const InputDecoration(hintText: 'https://github.com/…'),
        ),
        const SizedBox(height: 24),
        BigButton(label: tr('Lưu', 'Save'), busy: _busy, onPressed: _name.text.trim().isEmpty ? null : _save),
      ]),
    );
  }
}

/// PUT /me/password; the backend wants 10–72 characters.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_next.text.length < 10) {
      setState(() => _error = tr('Mật khẩu mới cần ít nhất 10 ký tự.', 'The new password needs at least 10 characters.'));
      return;
    }
    if (_next.text != _confirm.text) {
      setState(() => _error = tr('Hai mật khẩu mới không giống nhau.', 'The new passwords do not match.'));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(repositoryProvider).changePassword(_current.text, _next.text);
      if (mounted) {
        toast(context, tr('Đã đổi mật khẩu', 'Password changed'));
        Navigator.of(context).pop();
      }
    } catch (e) {
      final err = ApiException.from(e);
      if (mounted) {
        setState(() => _error = err.status == 401 ? tr('Mật khẩu hiện tại không đúng.', 'The current password is wrong.') : err.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ready = _current.text.isNotEmpty && _next.text.isNotEmpty && _confirm.text.isNotEmpty;
    return Scaffold(
      appBar: AppBar(title: Text(tr('Đổi mật khẩu', 'Change password'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _label(tr('Mật khẩu hiện tại', 'Current password')),
        TextField(controller: _current, obscureText: true, onChanged: (_) => setState(() {})),
        const SizedBox(height: 16),
        _label(tr('Mật khẩu mới', 'New password')),
        TextField(
          controller: _next,
          obscureText: true,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(hintText: tr('Ít nhất 10 ký tự', 'At least 10 characters')),
        ),
        const SizedBox(height: 16),
        _label(tr('Nhập lại mật khẩu mới', 'Repeat new password')),
        TextField(controller: _confirm, obscureText: true, onChanged: (_) => setState(() {})),
        const SizedBox(height: 16),
        if (_error != null) ...[
          Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 14)),
          const SizedBox(height: 16),
        ],
        BigButton(label: tr('Đổi mật khẩu', 'Change password'), busy: _busy, onPressed: ready ? _save : null),
      ]),
    );
  }
}

/// Signed-in devices; signing one out revokes its refresh token.
class SessionsScreen extends ConsumerWidget {
  const SessionsScreen({super.key});

  String _date(DateTime? d) => d == null
      ? '—'
      : '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} '
          '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(sessionsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('Phiên đăng nhập', 'Sign-in sessions'))),
      body: ScreenList(
        onRefresh: () async => ref.invalidate(sessionsProvider),
        children: [
          Text(
            tr('Mỗi dòng là một thiết bị đang đăng nhập. Đăng xuất một phiên lạ nếu bạn không nhận ra nó.',
                'Each row is a signed-in device. Sign out any session you do not recognise.'),
            style: const TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted),
          ),
          ...async.when(
            loading: () => [const Skeleton(rows: 2)],
            error: (e, _) => [ErrorBox(error: e, onRetry: () => ref.invalidate(sessionsProvider))],
            data: (list) => list.isEmpty
                ? [EmptyBox(title: tr('Không có phiên nào.', 'No sessions.'))]
                : [
                    ListGroup(children: [
                      for (final s in list)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
                          child: Row(children: [
                            const Icon(Icons.devices_outlined, color: AppColors.brand),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('${tr('Đăng nhập', 'Signed in')} ${_date(s.createdAt)}', style: const TextStyle(fontSize: 14)),
                                Text('${tr('Hết hạn', 'Expires')} ${_date(s.expiresAt)}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.subtle)),
                              ]),
                            ),
                            TextButton(
                              style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                              onPressed: () async {
                                try {
                                  await ref.read(repositoryProvider).revokeSession(s.id);
                                  ref.invalidate(sessionsProvider);
                                } catch (e) {
                                  if (context.mounted) toast(context, ApiException.from(e).message);
                                }
                              },
                              child: Text(tr('Đăng xuất', 'Sign out')),
                            ),
                          ]),
                        ),
                    ]),
                  ],
          ),
        ],
      ),
    );
  }
}
