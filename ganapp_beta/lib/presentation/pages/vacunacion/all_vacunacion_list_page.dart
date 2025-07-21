import 'package:flutter/material.dart';
import '../../../data/datasources/vacunacion_local_datasource.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/vacunacion_model.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';
import '../../dialogs/animal_selection_dialog.dart'; // Importa el nuevo diálogo

class AllVacunacionListPage extends StatefulWidget {
  final String ownerUsername; // Ahora recibe el ownerUsername
  const AllVacunacionListPage({super.key, required this.ownerUsername});

  @override
  State<AllVacunacionListPage> createState() => _AllVacunacionListPageState();
}

class _AllVacunacionListPageState extends State<AllVacunacionListPage> {
  final VacunacionLocalDataSource vacunacionDataSource = VacunacionLocalDataSource();
  final AnimalLocalDataSource animalDataSource = AnimalLocalDataSource();
  Map<String, List<MapEntry<dynamic, VacunacionModel>>> _groupedVacunaciones = {};
  List<MapEntry<dynamic, VacunacionModel>> _allVacunacionesSorted = [];
  List<String> _tabNames = [];
  Map<int, String> _animalNames = {};

  @override
  void initState() {
    super.initState();
    _loadVacunaciones();
  }

  Future<void> _loadVacunaciones() async {
    final allVacunacionesWithKeys = await vacunacionDataSource.getAllVacunacionesWithKeys();
    final Map<String, List<MapEntry<dynamic, VacunacionModel>>> tempGroupedVacunaciones = {};

    // Obtener todos los animales del usuario actual
    final userAnimals = await animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
    final userAnimalKeys = userAnimals.keys.toSet();
    
    // Filtrar solo las vacunaciones de animales del usuario actual
    final filteredVacunaciones = Map<dynamic, VacunacionModel>.fromEntries(
      allVacunacionesWithKeys.entries.where((entry) => 
        userAnimalKeys.contains(entry.value.animalKey)
      )
    );

    _allVacunacionesSorted = filteredVacunaciones.entries.toList()
      ..sort((a, b) => b.value.fechaAplicacion.compareTo(a.value.fechaAplicacion));

    // Cargar nombres de animales solo para los animales del usuario
    for (var entry in _allVacunacionesSorted) {
      final animalKey = entry.value.animalKey;
      if (!_animalNames.containsKey(animalKey)) {
        final animal = userAnimals[animalKey];
        _animalNames[animalKey] = animal?.name ?? 'Animal Desconocido';
      }
    }

    for (var entry in filteredVacunaciones.entries) {
      final vacunacion = entry.value;
      final key = entry.key;

      if (!tempGroupedVacunaciones.containsKey(vacunacion.nombreVacuna)) {
        tempGroupedVacunaciones[vacunacion.nombreVacuna] = [];
      }
      tempGroupedVacunaciones[vacunacion.nombreVacuna]!.add(MapEntry(key, vacunacion));
    }

    final sortedNombreVacunaKeys = tempGroupedVacunaciones.keys.toList()..sort();
    for (var nombre in sortedNombreVacunaKeys) {
      tempGroupedVacunaciones[nombre]!
        ..sort((a, b) => b.value.fechaAplicacion.compareTo(a.value.fechaAplicacion));
    }

    setState(() {
      _groupedVacunaciones = tempGroupedVacunaciones;
      _tabNames = ['General', ...sortedNombreVacunaKeys];
    });
  }

  void _deleteVacunacion(dynamic key, int animalKey) async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Eliminar Vacuna',
      content: '¿Estás seguro de que quieres eliminar esta vacuna? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: AppColors.error,
    );

    if (confirmed == true) {
      await vacunacionDataSource.deleteVacunacion(key);
      _loadVacunaciones();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Vacuna eliminada correctamente'), backgroundColor: AppColors.success),
      );
    }
  }

  void _addVacunacion() async {
    final selectedAnimalKey = await showDialog<int>(
      context: context,
      builder: (BuildContext context) {
        return AnimalSelectionDialog(ownerUsername: widget.ownerUsername);
      },
    );

    if (selectedAnimalKey != null) {
      final result = await Navigator.pushNamed(
        context,
        AppRoutes.vacunacionForm,
        arguments: {'animalKey': selectedAnimalKey},
      );
      if (result == true) {
        _loadVacunaciones();
      }
    }
  }

  void _editVacunacion({VacunacionModel? vacunacion, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.vacunacionForm,
      arguments: {'animalKey': vacunacion!.animalKey, 'vacunacion': vacunacion},
    );
    if (result == true) {
      _loadVacunaciones();
    }
  }

  Widget _buildVacunacionListView(List<MapEntry<dynamic, VacunacionModel>> vacunaciones, {bool showNombreVacuna = true}) {
    if (vacunaciones.isEmpty) {
      return EmptyStateMessage(
        icon: Icons.vaccines_outlined,
        title: 'No hay registros en esta categoría.',
        message: 'Agrega una nueva vacuna para este animal.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: vacunaciones.length,
      itemBuilder: (context, index) {
        final key = vacunaciones[index].key;
        final vac = vacunaciones[index].value;
        final animalName = _animalNames[vac.animalKey] ?? 'Cargando...';

        return CommonListItem(
          itemKey: key,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.15),
            child: Icon(Icons.vaccines, color: AppColors.primary),
          ),
          title: showNombreVacuna
              ? Text(
                  vac.nombreVacuna,
                  style: AppTextStyles.subtitle1.copyWith(color: AppColors.primaryDark),
                )
              : SizedBox.shrink(),
          subtitle: Text(
            'Animal: $animalName\nMedicamento: ${vac.medicamento}\nFecha: ${vac.fechaAplicacion.toLocal().toString().split(' ')[0]}\n${vac.observaciones}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _editVacunacion(vacunacion: vac, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteVacunacion(key, vac.animalKey);
            }
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: _tabNames.length,
      child: Scaffold(
        appBar: AppBar(title: Text('Todas las vacunaciones'),
          bottom: _tabNames.isEmpty
              ? null
              : TabBar(
                  isScrollable: true,
                  tabs: _tabNames.map((tabName) => Tab(text: tabName)).toList(),
                  labelColor: AppColors.textLight,
                  unselectedLabelColor: AppColors.textLight.withOpacity(0.7),
                  indicatorColor: AppColors.accent,
                ),
        ),
        body: GradientBackground(
          child: _tabNames.isEmpty
              ? EmptyStateMessage(
                  icon: Icons.vaccines_outlined,
                  title: 'No hay vacunas registradas.',
                  message: 'Agrega una nueva vacuna para empezar a gestionarlo.',
                )
              : TabBarView(
                  children: _tabNames.map((tabName) {
                    if (tabName == 'General') {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildVacunacionListView(_allVacunacionesSorted),
                      );
                    } else {
                      final vacunacionesOfNombre = _groupedVacunaciones[tabName]!;
                      return ListView(
                        padding: const EdgeInsets.all(16.0),
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 8.0),
                            child: Text(
                              tabName,
                              style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                            ),
                          ),
                          _buildVacunacionListView(vacunacionesOfNombre, showNombreVacuna: false),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                  }).toList(),
                ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _addVacunacion,
          child: Icon(Icons.add),
          tooltip: 'Registrar vacuna',
        ),
      ),
    );
  }
}
