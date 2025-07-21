import 'package:flutter/material.dart';
import '../../../data/datasources/event_local_datasource.dart';
import '../../../data/datasources/animal_local_datasource.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';
import '../../dialogs/animal_selection_dialog.dart'; // Importa el nuevo diálogo

class AllEventListPage extends StatefulWidget {
  final String ownerUsername; // Ahora recibe el ownerUsername
  const AllEventListPage({super.key, required this.ownerUsername});

  @override
  State<AllEventListPage> createState() => _AllEventListPageState();
}

class _AllEventListPageState extends State<AllEventListPage> {
  final EventLocalDataSource eventDataSource = EventLocalDataSource();
  final AnimalLocalDataSource animalDataSource = AnimalLocalDataSource();
  Map<String, List<MapEntry<dynamic, EventModel>>> _groupedEvents = {};
  List<MapEntry<dynamic, EventModel>> _allEventsSorted = [];
  List<String> _tabNames = [];
  Map<int, String> _animalNames = {};

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    final allEventsWithKeys = await eventDataSource.getAllEventsWithKeys();
    final Map<String, List<MapEntry<dynamic, EventModel>>> tempGroupedEvents = {};

    // Obtener todos los animales del usuario actual
    final userAnimals = await animalDataSource.getAnimalsWithKeysByOwner(widget.ownerUsername);
    final userAnimalKeys = userAnimals.keys.toSet();
    
    // Filtrar solo los eventos de animales del usuario actual
    final filteredEvents = Map<dynamic, EventModel>.fromEntries(
      allEventsWithKeys.entries.where((entry) => 
        userAnimalKeys.contains(entry.value.animalKey)
      )
    );

    _allEventsSorted = filteredEvents.entries.toList()
      ..sort((a, b) => b.value.fecha.compareTo(a.value.fecha));

    // Cargar nombres de animales solo para los animales del usuario
    for (var entry in _allEventsSorted) {
      final animalKey = entry.value.animalKey;
      if (!_animalNames.containsKey(animalKey)) {
        final animal = userAnimals[animalKey];
        _animalNames[animalKey] = animal?.name ?? 'Animal Desconocido';
      }
    }

    for (var entry in filteredEvents.entries) {
      final event = entry.value;
      final key = entry.key;

      if (!tempGroupedEvents.containsKey(event.tipo)) {
        tempGroupedEvents[event.tipo] = [];
      }
      tempGroupedEvents[event.tipo]!.add(MapEntry(key, event));
    }

    final sortedTipoKeys = tempGroupedEvents.keys.toList()..sort();
    for (var tipo in sortedTipoKeys) {
      tempGroupedEvents[tipo]!
        ..sort((a, b) => b.value.fecha.compareTo(a.value.fecha));
    }

    setState(() {
      _groupedEvents = tempGroupedEvents;
      _tabNames = ['General', ...sortedTipoKeys];
    });
  }

  void _deleteEvent(dynamic key, int animalKey) async {
    final confirmed = await showConfirmationDialog(
      context,
      title: 'Eliminar Evento',
      content: '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: AppColors.error,
    );

    if (confirmed == true) {
      await eventDataSource.deleteEvent(key);
      _loadEvents();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Evento eliminado correctamente'), backgroundColor: AppColors.success),
      );
    }
  }

  void _addEvent() async {
    final selectedAnimalKey = await showDialog<int>(
      context: context,
      builder: (BuildContext context) {
        return AnimalSelectionDialog(ownerUsername: widget.ownerUsername);
      },
    );

    if (selectedAnimalKey != null) {
      final result = await Navigator.pushNamed(
        context,
        AppRoutes.eventForm,
        arguments: {'animalKey': selectedAnimalKey},
      );
      if (result == true) {
        _loadEvents();
      }
    }
  }

  void _editEvent({EventModel? event, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.eventForm,
      arguments: {'animalKey': event!.animalKey, 'event': event},
    );
    if (result == true) {
      _loadEvents();
    }
  }

  Widget _buildEventListView(List<MapEntry<dynamic, EventModel>> events, {bool showTipo = true}) {
    if (events.isEmpty) {
      return EmptyStateMessage(
        icon: Icons.event_note,
        title: 'No hay registros en esta categoría.',
        message: 'Agrega un nuevo evento para este animal.',
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final key = events[index].key;
        final e = events[index].value;
        final animalName = _animalNames[e.animalKey] ?? 'Cargando...';

        return CommonListItem(
          itemKey: key,
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withOpacity(0.15),
            child: Icon(Icons.event, color: AppColors.primary),
          ),
          title: showTipo
              ? Text(
                  e.tipo,
                  style: AppTextStyles.subtitle1.copyWith(color: AppColors.primaryDark),
                )
              : SizedBox.shrink(),
          subtitle: Text(
            'Animal: $animalName\nFecha: ${e.fecha.toLocal().toString().split(' ')[0]}\n${e.descripcion}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _editEvent(event: e, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteEvent(key, e.animalKey);
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
        appBar: AppBar(title: Text('Todos los eventos'),
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
                  icon: Icons.event_note,
                  title: 'No hay eventos registrados.',
                  message: 'Agrega un nuevo evento para empezar a gestionarlo.',
                )
              : TabBarView(
                  children: _tabNames.map((tabName) {
                    if (tabName == 'General') {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: _buildEventListView(_allEventsSorted),
                      );
                    } else {
                      final eventsOfTipo = _groupedEvents[tabName]!;
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
                          _buildEventListView(eventsOfTipo, showTipo: false),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                  }).toList(),
                ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _addEvent,
          child: Icon(Icons.add),
          tooltip: 'Registrar evento',
        ),
      ),
    );
  }
}
