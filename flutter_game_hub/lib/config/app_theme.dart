import 'package:flutter/material.dart';

class AppTheme {
  static const Color background = Color(0xFF0A0A0F);
  static const Color surfaceElevated = Color(0xFF141420);
  static const Color surfaceHover = Color(0xFF1F1F2E);
  
  static const Color primaryGold = Color(0xFFF7931A);
  static const Color secondaryPurple = Color(0xFF7C3AED);
  static const Color successEmerald = Color(0xFF10B981);
  static const Color dangerRuby = Color(0xFFDC2626);

  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA1A1AA);
  static const Color textMuted = Color(0xFF71717A);

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: background,
    primaryColor: primaryGold,
    colorScheme: const ColorScheme.dark(
      primary: primaryGold,
      secondary: secondaryPurple,
      surface: surfaceElevated,
      error: dangerRuby,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: background,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontFamily: 'Orbitron',
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: textPrimary,
      ),
    ),
    cardTheme: CardTheme(
      color: surfaceElevated,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: Colors.white.withOpacity(0.1)),
      ),
    ),
  );
}
