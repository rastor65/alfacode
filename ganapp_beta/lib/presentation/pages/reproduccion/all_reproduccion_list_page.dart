import 'package:flutter/material.dart';
import '../../../data/datasources/reproduccion_local_datasource.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/reproduccion_model.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';
import '../../dialogs/animal_selection_dialog.dart'; // Importa el diálogo de selección de animal

class AllReproduccionListPage extends StatefulWidget {
  final String ownerUsername;
  const AllReproduccionListPage({super.key, required this.ownerUsername});

  @override
  State<AllReproduccionListPage> createState() => _AllReproduccionListPageState();
}

class _AllReproduccionListPageState extends State<AllReproduccionListPage> {
  final ReproduccionLocalDataSource reproduccionDataSource = ReproduccionLocalDataSource();
  final AnimalLocalDataSource animalDataSource = AnimalLocalDataSource();
  Map<String, List<MapEntry<dynamic, ReproduccionModel>>> _groupedReproducciones = {};
  List<MapEntry<dynamic, ReproduccionModel>> _allReproduccionesSorted = [];
  List<String> _tabNames = [];
  Map<int, String> _animalNames = {}; // Para almacenar nombres de animales "hijos"
  Map<int, String> _parentAnimalNames = {}; // Para almacenar nombres de padre/madre

  @override
  void initState() {
    super.initState();
    _loadReproducciones();
  }

  Future<void> _loadReproducciones() async {
  final allReproduccionesWithKeys = await reproduccionDataSource.getAllReproduccionesWithKeys();
  final Map<String, List<MapEntry<dynamic, ReproduccionModel>>> tempGroupedReproducciones = {};

  // Obtener todos los animales del usuario actual
  final userAnimals = await animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
  final userAnimalKeys = userAnimals.keys.toSet();
  
  // Filtrar solo las reproducciones de animales del usuario actual
  final filteredReproducciones = Map<dynamic, ReproduccionModel>.fromEntries(
    allReproduccionesWithKeys.entries.where((entry) => 
      userAnimalKeys.contains(entry.value.animalId)
    )
  );

  _allReproduccionesSorted = filteredReproducciones.entries.toList()
    ..sort((a, b) => b.value.fechaReproduccion.compareTo(a.value.fechaReproduccion));

  // Cargar nombres de animales "hijos" y padres/madres solo para los animales del usuario
  for (var entry in _allReproduccionesSorted) {
    final animalKey = entry.value.animalId;
    if (!_animalNames.containsKey(animalKey)) {
      final animal = userAnimals[animalKey];
      _animalNames[animalKey] = animal?.name ?? 'Animal Desconocido';
    }
    if (entry.value.animalPadreKey != null && !_parentAnimalNames.containsKey(entry.value.animalPadreKey!)) {
      final padre = userAnimals[entry.value.animalPadreKey!];
      _parentAnimalNames[entry.value.animalPadreKey!] = padre?.name ?? 'Desconocido';
    }
    if (entry.value.animalMadreKey != null && !_parentAnimalNames.containsKey(entry.value.animalMadreKey!)) {
      final madre = userAnimals[entry.value.animalMadreKey!];
      _parentAnimalNames[entry.value.animalMadreKey!] = madre?.name ?? 'Desconocido';
    }
  }
  if (!mounted) return;

  for (var entry in filteredReproducciones.entries) {
    final reproduccion = entry.value;
    final key = entry.key;

    if (!tempGroupedReproducciones.containsKey(reproduccion.tipoReproduccion)) {
      tempGroupedReproducciones[reproduccion.tipoReproduccion] = [];
    }
    tempGroupedReproducciones[reproduccion.tipoReproduccion]!.add(MapEntry(key, reproduccion));
  }

  final sortedTipoReproduccionKeys = tempGroupedReproducciones.keys.toList()..sort();
  for (var tipo in sortedTipoReproduccionKeys) {
    tempGroupedReproducciones[tipo]!
      ..sort((a, b) => b.value.fechaReproduccion.compareTo(a.value.fechaReproduccion));
  }

  setState(() {
    _groupedReproducciones = tempGroupedReproducciones;
    _tabNames = ['General', ...sortedTipoReproduccionKeys];
  });
}

  void _deleteReproduccion(dynamic key) async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Eliminar Registro',
      content: '¿Estás seguro de que quieres eliminar este registro de reproducción? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: AppColors.error,
    );

    if (confirmed == true) {
      await reproduccionDataSource.deleteReproduccion(key);
      _loadReproducciones();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registro de reproducción eliminado'), backgroundColor: AppColors.success),
      );
    }
  }

  void _addReproduccion() async {
    final selectedAnimalKey = await showDialog<int>(
      context: context,
      builder: (BuildContext context) {
        return AnimalSelectionDialog(ownerUsername: widget.ownerUsername);
      },
    );

    if (selectedAnimalKey != null) {
      final result = await Navigator.pushNamed(
        context,
        AppRoutes.reproduccionForm,
        arguments: {'animalId': selectedAnimalKey},
      );
      if (result == true) {
        _loadReproducciones();
      }
    }
  }

  void _editReproduccion({ReproduccionModel? reproduccion, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.reproduccionForm,
      arguments: {'animalId': reproduccion!.animalId, 'reproduccion': reproduccion},
    );
    if (result == true) {
      _loadReproducciones();
    }
  }

  Widget _buildReproduccionListView(List<MapEntry<dynamic, ReproduccionModel>> reproducciones, {bool showTipoReproduccion = true}) {
    if (reproducciones.isEmpty) {
      return EmptyStateMessage(
        icon: Icons.baby_changing_station,
        title: 'No hay registros en esta categoría.',
        message: 'Agrega un nuevo registro de reproducción para empezar a gestionarlo.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: reproducciones.length,
      itemBuilder: (context, index) {
        final key = reproducciones[index].key;
        final r = reproducciones[index].value;
        final animalName = _animalNames[r.animalId] ?? 'Cargando...';
        final padreName = _parentAnimalNames[r.animalPadreKey] ?? 'N/A';
        final madreName = _parentAnimalNames[r.animalMadreKey] ?? 'N/A';

        return CommonListItem(
          itemKey: key,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.15),
            child: Icon(Icons.baby_changing_station, color: AppColors.primary),
          ),
          title: showTipoReproduccion
              ? Text(
                  r.tipoReproduccion,
                  style: AppTextStyles.subtitle1.copyWith(color: AppColors.primaryDark),
                )
              : SizedBox.shrink(),
          subtitle: Text(
            'Animal: $animalName\n'
            'Fecha: ${r.fechaReproduccion.toLocal().toString().split(' ')[0]}\n'
            'Padre: $padreName, Madre: $madreName\n'
            'Resultado: ${r.resultadoReproduccion}\n'
            'F. Est. Parto: ${r.fechaEstimadaParto?.toLocal().toString().split(' ')[0] ?? 'No definida'}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _editReproduccion(reproduccion: r, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteReproduccion(key);
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
        appBar: AppBar(title: Text('Todos los registros de reproducción'),
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
                  icon: Icons.baby_changing_station,
                  title: 'No hay registros de reproducción.',
                  message: 'Agrega un nuevo registro de reproducción para empezar a gestionarlo.',
                )
              : TabBarView(
                  children: _tabNames.map((tabName) {
                    if (tabName == 'General') {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildReproduccionListView(_allReproduccionesSorted),
                      );
                    } else {
                      final reproduccionesOfTipo = _groupedReproducciones[tabName]!;
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
                          _buildReproduccionListView(reproduccionesOfTipo, showTipoReproduccion: false),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                  }).toList(),
                ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _addReproduccion,
          child: Icon(Icons.add),
          tooltip: 'Registrar reproducción',
        ),
      ),
    );
  }
}
