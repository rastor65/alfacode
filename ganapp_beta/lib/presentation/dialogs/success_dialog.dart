import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

Future<void> showSuccessDialog(
  BuildContext context, {
  required String title,
  required String message,
  Duration duration = const Duration(seconds: 2),
}) async {
  await showDialog<void>(
    context: context,
    barrierDismissible: false, // User must wait for dialog to close
    builder: (BuildContext context) {
      Future.delayed(duration, () {
        Navigator.of(context).pop(); // Dismiss the dialog after duration
      });
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        contentPadding: const EdgeInsets.all(20),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Lottie.asset(
              'assets/animations/success.json', // Placeholder para animación de éxito
              width: 100,
              height: 100,
              repeat: false,
              animate: true,
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: AppTextStyles.headline2.copyWith(color: AppColors.success),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              message,
              style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    },
  );
}
