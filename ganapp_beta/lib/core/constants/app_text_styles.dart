import 'package:flutter/material.dart';
import 'app_colors.dart'; // Importación relativa

class AppTextStyles {
  static const TextStyle headline1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: AppColors.textDark,
  );
  static const TextStyle headline2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: AppColors.textDark,
  );
  static const TextStyle subtitle1 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.textDark,
  );
  static const TextStyle bodyText1 = TextStyle(
    fontSize: 16,
    color: AppColors.textDark,
  );
  static const TextStyle bodyText2 = TextStyle(
    fontSize: 14,
    color: AppColors.textDark,
  );
  static const TextStyle buttonText = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.textLight,
  );
  static const TextStyle linkText = TextStyle(
    fontSize: 14,
    color: AppColors.primaryDark,
    decoration: TextDecoration.underline,
  );
  static const TextStyle errorText = TextStyle(
    fontSize: 14,
    color: AppColors.error,
  );
}
