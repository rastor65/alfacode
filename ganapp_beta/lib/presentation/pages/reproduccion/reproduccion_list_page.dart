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

class ReproduccionListPage extends StatefulWidget {
  final int animalKey; // La clave del animal "hijo"
  ReproduccionListPage({required this.animalKey});

  @override
  State<ReproduccionListPage> createState() => _ReproduccionListPageState();
}

class _ReproduccionListPageState extends State<ReproduccionListPage> {
  final ReproduccionLocalDataSource dataSource = ReproduccionLocalDataSource();
  final AnimalLocalDataSource animalDataSource = AnimalLocalDataSource();
  Map<String, List<MapEntry<dynamic, ReproduccionModel>>> _groupedReproducciones = {};
  List<MapEntry<dynamic, ReproduccionModel>> _allReproduccionesSorted = [];
  List<String> _tabNames = [];
  String _animalName = 'Cargando...';
  Map<int, String> _parentAnimalNames = {}; // Para almacenar nombres de padre/madre

  @override
  void initState() {
    super.initState();
    _loadReproducciones();
  }

  Future<void> _loadReproducciones() async {
    final animal = await animalDataSource.getAnimalByKey(widget.animalKey);
    if (!mounted) return;
    setState(() {
      _animalName = animal?.name ?? 'Animal Desconocido';
    });

    final allReproduccionesWithKeys = await dataSource.getReproduccionesWithKeysForAnimal(widget.animalKey);
    final Map<String, List<MapEntry<dynamic, ReproduccionModel>>> tempGroupedReproducciones = {};

    _allReproduccionesSorted = allReproduccionesWithKeys.entries.toList()
      ..sort((a, b) => b.value.fechaReproduccion.compareTo(a.value.fechaReproduccion));

    // Cargar nombres de padre/madre
    for (var entry in _allReproduccionesSorted) {
      if (entry.value.animalPadreKey != null && !_parentAnimalNames.containsKey(entry.value.animalPadreKey!)) {
        final padre = await animalDataSource.getAnimalByKey(entry.value.animalPadreKey!);
        _parentAnimalNames[entry.value.animalPadreKey!] = padre?.name ?? 'Desconocido';
      }
      if (entry.value.animalMadreKey != null && !_parentAnimalNames.containsKey(entry.value.animalMadreKey!)) {
        final madre = await animalDataSource.getAnimalByKey(entry.value.animalMadreKey!);
        _parentAnimalNames[entry.value.animalMadreKey!] = madre?.name ?? 'Desconocido';
      }
    }
    if (!mounted) return;

    for (var entry in allReproduccionesWithKeys.entries) {
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
    // La confirmación ya se maneja en CommonListItem.confirmDismiss
    await dataSource.deleteReproduccion(key);
    _loadReproducciones();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Registro de reproducción eliminado'), backgroundColor: AppColors.success),
    );
  }

  void _addOrEditReproduccion({ReproduccionModel? reproduccion, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.reproduccionForm,
      arguments: {'animalId': widget.animalKey, 'reproduccion': reproduccion},
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
        message: 'Agrega un nuevo registro de reproducción para este animal.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: reproducciones.length,
      itemBuilder: (context, index) {
        final key = reproducciones[index].key;
        final r = reproducciones[index].value;
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
            'Fecha: ${r.fechaReproduccion.toLocal().toString().split(' ')[0]}\n'
            'Padre: $padreName, Madre: $madreName\n'
            'Resultado: ${r.resultadoReproduccion}\n'
            'F. Est. Parto: ${r.fechaEstimadaParto?.toLocal().toString().split(' ')[0] ?? 'No definida'}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _addOrEditReproduccion(reproduccion: r, key: key),
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
        appBar: AppBar(title: Text('Reproducciones de $_animalName'),
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
                  message: 'Agrega un nuevo registro de reproducción para este animal.',
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
          onPressed: () => _addOrEditReproduccion(),
          child: Icon(Icons.add),
          tooltip: 'Registrar reproducción',
        ),
      ),
    );
  }
}
