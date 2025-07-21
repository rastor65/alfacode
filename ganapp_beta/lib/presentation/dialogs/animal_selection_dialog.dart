import 'package:flutter/material.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/animal_model.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../widgets/empty_state_message.dart';

class AnimalSelectionDialog extends StatefulWidget {
  final String ownerUsername;

  const AnimalSelectionDialog({super.key, required this.ownerUsername});

  @override
  State<AnimalSelectionDialog> createState() => _AnimalSelectionDialogState();
}

class _AnimalSelectionDialogState extends State<AnimalSelectionDialog> {
  final AnimalLocalDataSource _animalDataSource = AnimalLocalDataSource();
  List<MapEntry<dynamic, AnimalModel>> _animals = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnimals();
  }

  Future<void> _loadAnimals() async {
    final animalsWithKeys = await _animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
    if (!mounted) return;
    setState(() {
      _animals = animalsWithKeys.entries.toList()
        ..sort((a, b) => a.value.name.compareTo(b.value.name));
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        'Seleccionar Animal',
        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
        textAlign: TextAlign.center,
      ),
      // Envuelve el contenido principal en un SingleChildScrollView
      content: _isLoading
          ? const SizedBox(
              height: 150,
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            )
          : _animals.isEmpty
              ? SizedBox(
                  height: 150,
                  child: EmptyStateMessage(
                    icon: Icons.pets_outlined,
                    title: 'No hay animales',
                    message: 'Por favor, agrega un animal primero.',
                  ),
                )
              : SingleChildScrollView( // <--- Nuevo: Permite que el contenido del diálogo sea scrollable
                  child: SizedBox(
                    width: double.maxFinite,
                    // Eliminado el 'height: 300' fijo para permitir que el contenido se ajuste
                    child: ListView.builder(
                      shrinkWrap: true, // Importante: el ListView solo toma el espacio que necesita
                      physics: const NeverScrollableScrollPhysics(), // Importante: el scroll lo maneja el SingleChildScrollView padre
                      itemCount: _animals.length,
                      itemBuilder: (context, index) {
                        final animalEntry = _animals[index];
                        final animal = animalEntry.value;
                        final key = animalEntry.key;
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 0),
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.primary.withOpacity(0.1),
                              child: Icon(Icons.pets, color: AppColors.primary),
                            ),
                            title: Text(
                              animal.name,
                              style: AppTextStyles.subtitle1.copyWith(color: AppColors.textDark),
                            ),
                            subtitle: Text(
                              '${animal.especie} - ${animal.tipo}',
                              style: AppTextStyles.bodyText2.copyWith(color: AppColors.grey),
                            ),
                            onTap: () {
                              Navigator.of(context).pop(key); // Devuelve la clave del animal
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(), // Cierra el diálogo sin seleccionar
          style: TextButton.styleFrom(
            foregroundColor: AppColors.grey,
            textStyle: AppTextStyles.buttonText.copyWith(fontWeight: FontWeight.normal),
          ),
          child: const Text('Cancelar'),
        ),
      ],
    );
  }
}
