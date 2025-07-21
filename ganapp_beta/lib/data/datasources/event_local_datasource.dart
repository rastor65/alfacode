import 'package:hive/hive.dart';
import '../models/event_model.dart';

class EventLocalDataSource {
  static const _boxName = 'events';

  Future<void> addEvent(EventModel event) async {
    final box = await Hive.openBox<EventModel>(_boxName);
    await box.add(event);
  }

  Future<List<EventModel>> getEventsForAnimal(int animalKey) async {
    final box = await Hive.openBox<EventModel>(_boxName);
    return box.values
        .where((e) => e != null && e.animalKey == animalKey)
        .toList();
  }

  Future<void> deleteEvent(int key) async {
    final box = await Hive.openBox<EventModel>(_boxName);
    await box.delete(key);
  }

  Future<void> updateEvent(int key, EventModel event) async {
    final box = await Hive.openBox<EventModel>(_boxName);
    await box.put(key, event);
  }

  Future<Map<dynamic, EventModel>> getEventsWithKeysForAnimal(int animalKey) async {
    final allEvents = await Hive.openBox<EventModel>(_boxName);
    final all = allEvents.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null && e.value.animalKey == animalKey),
    );
  }

  // Método para obtener todos los eventos con validación de null
  Future<Map<dynamic, EventModel>> getAllEventsWithKeys() async {
    final box = await Hive.openBox<EventModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null),
    );
  }
}
