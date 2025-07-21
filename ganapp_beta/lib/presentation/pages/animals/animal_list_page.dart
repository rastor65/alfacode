import 'package:flutter/material.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';

class AnimalListPage extends StatefulWidget {
  final String ownerUsername;

  AnimalListPage({required this.ownerUsername});

  @override
  State<AnimalListPage> createState() => _AnimalListPageState();
}

class _AnimalListPageState extends State<AnimalListPage> {
  final AnimalLocalDataSource dataSource = AnimalLocalDataSource();
  Map<String, Map<String, List<MapEntry<dynamic, AnimalModel>>>> _groupedAnimals = {};
  List<MapEntry<dynamic, AnimalModel>> _allAnimalsSorted = [];
  List<String> _tabNames = [];

  @override
  void initState() {
    super.initState();
    _loadAnimals();
  }

  Future<void> _loadAnimals() async {
    final allAnimalsWithKeys = await dataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
    final Map<String, Map<String, List<MapEntry<dynamic, AnimalModel>>>> tempGroupedAnimals = {};

    _allAnimalsSorted = allAnimalsWithKeys.entries.toList()
      ..sort((a, b) => a.value.name.compareTo(b.value.name));

    for (var entry in allAnimalsWithKeys.entries) {
      final animal = entry.value;
      final key = entry.key;

      if (!tempGroupedAnimals.containsKey(animal.especie)) {
        tempGroupedAnimals[animal.especie] = {};
      }
      if (!tempGroupedAnimals[animal.especie]!.containsKey(animal.tipo)) {
        tempGroupedAnimals[animal.especie]![animal.tipo] = [];
      }
      tempGroupedAnimals[animal.especie]![animal.tipo]!.add(MapEntry(key, animal));
    }

    final sortedSpeciesKeys = tempGroupedAnimals.keys.toList()..sort();
    for (var species in sortedSpeciesKeys) {
      final typesMap = tempGroupedAnimals[species]!;
      final sortedTypes = typesMap.keys.toList()..sort();
      final sortedTypesMap = <String, List<MapEntry<dynamic, AnimalModel>>>{};
      for (var type in sortedTypes) {
        sortedTypesMap[type] = typesMap[type]!..sort((a, b) => a.value.name.compareTo(b.value.name));
      }
      tempGroupedAnimals[species] = sortedTypesMap;
    }

    setState(() {
      _groupedAnimals = tempGroupedAnimals;
      _tabNames = ['General', ...sortedSpeciesKeys];
    });
  }

  void _deleteAnimal(dynamic key) async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Eliminar Animal',
      content: '¿Estás seguro de que quieres eliminar este animal? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: AppColors.error,
    );

    if (confirmed == true) {
      await dataSource.deleteAnimal(key);
      _loadAnimals();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Animal eliminado correctamente'), backgroundColor: AppColors.success),
      );
    }
  }

  void _addOrEditAnimal({AnimalModel? animal, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.animalForm,
      arguments: {'ownerUsername': widget.ownerUsername, 'animal': animal},
    );
    if (result == true) {
      _loadAnimals();
    }
  }

  Widget _buildAnimalListView(List<MapEntry<dynamic, AnimalModel>> animals, {bool showSpeciesAndType = true}) {
    if (animals.isEmpty) {
      return EmptyStateMessage(
        icon: Icons.pets_outlined,
        title: 'No hay animales en esta categoría.',
        message: 'Agrega un nuevo animal para empezar a gestionarlo.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: animals.length,
      itemBuilder: (context, index) {
        final key = animals[index].key;
        final animal = animals[index].value;
        return CommonListItem(
          itemKey: key,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.15),
            child: Icon(Icons.pets, color: AppColors.primary),
          ),
          title: Text(
            animal.name,
            style: AppTextStyles.subtitle1.copyWith(color: AppColors.primaryDark),
          ),
          subtitle: showSpeciesAndType
              ? Text(
                  'Especie: ${animal.especie} - Tipo: ${animal.tipo}',
                  style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
                )
              : Text(
                  'Tipo: ${animal.tipo}',
                  style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
                ),
          onTap: () {
            Navigator.pushNamed(
              context,
              AppRoutes.animalDetail,
              arguments: {'animal': animal},
            );
          },
          onEdit: () => _addOrEditAnimal(animal: animal, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteAnimal(key);
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
        appBar: AppBar(
          title: Text('Mis animales'),
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
                  icon: Icons.pets_outlined,
                  title: 'No tienes animales registrados.',
                  message: '¡Agrega tu primer animal para empezar a gestionarlo!',
                )
              : TabBarView(
                  children: _tabNames.map((tabName) {
                    if (tabName == 'General') {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildAnimalListView(_allAnimalsSorted),
                      );
                    } else {
                      final typesMap = _groupedAnimals[tabName]!;
                      return ListView(
                        padding: const EdgeInsets.all(16.0),
                        children: typesMap.entries.map((typeEntry) {
                          final type = typeEntry.key;
                          final animalsOfType = typeEntry.value;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 8.0),
                                child: Text(
                                  type,
                                  style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                                ),
                              ),
                              _buildAnimalListView(animalsOfType, showSpeciesAndType: false),
                              const SizedBox(height: 16),
                            ],
                          );
                        }).toList(),
                      );
                    }
                  }).toList(),
                ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _addOrEditAnimal(),
          child: Icon(Icons.add),
          tooltip: 'Agregar animal',
        ),
      ),
    );
  }
}
