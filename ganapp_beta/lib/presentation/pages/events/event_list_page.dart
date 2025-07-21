import 'package:flutter/material.dart';
import '../../../data/datasources/event_local_datasource.dart';
import '../../../data/models/event_model.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';
import '../../widgets/common_list_item.dart';
import '../../widgets/empty_state_message.dart';

class EventListPage extends StatefulWidget {
  final int animalKey;
  EventListPage({required this.animalKey});

  @override
  State<EventListPage> createState() => _EventListPageState();
}

class _EventListPageState extends State<EventListPage> {
  final EventLocalDataSource dataSource = EventLocalDataSource();
  Map<String, List<MapEntry<dynamic, EventModel>>> _groupedEvents = {};
  List<MapEntry<dynamic, EventModel>> _allEventsSorted = [];
  List<String> _tabNames = [];

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    final allEventsWithKeys = await dataSource.getEventsWithKeysForAnimal(widget.animalKey);
    final Map<String, List<MapEntry<dynamic, EventModel>>> tempGroupedEvents = {};

    _allEventsSorted = allEventsWithKeys.entries.toList()
      ..sort((a, b) => b.value.fecha.compareTo(a.value.fecha));

    for (var entry in allEventsWithKeys.entries) {
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

  void _deleteEvent(dynamic key) async {
    // La confirmación ya se maneja en CommonListItem.confirmDismiss
    await dataSource.deleteEvent(key);
    _loadEvents();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Evento eliminado correctamente'), backgroundColor: AppColors.success),
    );
  }

  void _addOrEditEvent({EventModel? event, dynamic key}) async {
    final result = await Navigator.pushNamed(
      context,
      AppRoutes.eventForm,
      arguments: {'animalKey': widget.animalKey, 'event': event},
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
              : SizedBox.shrink(), // Cambiado de null a SizedBox.shrink()
          subtitle: Text(
            'Fecha: ${e.fecha.toLocal().toString().split(' ')[0]}\n${e.descripcion}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.primary.withOpacity(0.8)),
          ),
          onEdit: () => _addOrEditEvent(event: e, key: key),
          onDismissed: (direction) {
            if (direction == DismissDirection.endToStart) {
              _deleteEvent(key);
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
        appBar: AppBar(title: Text('Eventos del animal'),
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
                  message: 'Agrega un nuevo evento para este animal.',
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
          onPressed: () => _addOrEditEvent(),
          child: Icon(Icons.add),
          tooltip: 'Registrar evento',
        ),
      ),
    );
  }
}
