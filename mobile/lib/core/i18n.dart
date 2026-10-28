import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Vietnamese / English switch. Screens keep their own short strings and
/// pick one with `tr('…', '…')`, the same way the web mobile screens did.
class AppLanguage {
  static final vi = ValueNotifier<bool>(true);
  static const _key = 'ccv_language_vi';

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    vi.value = prefs.getBool(_key) ?? true;
  }

  static Future<void> toggle() async {
    vi.value = !vi.value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, vi.value);
  }

  static String get locale => vi.value ? 'vi_VN' : 'en_US';
}

String tr(String vi, String en) => AppLanguage.vi.value ? vi : en;
