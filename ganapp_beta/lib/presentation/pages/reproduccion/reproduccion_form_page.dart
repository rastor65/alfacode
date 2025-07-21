import 'package:flutter/material.dart';
import '../../../data/models/reproduccion_model.dart';
import '../../../data/datasources/reproduccion_local_datasource.dart';
import '../../../data/datasources/animal_local_datasource.dart'; // Para obtener nombres de animales
import '../../../data/models/animal_model.dart'; // Para el modelo de animal
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';
import '../../../core/constants/app_constants.dart'; // Para las constantes de reproducción

class ReproduccionFormPage extends StatefulWidget {
  final int animalId; // La clave del animal producto de esta reproducción
  final ReproduccionModel? reproduccion;
  ReproduccionFormPage({required this.animalId, this.reproduccion});

  @override
  State<ReproduccionFormPage> createState() => _ReproduccionFormPageState();
}

class _ReproduccionFormPageState extends State<ReproduccionFormPage> {
  final _formKey = GlobalKey<FormState>();
  String tipoReproduccion = '';
  DateTime fechaReproduccion = DateTime.now();
  DateTime? fechaEstimadaParto;
  String resultadoReproduccion = '';
  int? animalPadreKey;
  int? animalMadreKey;
  bool isEdit = false;

  List<MapEntry<dynamic, AnimalModel>> _availableAnimals = [];
  final AnimalLocalDataSource _animalDataSource = AnimalLocalDataSource();

  @override
  void initState() {
    super.initState();
    if (widget.reproduccion != null) {
      isEdit = true;
      tipoReproduccion = widget.reproduccion!.tipoReproduccion;
      fechaReproduccion = widget.reproduccion!.fechaReproduccion;
      fechaEstimadaParto = widget.reproduccion!.fechaEstimadaParto;
      resultadoReproduccion = widget.reproduccion!.resultadoReproduccion;
      // No inicializar animalPadreKey/MadreKey aquí directamente, se hará después de cargar _availableAnimals
    }
    _loadAvailableAnimals();
  }

  Future<void> _loadAvailableAnimals() async {
    final childAnimal = await _animalDataSource.getAnimalByKey(widget.animalId);
    if (!mounted) return;

    List<MapEntry<dynamic, AnimalModel>> tempAvailableAnimals = [];
    if (childAnimal != null) {
      final allAnimals = await _animalDataSource.getAnimalsWithKeysByOwner(childAnimal.ownerUsername);
      if (!mounted) return;
      tempAvailableAnimals = allAnimals.entries.toList()
        .where((entry) => entry.key != widget.animalId) // Excluir el animal "hijo"
        .toList();
    }

    setState(() {
      _availableAnimals = tempAvailableAnimals;

      // Ahora, si en modo edición, establecer las claves de los padres solo si son válidas dentro de los animales cargados
      if (isEdit && widget.reproduccion != null) {
        // Verificar si la clave inicial del padre está en la lista de machos disponibles
        if (widget.reproduccion!.animalPadreKey != null &&
            _availableAnimals.any((entry) => entry.key == widget.reproduccion!.animalPadreKey && entry.value.sexo == 'Macho')) {
          animalPadreKey = widget.reproduccion!.animalPadreKey;
        } else {
          animalPadreKey = null; // Establecer a null si no se encuentra o no es macho
        }

        // Verificar si la clave inicial de la madre está en la lista de hembras disponibles
        if (widget.reproduccion!.animalMadreKey != null &&
            _availableAnimals.any((entry) => entry.key == widget.reproduccion!.animalMadreKey && entry.value.sexo == 'Hembra')) {
          animalMadreKey = widget.reproduccion!.animalMadreKey;
        } else {
          animalMadreKey = null; // Establecer a null si no se encuentra o no es hembra
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar reproducción' : 'Registrar reproducción')),
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        isEdit ? 'Modificar registro de reproducción' : 'Nuevo registro de reproducción',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      DropdownButtonFormField<String>(
                        value: tipoReproduccion.isNotEmpty ? tipoReproduccion : null,
                        items: AppConstants.reproduccionTipos
                            .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                            .toList(),
                        onChanged: (val) => setState(() => tipoReproduccion = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Tipo de Reproducción',
                          prefixIcon: Icon(Icons.category, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione un tipo de reproducción' : null,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: Text(
                          'Fecha de Reproducción: ${fechaReproduccion.toLocal().toString().split(' ')[0]}',
                          style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
                        ),
                        trailing: Icon(Icons.calendar_today, color: AppColors.primary),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: fechaReproduccion,
                            firstDate: DateTime(2000),
                            lastDate: DateTime.now(),
                            builder: (context, child) {
                              return Theme(
                                data: Theme.of(context).copyWith(
                                  colorScheme: ColorScheme.light(
                                    primary: AppColors.primary,
                                    onPrimary: AppColors.textLight,
                                    onSurface: AppColors.textDark,
                                  ),
                                  textButtonTheme: TextButtonThemeData(
                                    style: TextButton.styleFrom(
                                      foregroundColor: AppColors.primaryDark,
                                    ),
                                  ),
                                ),
                                child: child!,
                              );
                            },
                          );
                          if (picked != null) setState(() => fechaReproduccion = picked);
                        },
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: Text(
                          'Fecha Estimada de Parto: ${fechaEstimadaParto?.toLocal().toString().split(' ')[0] ?? 'No definida'}',
                          style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
                        ),
                        trailing: Icon(Icons.calendar_month, color: AppColors.primary),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: fechaEstimadaParto ?? DateTime.now().add(Duration(days: 280)), // Gestación promedio
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(Duration(days: 365 * 5)),
                            builder: (context, child) {
                              return Theme(
                                data: Theme.of(context).copyWith(
                                  colorScheme: ColorScheme.light(
                                    primary: AppColors.primary,
                                    onPrimary: AppColors.textLight,
                                    onSurface: AppColors.textDark,
                                  ),
                                  textButtonTheme: TextButtonThemeData(
                                    style: TextButton.styleFrom(
                                      foregroundColor: AppColors.primaryDark,
                                    ),
                                  ),
                                ),
                                child: child!,
                              );
                            },
                          );
                          if (picked != null) setState(() => fechaEstimadaParto = picked);
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: resultadoReproduccion.isNotEmpty ? resultadoReproduccion : null,
                        items: AppConstants.reproduccionResultados
                            .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                            .toList(),
                        onChanged: (val) => setState(() => resultadoReproduccion = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Resultado de Reproducción',
                          prefixIcon: Icon(Icons.check_circle_outline, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione un resultado' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        value: animalPadreKey,
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Ninguno')),
                          ..._availableAnimals
                              .where((entry) => entry.value.sexo == 'Macho') // Solo machos
                              .map((entry) => DropdownMenuItem(value: entry.key as int, child: Text(entry.value.name)))
                              .toList(),
                        ],
                        onChanged: (val) => setState(() => animalPadreKey = val),
                        decoration: InputDecoration(
                          labelText: 'Animal Padre (Opcional)',
                          prefixIcon: Icon(Icons.male, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        value: animalMadreKey,
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Ninguno')),
                          ..._availableAnimals
                              .where((entry) => entry.value.sexo == 'Hembra') // Solo hembras
                              .map((entry) => DropdownMenuItem(value: entry.key as int, child: Text(entry.value.name)))
                              .toList(),
                        ],
                        onChanged: (val) => setState(() => animalMadreKey = val),
                        decoration: InputDecoration(
                          labelText: 'Animal Madre (Opcional)',
                          prefixIcon: Icon(Icons.female, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () async {
                          if (!_formKey.currentState!.validate()) return;
                          final newReproduccion = ReproduccionModel(
                            animalId: widget.animalId,
                            tipoReproduccion: tipoReproduccion,
                            fechaReproduccion: fechaReproduccion,
                            fechaEstimadaParto: fechaEstimadaParto,
                            resultadoReproduccion: resultadoReproduccion,
                            animalPadreKey: animalPadreKey,
                            animalMadreKey: animalMadreKey,
                          );
                          final dataSource = ReproduccionLocalDataSource();
                          if (isEdit && widget.reproduccion != null) {
                            await dataSource.updateReproduccion(widget.reproduccion!.key as int, newReproduccion);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Reproducción actualizada correctamente.');
                          } else {
                            await dataSource.addReproduccion(newReproduccion);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Reproducción registrada correctamente.');

                            // Lógica para crear un nuevo animal si la reproducción es un "Nacimiento"
                            if (newReproduccion.resultadoReproduccion == 'Nacimiento') {
                              if (newReproduccion.animalMadreKey != null) {
                                final madreAnimal = await _animalDataSource.getAnimalByKey(newReproduccion.animalMadreKey!);
                                if (madreAnimal != null) {
                                  final newBornAnimal = AnimalModel(
                                    name: 'Ternero de ${madreAnimal.name} - ${newReproduccion.fechaEstimadaParto?.toLocal().toString().split(' ')[0] ?? newReproduccion.fechaReproduccion.toLocal().toString().split(' ')[0]}',
                                    especie: madreAnimal.especie, // Hereda la especie de la madre
                                    tipo: 'Ternero', // Tipo por defecto
                                    ownerUsername: madreAnimal.ownerUsername, // Hereda el propietario de la madre
                                    raza: madreAnimal.raza, // Hereda la raza de la madre
                                    sexo: '', // El sexo del ternero se puede definir después del nacimiento
                                    estadoSalud: 'Sano',
                                    fechaNacimiento: newReproduccion.fechaEstimadaParto ?? newReproduccion.fechaReproduccion,
                                    estadoReproductivo: 'Joven',
                                    animalImagen: null, // Sin imagen por defecto
                                    animalPadreKey: newReproduccion.animalPadreKey,
                                    animalMadreKey: newReproduccion.animalMadreKey,
                                  );
                                  await _animalDataSource.addAnimal(newBornAnimal);
                                  await showSuccessDialog(context, title: '¡Nuevo Animal!', message: 'Se ha registrado un nuevo ternero: ${newBornAnimal.name}.');
                                }
                              } else {
                                // Manejar caso donde no hay madre para un nacimiento
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Advertencia: No se pudo crear el ternero automáticamente, falta la madre.'), backgroundColor: AppColors.accent),
                                );
                              }
                            }
                          }
                          Navigator.pop(context, true);
                        },
                        child: Text(isEdit ? 'Guardar cambios' : 'Registrar'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
