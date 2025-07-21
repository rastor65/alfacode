import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

Future<bool?> showConfirmationDialog(
  BuildContext context, {
  required String title,
  required String content,
  String confirmText = 'Aceptar',
  String cancelText = 'Cancelar',
  Color? confirmColor,
  Color? cancelColor,
}) async {
  return showDialog<bool>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          title,
          style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
        ),
        content: Text(
          content,
          style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(context).pop(false), // User cancels
            style: TextButton.styleFrom(
              foregroundColor: cancelColor ?? AppColors.grey,
              textStyle: AppTextStyles.buttonText.copyWith(
                color: cancelColor ?? AppColors.grey,
                fontWeight: FontWeight.normal,
              ),
            ),
            child: Text(cancelText),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true), // User confirms
            style: ElevatedButton.styleFrom(
              backgroundColor: confirmColor ?? AppColors.primary,
              foregroundColor: AppColors.textLight,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              textStyle: AppTextStyles.buttonText,
            ),
            child: Text(confirmText),
          ),
        ],
      );
    },
  );
}
