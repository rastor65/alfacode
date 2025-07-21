import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../data/models/animal_model.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';
import '../../../core/constants/app_constants.dart'; // Importa las constantes

class AnimalFormPage extends StatefulWidget {
  final String ownerUsername;
  final AnimalModel? animal;

  AnimalFormPage({required this.ownerUsername, this.animal});

  @override
  State<AnimalFormPage> createState() => _AnimalFormPageState();
}

class _AnimalFormPageState extends State<AnimalFormPage> {
  final _formKey = GlobalKey<FormState>();
  String name = '';
  String especie = '';
  String tipo = '';
  String raza = '';
  String sexo = '';
  String estadoSalud = '';
  DateTime fechaNacimiento = DateTime.now();
  String estadoReproductivo = '';
  File? _selectedImage;
  int? animalPadreKey;
  int? animalMadreKey;

  bool isEdit = false;
  bool _isSexLocked = false; // Nuevo: para controlar si el sexo está bloqueado
  List<MapEntry<dynamic, AnimalModel>> _availableParents = [];
  final AnimalLocalDataSource _animalDataSource = AnimalLocalDataSource();

  final Map<String, List<String>> especiesTipos = {
    'Vacuno': ['Vaca', 'Toro', 'Ternero'],
    'Ovino': ['Oveja'],
    'Porcino': ['Cerdo'],
    'Caprino': ['Cabra'],
    'Aves de Corral': ['Pollo', 'Pato', 'Pavo'],
  };

  @override
  void initState() {
    super.initState();
    _loadAvailableParents();
    if (widget.animal != null) {
      isEdit = true;
      name = widget.animal!.name;
      especie = widget.animal!.especie;
      tipo = widget.animal!.tipo;
      raza = widget.animal!.raza;
      sexo = widget.animal!.sexo;
      estadoSalud = widget.animal!.estadoSalud;
      fechaNacimiento = widget.animal!.fechaNacimiento;
      estadoReproductivo = widget.animal!.estadoReproductivo;
      if (widget.animal!.animalImagen != null && widget.animal!.animalImagen!.isNotEmpty) {
        _selectedImage = File(widget.animal!.animalImagen!);
      }
      animalPadreKey = widget.animal!.animalPadreKey;
      animalMadreKey = widget.animal!.animalMadreKey;
      _updateSexLock(tipo); // Inicializar el bloqueo del sexo
    }
  }

  void _updateSexLock(String selectedTipo) {
    if (selectedTipo == 'Vaca') {
      sexo = 'Hembra';
      _isSexLocked = true;
    } else if (selectedTipo == 'Toro') {
      sexo = 'Macho';
      _isSexLocked = true;
    } else {
      _isSexLocked = false;
      // Si el sexo actual no es válido para el nuevo tipo, resetearlo
      if (!AppConstants.animalSexos.contains(sexo)) {
        sexo = '';
      }
    }
  }

  Future<void> _loadAvailableParents() async {
    final allAnimals = await _animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
    setState(() {
      _availableParents = allAnimals.entries.toList();
      // En modo edición, excluir el animal actual de la lista de posibles padres/madres
      if (isEdit && widget.animal != null) {
        _availableParents.removeWhere((entry) => entry.key == widget.animal!.key);
      }
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    List<String> tiposDisponibles = especie.isNotEmpty
        ? especiesTipos[especie] ?? []
        : [];

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdit ? 'Editar animal' : 'Agregar animal'),
      ),
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
                        isEdit ? 'Modificar datos del animal' : 'Registrar nuevo animal',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      GestureDetector(
                        onTap: _pickImage,
                        child: CircleAvatar(
                          radius: 60,
                          backgroundColor: AppColors.primary.withOpacity(0.1),
                          backgroundImage: _selectedImage != null
                              ? FileImage(_selectedImage!) as ImageProvider
                              : null,
                          child: _selectedImage == null
                              ? Icon(
                                  Icons.camera_alt_outlined,
                                  size: 40,
                                  color: AppColors.primary,
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        initialValue: name,
                        decoration: InputDecoration(
                          labelText: 'Nombre',
                          prefixIcon: Icon(Icons.abc, color: AppColors.primary),
                        ),
                        onChanged: (val) => name = val,
                        validator: (val) =>
                            val!.isEmpty ? 'Ingrese el nombre del animal' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: especie.isNotEmpty ? especie : null,
                        items: especiesTipos.keys
                            .map((e) =>
                                DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) {
                          setState(() {
                            especie = val ?? '';
                            tipo = ''; // Reset tipo when especie changes
                            _updateSexLock(tipo); // Actualizar bloqueo de sexo
                          });
                        },
                        decoration: InputDecoration(
                          labelText: 'Especie',
                          prefixIcon: Icon(Icons.category, color: AppColors.primary),
                        ),
                        validator: (val) =>
                            val == null || val.isEmpty ? 'Seleccione una especie' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: tipo.isNotEmpty ? tipo : null,
                        items: tiposDisponibles
                            .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                            .toList(),
                        onChanged: (val) {
                          setState(() {
                            tipo = val ?? '';
                            _updateSexLock(tipo); // Actualizar bloqueo de sexo
                          });
                        },
                        decoration: InputDecoration(
                          labelText: 'Tipo', // Cambiado de 'Tipo / Raza' a 'Tipo'
                          prefixIcon: Icon(Icons.pets_outlined, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione un tipo' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: raza,
                        decoration: InputDecoration(
                          labelText: 'Raza',
                          prefixIcon: Icon(Icons.pets, color: AppColors.primary),
                        ),
                        onChanged: (val) => raza = val,
                        validator: (val) =>
                            val!.isEmpty ? 'Ingrese la raza del animal' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: sexo.isNotEmpty ? sexo : null,
                        items: AppConstants.animalSexos
                            .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                            .toList(),
                        onChanged: _isSexLocked ? null : (val) => setState(() => sexo = val ?? ''), // Deshabilitado si _isSexLocked es true
                        decoration: InputDecoration(
                          labelText: 'Sexo',
                          prefixIcon: Icon(Icons.group, color: AppColors.primary),
                          enabled: !_isSexLocked, // Controla si el campo está habilitado
                          fillColor: _isSexLocked ? AppColors.lightGrey.withOpacity(0.6) : AppColors.lightGrey.withOpacity(0.3),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione el sexo' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: estadoSalud.isNotEmpty ? estadoSalud : null,
                        items: AppConstants.animalEstadosSalud
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) => setState(() => estadoSalud = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Estado de Salud',
                          prefixIcon: Icon(Icons.health_and_safety, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione el estado de salud' : null,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: Text(
                          'Fecha de Nacimiento: ${fechaNacimiento.toLocal().toString().split(' ')[0]}',
                          style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
                        ),
                        trailing: Icon(Icons.calendar_today, color: AppColors.primary),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: fechaNacimiento,
                            firstDate: DateTime(1900),
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
                          if (picked != null) setState(() => fechaNacimiento = picked);
                        },
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: estadoReproductivo.isNotEmpty ? estadoReproductivo : null,
                        items: AppConstants.animalEstadosReproductivos
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) => setState(() => estadoReproductivo = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Estado Reproductivo',
                          prefixIcon: Icon(Icons.pregnant_woman, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione el estado reproductivo' : null,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<int>(
                        value: animalPadreKey,
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Ninguno')),
                          ..._availableParents
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
                          ..._availableParents
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

                          final newAnimal = AnimalModel(
                            name: name,
                            especie: especie,
                            tipo: tipo,
                            ownerUsername: widget.ownerUsername,
                            raza: raza,
                            sexo: sexo,
                            estadoSalud: estadoSalud,
                            fechaNacimiento: fechaNacimiento,
                            estadoReproductivo: estadoReproductivo,
                            animalImagen: _selectedImage?.path,
                            animalPadreKey: animalPadreKey,
                            animalMadreKey: animalMadreKey,
                          );

                          final dataSource = AnimalLocalDataSource();
                          if (isEdit && widget.animal != null) {
                            await dataSource.updateAnimal(widget.animal!.key as int, newAnimal);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Animal actualizado correctamente.');
                          } else {
                            await dataSource.addAnimal(newAnimal);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Animal agregado correctamente.');
                          }

                          Navigator.pop(context, true);
                        },
                        child: Text(isEdit ? 'Guardar cambios' : 'Agregar'),
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
