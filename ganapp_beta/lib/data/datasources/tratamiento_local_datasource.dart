import 'package:hive/hive.dart';
import '../models/tratamiento_model.dart';

class TratamientoLocalDataSource {
  static const _boxName = 'tratamientos';

  Future<void> addTratamiento(TratamientoModel t) async {
    final box = await Hive.openBox<TratamientoModel>(_boxName);
    await box.add(t);
  }

  Future<List<TratamientoModel>> getTratamientosForAnimal(int animalKey) async {
    final box = await Hive.openBox<TratamientoModel>(_boxName);
    return box.values
        .where((v) => v != null && v.animalKey == animalKey)
        .toList();
  }

  Future<void> deleteTratamiento(int key) async {
    final box = await Hive.openBox<TratamientoModel>(_boxName);
    await box.delete(key);
  }

  Future<void> updateTratamiento(int key, TratamientoModel t) async {
    final box = await Hive.openBox<TratamientoModel>(_boxName);
    await box.put(key, t);
  }

  Future<Map<dynamic, TratamientoModel>> getTratamientosWithKeysForAnimal(int animalKey) async {
    final box = await Hive.openBox<TratamientoModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null && e.value.animalKey == animalKey),
    );
  }

  // Método para obtener todos los tratamientos con validación de null
  Future<Map<dynamic, TratamientoModel>> getAllTratamientosWithKeys() async {
    final box = await Hive.openBox<TratamientoModel>(_boxName);
    final all = box.toMap();
    return Map.fromEntries(
      all.entries.where((e) => e.value != null),
    );
  }
}
