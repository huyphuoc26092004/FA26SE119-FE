import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'config.dart';
import 'json.dart';

/// Access + refresh tokens, kept in the platform keystore.
class TokenStore {
  static const _storage = FlutterSecureStorage();
  static const _access = 'ccv_access_token';
  static const _refresh = 'ccv_refresh_token';

  String? access;
  String? refresh;

  Future<void> load() async {
    access = await _storage.read(key: _access);
    refresh = await _storage.read(key: _refresh);
  }

  Future<void> save(String accessToken, String? refreshToken) async {
    access = accessToken;
    refresh = refreshToken ?? refresh;
    await _storage.write(key: _access, value: access);
    if (refresh != null) await _storage.write(key: _refresh, value: refresh);
  }

  Future<void> clear() async {
    access = null;
    refresh = null;
    await _storage.delete(key: _access);
    await _storage.delete(key: _refresh);
  }
}

/// Readable message for any failed call.
class ApiException implements Exception {
  ApiException(this.message, {this.status});
  final String message;
  final int? status;
  @override
  String toString() => message;

  static ApiException from(Object e) {
    if (e is ApiException) return e;
    if (e is DioException) {
      final res = e.response;
      if (res == null) {
        return ApiException('Không kết nối được máy chủ (${AppConfig.apiBaseUrl}).');
      }
      final data = res.data;
      String? msg;
      if (data is Map) {
        msg = (data['message'] ?? data['detail'] ?? data['error'] ?? data['title'])?.toString();
      }
      if (res.statusCode == 503) msg ??= 'Tính năng AI đang tắt trên máy chủ.';
      return ApiException(msg ?? 'Lỗi ${res.statusCode}', status: res.statusCode);
    }
    return ApiException(e.toString());
  }
}

/// Dio with the bearer token attached and one silent refresh on 401
/// (access token lives 15 minutes, refresh token 30 days).
class ApiClient {
  ApiClient(this.tokens, {required this.onSessionExpired}) {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 60),
      headers: {'Content-Type': 'application/json'},
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final t = tokens.access;
        if (t != null && options.extra['noAuth'] != true) {
          options.headers['Authorization'] = 'Bearer $t';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final req = error.requestOptions;
        final canRetry = error.response?.statusCode == 401 &&
            req.extra['retried'] != true &&
            req.extra['noAuth'] != true &&
            tokens.refresh != null;
        if (!canRetry) return handler.next(error);
        try {
          await _refresh();
          req.extra['retried'] = true;
          req.headers['Authorization'] = 'Bearer ${tokens.access}';
          handler.resolve(await dio.fetch(req));
        } catch (_) {
          await tokens.clear();
          onSessionExpired();
          handler.next(error);
        }
      },
    ));
  }

  final TokenStore tokens;
  final void Function() onSessionExpired;
  late final Dio dio;
  Future<void>? _refreshing;

  Future<void> _refresh() {
    // Several requests can 401 at once; share one refresh call.
    return _refreshing ??= () async {
      try {
        final res = await dio.post(
          '/auth/refresh',
          data: {'refreshToken': tokens.refresh},
          options: Options(extra: {'noAuth': true}),
        );
        final body = asMap(res.data);
        final access = str(body, ['accessToken', 'access_token', 'token']);
        if (access == null) throw ApiException('Phiên đăng nhập đã hết hạn');
        await tokens.save(access, str(body, ['refreshToken', 'refresh_token']));
      } finally {
        _refreshing = null;
      }
    }();
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _wrap(() => dio.get(path, queryParameters: query));
  Future<dynamic> post(String path, {Object? data, bool auth = true}) =>
      _wrap(() => dio.post(path,
          data: data,
          options: Options(
            extra: {'noAuth': !auth},
            contentType: data is FormData ? 'multipart/form-data' : null,
          )));
  Future<dynamic> put(String path, {Object? data}) => _wrap(() => dio.put(path, data: data));
  Future<dynamic> patch(String path, {Object? data}) => _wrap(() => dio.patch(path, data: data));
  Future<dynamic> delete(String path) => _wrap(() => dio.delete(path));

  Future<dynamic> _wrap(Future<Response> Function() call) async {
    try {
      return (await call()).data;
    } catch (e) {
      throw ApiException.from(e);
    }
  }
}
