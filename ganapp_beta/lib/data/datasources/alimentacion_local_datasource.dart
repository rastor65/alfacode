import 'package:hive/hive.dart';
import '../models/alimentacion_model.dart';

class AlimentacionLocalDataSource {
  static const _boxName = 'alimentaciones';

  Future<void> addAlimentacion(AlimentacionModel a) async {
    final box = await Hive.openBox<AlimentacionModel>(_boxName);
    await box.add(a);
  }

  Future<List<AlimentacionModel>> getAlimentacionesForAnimal(int animalKey) async {
    final box = await Hive.openBox<AlimentacionModel>(_boxName);
    return box.values
        .where((v) => v != null && v.animalKey == animalKey)
        .toList();
  }

  Future<void> deleteAlimentacion(int key) async {
    final box = await Hive.openBox<AlimentacionModel>(_boxName);
    await box.delete(key);
  }

  Future<void> updateAlimentacion(int key, AlimentacionModel a) async {
    final box = await Hive.openBox<AlimentacionModel>(_boxName);
    await box.put(key, a);
  }

  Future<Map<dynamic, AlimentacionModel>> getAlimentacionesWithKeysForAnimal(int animalKey) async {
    final box = await Hive.openBox<AlimentacionModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null && e.value.animalKey == animalKey),
    );
  }

  // Método para obtener todas las alimentaciones con validación de null
  Future<Map<dynamic, AlimentacionModel>> getAllAlimentacionesWithKeys() async {
    final box = await Hive.openBox<AlimentacionModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null),
    );
  }
}
