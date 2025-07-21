import 'package:flutter/material.dart';
import '../../../data/datasources/tratamiento_local_datasource.dart';
import '../../../data/models/tratamiento_model.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';

class TratamientoListPage extends StatefulWidget {
  final int animalKey;
  TratamientoListPage({required this.animalKey});

  @override
  State<TratamientoListPage> createState() => _TratamientoListPageState();
}

class _TratamientoListPageState extends State<TratamientoListPage> {
  final TratamientoLocalDataSource dataSource = TratamientoLocalDataSource();
  Map<String, List<MapEntry<dynamic, TratamientoModel>>> _groupedTratamientos = {};
  List<MapEntry<dynamic, TratamientoModel>> _allTratamientosSorted = [];
  List<String> _tabNames = [];

  @override
  void initState() {
    super.initState();
    _loadTratamientos();
  }

  Future<void> _loadTratamientos() async {
    final allTratamientosWithKeys = await dataSource.getTratamientosWithKeysForAnimal(widget.animalKey);
    final Map<String, List<MapEntry<dynamic, TratamientoModel>>> tempGroupedTratamientos = {};

    _allTratamientosSorted = allTratamientosWithKeys.entries.toList()
      ..sort((a, b) => b.value.fechaAplicacion.compareTo(a.value.fechaAplicacion));

    for (var entry in allTratamientosWithKeys.entries) {
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

  void _deleteTratamiento(dynamic key) async {
    // La confirmación ya se maneja en CommonListItem.confirmDismiss
    await dataSource.deleteTratamiento(key);
    _loadTratamientos();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Tratamiento eliminado correctamente'), backgroundColor: AppColors.success),
    );
  }

  void _addOrEditTratamiento({TratamientoModel? tratamiento, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.tratamientoForm,
      arguments: {'animalKey': widget.animalKey, 'tratamiento': tratamiento},
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
              : SizedBox.shrink(), // Cambiado de null a SizedBox.shrink()
          subtitle: Text(
            'Medicamento: ${t.medicamento}\nFecha: ${t.fechaAplicacion.toLocal().toString().split(' ')[0]}\n${t.observaciones}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _addOrEditTratamiento(tratamiento: t, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteTratamiento(key);
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
        appBar: AppBar(title: Text('Tratamientos del animal'),
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
                  message: 'Agrega un nuevo tratamiento para este animal.',
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
          onPressed: () => _addOrEditTratamiento(),
          child: Icon(Icons.add),
          tooltip: 'Registrar tratamiento',
        ),
      ),
    );
  }
}
