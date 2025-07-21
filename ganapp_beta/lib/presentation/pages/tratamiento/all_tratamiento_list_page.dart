import 'package:flutter/material.dart';
import '../../../data/datasources/tratamiento_local_datasource.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/tratamiento_model.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';
import '../../dialogs/animal_selection_dialog.dart'; // Importa el nuevo diálogo

class AllTratamientoListPage extends StatefulWidget {
  final String ownerUsername; // Ahora recibe el ownerUsername
  const AllTratamientoListPage({super.key, required this.ownerUsername});

  @override
  State<AllTratamientoListPage> createState() => _AllTratamientoListPageState();
}

class _AllTratamientoListPageState extends State<AllTratamientoListPage> {
  final TratamientoLocalDataSource tratamientoDataSource = TratamientoLocalDataSource();
  final AnimalLocalDataSource animalDataSource = AnimalLocalDataSource();
  Map<String, List<MapEntry<dynamic, TratamientoModel>>> _groupedTratamientos = {};
  List<MapEntry<dynamic, TratamientoModel>> _allTratamientosSorted = [];
  List<String> _tabNames = [];
  Map<int, String> _animalNames = {};

  @override
  void initState() {
    super.initState();
    _loadTratamientos();
  }

  Future<void> _loadTratamientos() async {
  final allTratamientosWithKeys = await tratamientoDataSource.getAllTratamientosWithKeys();
  final Map<String, List<MapEntry<dynamic, TratamientoModel>>> tempGroupedTratamientos = {};

  // Obtener todos los animales del usuario actual
  final userAnimals = await animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
  final userAnimalKeys = userAnimals.keys.toSet();
  
  // Filtrar solo los tratamientos de animales del usuario actual
  final filteredTratamientos = Map<dynamic, TratamientoModel>.fromEntries(
    allTratamientosWithKeys.entries.where((entry) => 
      userAnimalKeys.contains(entry.value.animalKey)
    )
  );

  _allTratamientosSorted = filteredTratamientos.entries.toList()
    ..sort((a, b) => b.value.fechaAplicacion.compareTo(a.value.fechaAplicacion));

  // Cargar nombres de animales solo para los animales del usuario
  for (var entry in _allTratamientosSorted) {
    final animalKey = entry.value.animalKey;
    if (!_animalNames.containsKey(animalKey)) {
      final animal = userAnimals[animalKey];
      _animalNames[animalKey] = animal?.name ?? 'Animal Desconocido';
    }
  }

  for (var entry in filteredTratamientos.entries) {
    final tratamiento = entry.value;
    final key = entry.key;

    if (!tempGroupedTratamientos.containsKey(tratamiento.tipoTratamiento)) {
      tempGroupedTratamientos[tratamiento.tipoTratamiento] = [];
    }
    tempGroupedTratamientos[tratamiento.tipoTratamiento]!.add(MapEntry(key, tratamiento));
  }

  final sortedTipoTratamientoKeys = tempGroupedTratamientos.keys.toList()..sort();
  for (var tipo in sortedTipoTratamientoKeys) {
    tempGroupedTratamientos[tipo]!
      ..sort((a, b) => b.value.fechaAplicacion.compareTo(a.value.fechaAplicacion));
  }

  setState(() {
    _groupedTratamientos = tempGroupedTratamientos;
    _tabNames = ['General', ...sortedTipoTratamientoKeys];
  });
}

  void _deleteTratamiento(dynamic key, int animalKey) async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Eliminar Tratamiento',
      content: '¿Estás seguro de que quieres eliminar este tratamiento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: AppColors.error,
    );

    if (confirmed == true) {
      await tratamientoDataSource.deleteTratamiento(key);
      _loadTratamientos();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Tratamiento eliminado correctamente'), backgroundColor: AppColors.success),
      );
    }
  }

  void _addTratamiento() async {
    final selectedAnimalKey = await showDialog<int>(
      context: context,
      builder: (BuildContext context) {
        return AnimalSelectionDialog(ownerUsername: widget.ownerUsername);
      },
    );

    if (selectedAnimalKey != null) {
      final result = await Navigator.pushNamed(
        context,
        AppRoutes.tratamientoForm,
        arguments: {'animalKey': selectedAnimalKey},
      );
      if (result == true) {
        _loadTratamientos();
      }
    }
  }

  void _editTratamiento({TratamientoModel? tratamiento, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.tratamientoForm,
      arguments: {'animalKey': tratamiento!.animalKey, 'tratamiento': tratamiento},
    );
    if (result == true) {
      _loadTratamientos();
    }
  }

  Widget _buildTratamientoListView(List<MapEntry<dynamic, TratamientoModel>> tratamientos, {bool showTipoTratamiento = true}) {
    if (tratamientos.isEmpty) {
      return EmptyStateMessage(
        icon: Icons.healing_outlined,
        title: 'No hay registros en esta categoría.',
        message: 'Agrega un nuevo tratamiento para este animal.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: tratamientos.length,
      itemBuilder: (context, index) {
        final key = tratamientos[index].key;
        final t = tratamientos[index].value;
        final animalName = _animalNames[t.animalKey] ?? 'Cargando...';

        return CommonListItem(
          itemKey: key,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.15),
            child: Icon(Icons.healing, color: AppColors.primary),
          ),
          title: showTipoTratamiento
              ? Text(
                  t.tipoTratamiento,
                  style: AppTextStyles.subtitle1.copyWith(color: AppColors.primaryDark),
                )
              : SizedBox.shrink(),
          subtitle: Text(
            'Animal: $animalName\nMedicamento: ${t.medicamento}\nFecha: ${t.fechaAplicacion.toLocal().toString().split(' ')[0]}\n${t.observaciones}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _editTratamiento(tratamiento: t, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteTratamiento(key, t.animalKey);
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
        appBar: AppBar(title: Text('Todos los tratamientos'),
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
                  icon: Icons.healing_outlined,
                  title: 'No hay tratamientos registrados.',
                  message: 'Agrega un nuevo tratamiento para empezar a gestionarlo.',
                )
              : TabBarView(
                  children: _tabNames.map((tabName) {
                    if (tabName == 'General') {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildTratamientoListView(_allTratamientosSorted),
                      );
                    } else {
                      final tratamientosOfTipo = _groupedTratamientos[tabName]!;
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
                          _buildTratamientoListView(tratamientosOfTipo, showTipoTratamiento: false),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                  }).toList(),
                ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _addTratamiento,
          child: Icon(Icons.add),
          tooltip: 'Registrar tratamiento',
        ),
      ),
    );
  }
}
