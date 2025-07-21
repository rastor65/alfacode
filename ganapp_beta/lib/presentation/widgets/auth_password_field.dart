import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class AuthPasswordField extends StatefulWidget {
  final String labelText;
  final String? hintText;
  final ValueChanged<String> onChanged;
  final FormFieldValidator<String>? validator;

  const AuthPasswordField({
    super.key,
    required this.labelText,
    this.hintText,
    required this.onChanged,
    this.validator,
  });

  @override
  State<AuthPasswordField> createState() => _AuthPasswordFieldState();
}

class _AuthPasswordFieldState extends State<AuthPasswordField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      decoration: InputDecoration(
        labelText: widget.labelText,
        hintText: widget.hintText,
        prefixIcon: const Icon(
          Icons.lock_outline,
          color: AppColors.primary,
        ),
        suffixIcon: IconButton(
          icon: Icon(
            _obscureText ? Icons.visibility_off : Icons.visibility,
            color: AppColors.grey,
          ),
          onPressed: () {
            setState(() {
              _obscureText = !_obscureText;
            });
          },
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
      obscureText: _obscureText,
      onChanged: widget.onChanged,
      validator: widget.validator,
    );
  }
}
