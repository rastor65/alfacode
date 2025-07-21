import 'package:flutter/material.dart';
import '../../../data/datasources/vacunacion_local_datasource.dart';
import '../../../data/models/vacunacion_model.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';

class VacunacionListPage extends StatefulWidget {
  final int animalKey;
  VacunacionListPage({required this.animalKey});

  @override
  State<VacunacionListPage> createState() => _VacunacionListPageState();
}

class _VacunacionListPageState extends State<VacunacionListPage> {
  final VacunacionLocalDataSource dataSource = VacunacionLocalDataSource();
  Map<String, List<MapEntry<dynamic, VacunacionModel>>> _groupedVacunaciones = {};
  List<MapEntry<dynamic, VacunacionModel>> _allVacunacionesSorted = [];
  List<String> _tabNames = [];

  @override
  void initState() {
    super.initState();
    _loadVacunaciones();
  }

  Future<void> _loadVacunaciones() async {
    final allVacunacionesWithKeys = await dataSource.getVacunacionesWithKeysForAnimal(widget.animalKey);
    final Map<String, List<MapEntry<dynamic, VacunacionModel>>> tempGroupedVacunaciones = {};

    _allVacunacionesSorted = allVacunacionesWithKeys.entries.toList()
      ..sort((a, b) => b.value.fechaAplicacion.compareTo(a.value.fechaAplicacion));

    for (var entry in allVacunacionesWithKeys.entries) {
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

  void _deleteVacunacion(dynamic key) async {
    // La confirmación ya se maneja en CommonListItem.confirmDismiss
    await dataSource.deleteVacunacion(key);
    _loadVacunaciones();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Vacuna eliminada correctamente'), backgroundColor: AppColors.success),
    );
  }

  void _addOrEditVacunacion({VacunacionModel? vacunacion, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.vacunacionForm,
      arguments: {'animalKey': widget.animalKey, 'vacunacion': vacunacion},
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
              : SizedBox.shrink(), // Cambiado de null a SizedBox.shrink()
          subtitle: Text(
            'Fecha: ${vac.fechaAplicacion.toLocal().toString().split(' ')[0]}\n${vac.observaciones}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _addOrEditVacunacion(vacunacion: vac, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteVacunacion(key);
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
        appBar: AppBar(title: Text('Vacunación del animal'),
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
                  message: 'Agrega una nueva vacuna para este animal.',
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
          onPressed: () => _addOrEditVacunacion(),
          child: Icon(Icons.add),
          tooltip: 'Registrar vacuna',
        ),
      ),
    );
  }
}
