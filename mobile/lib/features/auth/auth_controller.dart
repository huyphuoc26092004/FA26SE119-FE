import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/json.dart';
import '../../data/models.dart';

enum AuthStatus { loading, signedOut, signedIn }

class AuthState {
  const AuthState(this.status, [this.user]);
  final AuthStatus status;
  final AppUser? user;
}

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient(
      ref.watch(tokenStoreProvider),
      onSessionExpired: () => ref.read(authProvider.notifier).sessionExpired(),
    ));

class AuthController extends Notifier<AuthState> {
  ApiClient get _api => ref.read(apiClientProvider);
  TokenStore get _tokens => ref.read(tokenStoreProvider);

  @override
  AuthState build() {
    _restore();
    return const AuthState(AuthStatus.loading);
  }

  /// Reopens the last session if a token is stored.
  Future<void> _restore() async {
    await _tokens.load();
    if (_tokens.access == null) {
      state = const AuthState(AuthStatus.signedOut);
      return;
    }
    try {
      state = AuthState(AuthStatus.signedIn, await _loadMe());
    } catch (_) {
      await _tokens.clear();
      state = const AuthState(AuthStatus.signedOut);
    }
  }

  Future<AppUser> _loadMe() async => AppUser.fromJson(asMap(await _api.get('/me')));

  /// Login only returns tokens; the role comes from GET /me.
  Future<void> login(String email, String password) async {
    final body = asMap(await _api.post('/auth/login',
        data: {'email': email.trim(), 'password': password}, auth: false));
    final access = str(body, ['accessToken', 'access_token', 'token']);
    if (access == null) throw ApiException('Máy chủ không trả về token');
    await _tokens.save(access, str(body, ['refreshToken', 'refresh_token']));
    final user = await _loadMe();
    state = AuthState(AuthStatus.signedIn, user);
  }

  Future<void> logout() async {
    final refresh = _tokens.refresh;
    try {
      await _api.post('/auth/logout', data: {'refreshToken': ?refresh});
    } catch (_) {
      // Signing out locally is enough if the server call fails.
    }
    await _tokens.clear();
    state = const AuthState(AuthStatus.signedOut);
  }

  void sessionExpired() => state = const AuthState(AuthStatus.signedOut);
}

final authProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);
