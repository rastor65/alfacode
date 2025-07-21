import 'package:hive/hive.dart';
import '../models/vacunacion_model.dart';

class VacunacionLocalDataSource {
  static const _boxName = 'vacunaciones';

  Future<void> addVacunacion(VacunacionModel vacunacion) async {
    final box = await Hive.openBox<VacunacionModel>(_boxName);
    await box.add(vacunacion);
  }

  Future<List<VacunacionModel>> getVacunacionesForAnimal(int animalKey) async {
    final box = await Hive.openBox<VacunacionModel>(_boxName);
    return box.values
        .where((v) => v != null && v.animalKey == animalKey)
        .toList();
  }

  Future<void> deleteVacunacion(int key) async {
    final box = await Hive.openBox<VacunacionModel>(_boxName);
    await box.delete(key);
  }

  Future<void> updateVacunacion(int key, VacunacionModel vacunacion) async {
    final box = await Hive.openBox<VacunacionModel>(_boxName);
    await box.put(key, vacunacion);
  }

  Future<Map<dynamic, VacunacionModel>> getVacunacionesWithKeysForAnimal(int animalKey) async {
    final box = await Hive.openBox<VacunacionModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null && e.value.animalKey == animalKey),
    );
  }

  // Método para obtener todas las vacunaciones con validación de null
  Future<Map<dynamic, VacunacionModel>> getAllVacunacionesWithKeys() async {
    final box = await Hive.openBox<VacunacionModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null),
    );
  }
}
