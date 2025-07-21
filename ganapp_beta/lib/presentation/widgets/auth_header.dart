import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class AuthHeader extends StatelessWidget {
  final Widget mediaWidget; // Puede ser Image.asset o Icon
  final String title;
  final String subtitle;
  final Color? subtitleColor; // Opcional para el color del subtítulo

  const AuthHeader({
    super.key,
    required this.mediaWidget,
    required this.title,
    required this.subtitle,
    this.subtitleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 120, // Ajustado para el GIF y el icono
            height: 120, // Ajustado para el GIF y el icono
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(60), // Para hacerlo circular
              color: AppColors.primary.withOpacity(0.1),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(60),
              child: mediaWidget,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: AppTextStyles.headline2.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: AppTextStyles.subtitle1.copyWith(
              color: subtitleColor ?? AppColors.accent, // Usa el color de acento por defecto
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
