import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../dialogs/confirmation_dialog.dart'; // Importa el diálogo de confirmación

class CommonListItem extends StatelessWidget {
  final dynamic itemKey;
  final Widget leading;
  final Widget title;
  final Widget subtitle;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final Future<bool?> Function(DismissDirection)? confirmDismiss;
  final ValueChanged<DismissDirection>? onDismissed;

  const CommonListItem({
    super.key,
    required this.itemKey,
    required this.leading,
    required this.title,
    required this.subtitle,
    this.onTap,
    this.onEdit,
    this.confirmDismiss,
    this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(itemKey), // Unique key for each item
      direction: DismissDirection.endToStart, // Swipe left to delete
      background: Container(
        color: AppColors.error,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: const Icon(Icons.delete, color: Colors.white, size: 36),
      ),
      confirmDismiss: confirmDismiss ??
          (direction) async {
            if (direction == DismissDirection.endToStart) {
              return await showConfirmationDialog(
                context,
                title: 'Confirmar Eliminación',
                content: '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.',
                confirmText: 'Eliminar',
                confirmColor: AppColors.error,
              );
            }
            return false;
          },
      onDismissed: onDismissed,
      child: Card(
        elevation: 4,
        margin: const EdgeInsets.symmetric(vertical: 8.0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: Colors.white,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          leading: leading,
          title: title,
          subtitle: subtitle,
          onTap: onTap,
          trailing: onEdit != null
              ? IconButton(
                  icon: Icon(Icons.edit, color: AppColors.primaryDark),
                  onPressed: onEdit,
                )
              : null,
        ),
      ),
    );
  }
}
