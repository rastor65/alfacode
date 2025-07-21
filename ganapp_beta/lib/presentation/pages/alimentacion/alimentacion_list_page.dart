import 'package:flutter/material.dart';
import '../../../data/datasources/alimentacion_local_datasource.dart';
import '../../../data/models/alimentacion_model.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';

class AlimentacionListPage extends StatefulWidget {
  final int animalKey;
  AlimentacionListPage({required this.animalKey});

  @override
  State<AlimentacionListPage> createState() => _AlimentacionListPageState();
}

class _AlimentacionListPageState extends State<AlimentacionListPage> {
  final AlimentacionLocalDataSource dataSource = AlimentacionLocalDataSource();
  Map<String, List<MapEntry<dynamic, AlimentacionModel>>> _groupedAlimentaciones = {};
  List<MapEntry<dynamic, AlimentacionModel>> _allAlimentacionesSorted = [];
  List<String> _tabNames = [];

  @override
  void initState() {
    super.initState();
    _loadAlimentaciones();
  }

  Future<void> _loadAlimentaciones() async {
    final allAlimentacionesWithKeys = await dataSource.getAlimentacionesWithKeysForAnimal(widget.animalKey);
    final Map<String, List<MapEntry<dynamic, AlimentacionModel>>> tempGroupedAlimentaciones = {};

    _allAlimentacionesSorted = allAlimentacionesWithKeys.entries.toList()
      ..sort((a, b) => b.value.fecha.compareTo(a.value.fecha));

    for (var entry in allAlimentacionesWithKeys.entries) {
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

  void _deleteAlimentacion(dynamic key) async {
    // La confirmación ya se maneja en CommonListItem.confirmDismiss
    await dataSource.deleteAlimentacion(key);
    _loadAlimentaciones();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Registro de alimentación eliminado'), backgroundColor: AppColors.success),
    );
  }

  void _addOrEditAlimentacion({AlimentacionModel? alimentacion, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.alimentacionForm,
      arguments: {'animalKey': widget.animalKey, 'alimentacion': alimentacion},
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
              : SizedBox.shrink(), // Cambiado de null a SizedBox.shrink()
          subtitle: Text(
            'Cantidad: ${a.cantidad} kg\nFecha: ${a.fecha.toLocal().toString().split(' ')[0]}\n${a.observaciones}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _addOrEditAlimentacion(alimentacion: a, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteAlimentacion(key);
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
        appBar: AppBar(title: Text('Alimentación del animal'),
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
                  message: 'Agrega un nuevo registro de alimentación para este animal.',
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
          onPressed: () => _addOrEditAlimentacion(),
          child: Icon(Icons.add),
          tooltip: 'Registrar alimentación',
        ),
      ),
    );
  }
}
