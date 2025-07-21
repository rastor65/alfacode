import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class CustomAuthTextField extends StatelessWidget {
  final String labelText;
  final String? hintText;
  final IconData prefixIcon;
  final TextInputType? keyboardType;
  final ValueChanged<String> onChanged;
  final FormFieldValidator<String>? validator;
  final String? initialValue;

  const CustomAuthTextField({
    super.key,
    required this.labelText,
    this.hintText,
    required this.prefixIcon,
    this.keyboardType,
    required this.onChanged,
    this.validator,
    this.initialValue,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      initialValue: initialValue,
      decoration: InputDecoration(
        labelText: labelText,
        hintText: hintText,
        prefixIcon: Icon(
          prefixIcon,
          color: AppColors.primary,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppColors.primary,
            width: 2,
          ),
        ),
      ),
      keyboardType: keyboardType,
      onChanged: onChanged,
      validator: validator,
    );
  }
}
