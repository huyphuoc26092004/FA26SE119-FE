import 'package:flutter/foundation.dart';

/// Backend base URL. Override with
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8080/api/v1`.
///
/// Defaults: the Android emulator reaches the Mac's localhost via 10.0.2.2,
/// the iOS simulator and web use localhost directly.
class AppConfig {
  static const _fromEnv = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_fromEnv.isNotEmpty) return _fromEnv;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8080/api/v1';
    }
    return 'http://localhost:8080/api/v1';
  }
}
