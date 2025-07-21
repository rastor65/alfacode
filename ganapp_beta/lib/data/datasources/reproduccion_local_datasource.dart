import 'package:hive/hive.dart';
import '../models/reproduccion_model.dart';

class ReproduccionLocalDataSource {
  static const _boxName = 'reproducciones';

  Future<void> addReproduccion(ReproduccionModel r) async {
    final box = await Hive.openBox<ReproduccionModel>(_boxName);
    await box.add(r);
  }

  Future<List<ReproduccionModel>> getReproduccionesForAnimal(int animalId) async {
    final box = await Hive.openBox<ReproduccionModel>(_boxName);
    return box.values
        .where((r) => r != null && r.animalId == animalId)
        .toList();
  }

  Future<void> deleteReproduccion(int key) async {
    final box = await Hive.openBox<ReproduccionModel>(_boxName);
    await box.delete(key);
  }

  Future<void> updateReproduccion(int key, ReproduccionModel r) async {
    final box = await Hive.openBox<ReproduccionModel>(_boxName);
    await box.put(key, r);
  }

  Future<Map<dynamic, ReproduccionModel>> getReproduccionesWithKeysForAnimal(int animalId) async {
    final box = await Hive.openBox<ReproduccionModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null && e.value.animalId == animalId),
    );
  }

  Future<Map<dynamic, ReproduccionModel>> getAllReproduccionesWithKeys() async {
    final box = await Hive.openBox<ReproduccionModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null),
    );
  }
}
