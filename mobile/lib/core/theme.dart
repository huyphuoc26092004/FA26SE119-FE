import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// CCV tokens, same values as the web (src/index.css @theme).
class AppColors {
  static const brand = Color(0xFF1F5F4C);
  static const brand50 = Color(0xFFE8F0EC);
  static const brand700 = Color(0xFF1A4F40);
  static const ink = Color(0xFF17201C);
  static const canvas = Color(0xFFF3F4F0);
  static const surface = Color(0xFFFBFBF9);
  static const border = Color(0xFFDCDFD8);
  static const muted = Color(0xFF5B6560);
  static const subtle = Color(0xFF8A928D);
  static const slate100 = Color(0xFFECEEEA);
  static const slate200 = Color(0xFFE1E4DF);
  static const warning = Color(0xFF8A5A12);
  static const warning50 = Color(0xFFFBF3E4);
  static const danger = Color(0xFFA33A2C);
  static const danger50 = Color(0xFFFBEDEA);
  static const night = Color(0xFF14231E);
  static const mint = Color(0xFF9FD3BC);
}

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brand,
      primary: AppColors.brand,
      surface: AppColors.canvas,
      onSurface: AppColors.ink,
      error: AppColors.danger,
    ),
    scaffoldBackgroundColor: AppColors.canvas,
  );
  final text = GoogleFonts.beVietnamProTextTheme(base.textTheme).apply(
    bodyColor: AppColors.ink,
    displayColor: AppColors.ink,
  );
  return base.copyWith(
    textTheme: text,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.canvas,
      surfaceTintColor: Colors.transparent,
      foregroundColor: AppColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: text.titleMedium?.copyWith(fontSize: 17, fontWeight: FontWeight.w500),
      shape: const Border(bottom: BorderSide(color: AppColors.border)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.brand50,
      surfaceTintColor: Colors.transparent,
      height: 64,
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => TextStyle(
          fontSize: 11,
          color: s.contains(WidgetState.selected) ? AppColors.brand : AppColors.muted,
        ),
      ),
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(
          size: 22,
          color: s.contains(WidgetState.selected) ? AppColors.brand : AppColors.muted,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppColors.brand),
      ),
      hintStyle: const TextStyle(color: AppColors.subtle),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.ink,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    dividerTheme: const DividerThemeData(color: AppColors.border, thickness: 1, space: 1),
  );
}
