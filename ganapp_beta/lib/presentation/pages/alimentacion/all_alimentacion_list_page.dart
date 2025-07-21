import 'package:flutter/material.dart';
import '../../../data/datasources/alimentacion_local_datasource.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/alimentacion_model.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';
import '../../dialogs/animal_selection_dialog.dart'; // Importa el nuevo diálogo

class AllAlimentacionListPage extends StatefulWidget {
  final String ownerUsername; // Ahora recibe el ownerUsername
  const AllAlimentacionListPage({super.key, required this.ownerUsername});

  @override
  State<AllAlimentacionListPage> createState() => _AllAlimentacionListPageState();
}

class _AllAlimentacionListPageState extends State<AllAlimentacionListPage> {
  final AlimentacionLocalDataSource alimentacionDataSource = AlimentacionLocalDataSource();
  final AnimalLocalDataSource animalDataSource = AnimalLocalDataSource();
  Map<String, List<MapEntry<dynamic, AlimentacionModel>>> _groupedAlimentaciones = {};
  List<MapEntry<dynamic, AlimentacionModel>> _allAlimentacionesSorted = [];
  List<String> _tabNames = [];
  Map<int, String> _animalNames = {};

  @override
  void initState() {
    super.initState();
    _loadAlimentaciones();
  }

  Future<void> _loadAlimentaciones() async {
  final allAlimentacionesWithKeys = await alimentacionDataSource.getAllAlimentacionesWithKeys();
  final Map<String, List<MapEntry<dynamic, AlimentacionModel>>> tempGroupedAlimentaciones = {};
  
  // Obtener todos los animales del usuario actual
  final userAnimals = await animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
  final userAnimalKeys = userAnimals.keys.toSet();
  
  // Filtrar solo las alimentaciones de animales del usuario actual
  final filteredAlimentaciones = Map<dynamic, AlimentacionModel>.fromEntries(
    allAlimentacionesWithKeys.entries.where((entry) => 
      userAnimalKeys.contains(entry.value.animalKey)
    )
  );

  _allAlimentacionesSorted = filteredAlimentaciones.entries.toList()
    ..sort((a, b) => b.value.fecha.compareTo(a.value.fecha));

  // Cargar nombres de animales solo para los animales del usuario
  for (var entry in _allAlimentacionesSorted) {
    final animalKey = entry.value.animalKey;
    if (!_animalNames.containsKey(animalKey)) {
      final animal = userAnimals[animalKey];
      _animalNames[animalKey] = animal?.name ?? 'Animal Desconocido';
    }
  }

  for (var entry in filteredAlimentaciones.entries) {
    final alimentacion = entry.value;
    final key = entry.key;

    if (!tempGroupedAlimentaciones.containsKey(alimentacion.tipoAlimento)) {
      tempGroupedAlimentaciones[alimentacion.tipoAlimento] = [];
    }
    tempGroupedAlimentaciones[alimentacion.tipoAlimento]!.add(MapEntry(key, alimentacion));
  }

  final sortedTipoAlimentoKeys = tempGroupedAlimentaciones.keys.toList()..sort();
  for (var tipo in sortedTipoAlimentoKeys) {
    tempGroupedAlimentaciones[tipo]!
      ..sort((a, b) => b.value.fecha.compareTo(a.value.fecha));
  }

  setState(() {
    _groupedAlimentaciones = tempGroupedAlimentaciones;
    _tabNames = ['General', ...sortedTipoAlimentoKeys];
  });
}

  void _deleteAlimentacion(dynamic key, int animalKey) async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Eliminar Registro',
      content: '¿Estás seguro de que quieres eliminar este registro de alimentación? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: AppColors.error,
    );

    if (confirmed == true) {
      await alimentacionDataSource.deleteAlimentacion(key);
      _loadAlimentaciones();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registro de alimentación eliminado'), backgroundColor: AppColors.success),
      );
    }
  }

  void _addAlimentacion() async {
    final selectedAnimalKey = await showDialog<int>(
      context: context,
      builder: (BuildContext context) {
        return AnimalSelectionDialog(ownerUsername: widget.ownerUsername);
      },
    );

    if (selectedAnimalKey != null) {
      final result = await Navigator.pushNamed(
        context,
        AppRoutes.alimentacionForm,
        arguments: {'animalKey': selectedAnimalKey},
      );
      if (result == true) {
        _loadAlimentaciones();
      }
    }
  }

  void _editAlimentacion({AlimentacionModel? alimentacion, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.alimentacionForm,
      arguments: {'animalKey': alimentacion!.animalKey, 'alimentacion': alimentacion},
    );
    if (result == true) {
      _loadAlimentaciones();
    }
  }

  Widget _buildAlimentacionListView(List<MapEntry<dynamic, AlimentacionModel>> alimentaciones, {bool showTipoAlimento = true}) {
    if (alimentaciones.isEmpty) {
      return EmptyStateMessage(
        icon: Icons.restaurant_menu,
        title: 'No hay registros en esta categoría.',
        message: 'Agrega un nuevo registro de alimentación para este animal.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: alimentaciones.length,
      itemBuilder: (context, index) {
        final key = alimentaciones[index].key;
        final a = alimentaciones[index].value;
        final animalName = _animalNames[a.animalKey] ?? 'Cargando...';

        return CommonListItem(
          itemKey: key,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.15),
            child: Icon(Icons.restaurant, color: AppColors.primary),
          ),
          title: showTipoAlimento
              ? Text(
                  a.tipoAlimento,
                  style: AppTextStyles.subtitle1.copyWith(color: AppColors.primaryDark),
                )
              : SizedBox.shrink(),
          subtitle: Text(
            'Animal: $animalName\nCantidad: ${a.cantidad} kg\nFecha: ${a.fecha.toLocal().toString().split(' ')[0]}\n${a.observaciones}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _editAlimentacion(alimentacion: a, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteAlimentacion(key, a.animalKey);
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
        appBar: AppBar(title: Text('Todos los registros de alimentación'),
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
                  icon: Icons.restaurant_menu,
                  title: 'No hay registros de alimentación.',
                  message: 'Agrega un nuevo registro de alimentación para empezar a gestionarlo.',
                )
              : TabBarView(
                  children: _tabNames.map((tabName) {
                    if (tabName == 'General') {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildAlimentacionListView(_allAlimentacionesSorted),
                      );
                    } else {
                      final alimentacionesOfTipo = _groupedAlimentaciones[tabName]!;
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
                          _buildAlimentacionListView(alimentacionesOfTipo, showTipoAlimento: false),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                  }).toList(),
                ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _addAlimentacion,
          child: Icon(Icons.add),
          tooltip: 'Registrar alimentación',
        ),
      ),
    );
  }
}
