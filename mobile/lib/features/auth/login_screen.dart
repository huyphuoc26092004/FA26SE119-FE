import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/i18n.dart';
import '../../core/theme.dart';
import '../../widgets/kit.dart';
import 'auth_controller.dart';

class CcvMark extends StatelessWidget {
  const CcvMark({super.key, this.height = 30});
  final double height;

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: height,
          height: height,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: AppColors.ink, borderRadius: BorderRadius.circular(height * .28)),
          child: Text('C', style: TextStyle(color: AppColors.mint, fontSize: height * .55, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(width: 8),
        Text('CCV', style: TextStyle(fontSize: height * .6, fontWeight: FontWeight.w600, letterSpacing: .5)),
      ]);
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _show = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).login(_email.text, _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _email.text.isNotEmpty && _password.text.isNotEmpty;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
          children: [
            Row(children: [
              const CcvMark(),
              const Spacer(),
              TextButton(
                onPressed: AppLanguage.toggle,
                style: TextButton.styleFrom(foregroundColor: AppColors.muted),
                child: Text(tr('English', 'Tiếng Việt')),
              ),
            ]),
            const SizedBox(height: 48),
            Text(tr('Chào mừng trở lại', 'Welcome back'),
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w500, height: 1.2)),
            const SizedBox(height: 8),
            Text(tr('Đăng nhập để xem việc làm phù hợp và CV của bạn.', 'Sign in to see matching jobs and your CVs.'),
                style: const TextStyle(fontSize: 15, height: 1.5, color: AppColors.muted)),
            const SizedBox(height: 32),
            _label('Email'),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(hintText: 'ten@email.com'),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 16),
            _label(tr('Mật khẩu', 'Password')),
            TextField(
              controller: _password,
              obscureText: !_show,
              autofillHints: const [AutofillHints.password],
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => canSubmit ? _submit() : null,
              decoration: InputDecoration(
                suffixIcon: IconButton(
                  icon: Icon(_show ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.subtle),
                  onPressed: () => setState(() => _show = !_show),
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.danger50, borderRadius: BorderRadius.circular(16)),
                child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontSize: 14)),
              ),
              const SizedBox(height: 16),
            ],
            BigButton(
              label: _busy ? tr('Đang đăng nhập…', 'Signing in…') : tr('Đăng nhập', 'Sign in'),
              busy: _busy,
              onPressed: canSubmit ? _submit : null,
            ),
            const SizedBox(height: 40),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(tr('Chưa có tài khoản?', "Don't have an account?"), style: const TextStyle(color: AppColors.muted)),
              TextButton(
                onPressed: () => context.push('/register'),
                style: TextButton.styleFrom(foregroundColor: AppColors.brand),
                child: Text(tr('Đăng ký', 'Sign up'), style: const TextStyle(fontWeight: FontWeight.w500)),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

Widget _label(String text) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
    );

/// Sign up with email + password, then confirm the OTP sent by email.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();
  bool _otpStep = false;
  bool _busy = false;
  String? _error;

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// With AUTH_EXPOSE_DEV_OTP=true the backend returns the OTP as
  /// `developmentCode` instead of emailing it; prefill it for local testing.
  void _fillDevCode(dynamic res) {
    final code = res is Map ? res['developmentCode']?.toString() : null;
    if (code != null) _code.text = code;
  }

  Future<void> _register() => _run(() async {
        final res = await ref.read(apiClientProvider).post('/auth/register', auth: false, data: {
          'fullName': _name.text.trim(),
          'email': _email.text.trim(),
          'password': _password.text,
          'preferredLanguage': AppLanguage.vi.value ? 'vi' : 'en',
        });
        _fillDevCode(res);
        setState(() => _otpStep = true);
      });

  Future<void> _verify() => _run(() async {
        await ref.read(apiClientProvider).post('/auth/verify-email', auth: false, data: {
          'email': _email.text.trim(),
          'code': _code.text.trim(),
        });
        await ref.read(authProvider.notifier).login(_email.text, _password.text);
      });

  Future<void> _resend() => _run(() async {
        _fillDevCode(await ref.read(apiClientProvider).post('/auth/resend-code', auth: false, data: {'email': _email.text.trim()}));
        if (mounted) toast(context, tr('Đã gửi lại mã', 'Code sent again'));
      });

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('Tạo tài khoản', 'Create account'))),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          if (!_otpStep) ...[
            _label(tr('Họ và tên', 'Full name')),
            TextField(controller: _name),
            const SizedBox(height: 16),
            _label('Email'),
            TextField(controller: _email, keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 16),
            _label(tr('Mật khẩu', 'Password')),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: InputDecoration(hintText: tr('Ít nhất 10 ký tự', 'At least 10 characters')),
            ),
          ] else ...[
            Text(tr('Nhập mã 6 số đã gửi tới ${_email.text}.', 'Enter the 6-digit code sent to ${_email.text}.'),
                style: const TextStyle(fontSize: 15, height: 1.5)),
            const SizedBox(height: 16),
            TextField(controller: _code, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '000000')),
            TextButton(onPressed: _busy ? null : _resend, child: Text(tr('Gửi lại mã', 'Resend code'))),
          ],
          const SizedBox(height: 16),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: AppColors.danger)),
            const SizedBox(height: 16),
          ],
          BigButton(
            label: _otpStep ? tr('Xác minh và đăng nhập', 'Verify and sign in') : tr('Đăng ký', 'Sign up'),
            busy: _busy,
            onPressed: _otpStep ? _verify : _register,
          ),
        ]),
      );
}
