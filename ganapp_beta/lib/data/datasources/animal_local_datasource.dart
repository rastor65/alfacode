import 'package:hive/hive.dart';
import '../models/animal_model.dart';

class AnimalLocalDataSource {
  static const _boxName = 'animals';

  Future<void> addAnimal(AnimalModel animal) async {
    final box = await Hive.openBox<AnimalModel>(_boxName);
    await box.add(animal);
  }

  Future<List<AnimalModel>> getAnimalsByOwner(String ownerUsername) async {
    try {
      final box = await Hive.openBox<AnimalModel>(_boxName);
      return box.values
          .where((a) => a != null && a.ownerUsername == ownerUsername)
          .toList();
    } catch (e) {
      print('Error al obtener animales por propietario: $e');
      // Si hay error, intentar limpiar datos corruptos
      await _cleanCorruptedData();
      return [];
    }
  }

  Future<void> deleteAnimal(int key) async {
    final box = await Hive.openBox<AnimalModel>(_boxName);
    await box.delete(key);
  }

  Future<void> updateAnimal(int key, AnimalModel animal) async {
    final box = await Hive.openBox<AnimalModel>(_boxName);
    await box.put(key, animal);
  }

  Future<Map<dynamic, AnimalModel>> getAnimalsWithKeysByOwner(String ownerUsername) async {
    try {
      final box = await Hive.openBox<AnimalModel>(_boxName);
      final allAnimals = <dynamic, AnimalModel>{};
      
      // Iterar manualmente para manejar errores de datos corruptos
      for (var key in box.keys) {
        try {
          final animal = box.get(key);
          if (animal != null && 
              animal.ownerUsername != null && 
              animal.ownerUsername == ownerUsername) {
            allAnimals[key] = animal;
          }
        } catch (e) {
          print('Error al leer animal con clave $key: $e');
          // Eliminar el registro corrupto
          await box.delete(key);
        }
      }
      
      return allAnimals;
    } catch (e) {
      print('Error crítico al obtener animales: $e');
      // Si hay un error crítico, intentar limpiar toda la base de datos
      await _cleanCorruptedData();
      return {};
    }
  }

  // Método para obtener un animal por su clave con validación de null
  Future<AnimalModel?> getAnimalByKey(int key) async {
    try {
      final box = await Hive.openBox<AnimalModel>(_boxName);
      return box.get(key);
    } catch (e) {
      print('Error al obtener animal por clave $key: $e');
      return null;
    }
  }

  // Método para obtener todos los animales con validación
  Future<Map<dynamic, AnimalModel>> getAllAnimalsWithKeys() async {
    try {
      final box = await Hive.openBox<AnimalModel>(_boxName);
      final allAnimals = <dynamic, AnimalModel>{};
      
      // Iterar manualmente para manejar errores de datos corruptos
      for (var key in box.keys) {
        try {
          final animal = box.get(key);
          if (animal != null) {
            allAnimals[key] = animal;
          }
        } catch (e) {
          print('Error al leer animal con clave $key: $e');
          // Eliminar el registro corrupto
          await box.delete(key);
        }
      }
      
      return allAnimals;
    } catch (e) {
      print('Error crítico al obtener todos los animales: $e');
      await _cleanCorruptedData();
      return {};
    }
  }

  // Método para limpiar datos corruptos
  Future<void> _cleanCorruptedData() async {
    try {
      print('Limpiando datos corruptos de animales...');
      final box = await Hive.openBox<AnimalModel>(_boxName);
      
      final keysToDelete = <dynamic>[];
      for (var key in box.keys) {
        try {
          final animal = box.get(key);
          // Verificar si el animal es válido
          if (animal == null || 
              animal.name == null || 
              animal.especie == null || 
              animal.tipo == null || 
              animal.ownerUsername == null) {
            keysToDelete.add(key);
          }
        } catch (e) {
          keysToDelete.add(key);
        }
      }
      
      // Eliminar registros corruptos
      for (var key in keysToDelete) {
        await box.delete(key);
        print('Eliminado registro corrupto con clave: $key');
      }
      
      print('Limpieza completada. Eliminados ${keysToDelete.length} registros corruptos.');
    } catch (e) {
      print('Error durante la limpieza: $e');
      // Como último recurso, limpiar toda la caja
      await _clearAllData();
    }
  }

  // Método para limpiar toda la base de datos de animales (último recurso)
  Future<void> _clearAllData() async {
    try {
      print('Limpiando toda la base de datos de animales...');
      final box = await Hive.openBox<AnimalModel>(_boxName);
      await box.clear();
      print('Base de datos de animales limpiada completamente.');
    } catch (e) {
      print('Error al limpiar la base de datos: $e');
    }
  }

  // Método público para forzar limpieza (útil para debugging)
  Future<void> forceCleanDatabase() async {
    await _cleanCorruptedData();
  }

  // Método para verificar la integridad de los datos
  Future<bool> verifyDataIntegrity() async {
    try {
      final box = await Hive.openBox<AnimalModel>(_boxName);
      int validCount = 0;
      int invalidCount = 0;
      
      for (var key in box.keys) {
        try {
          final animal = box.get(key);
          if (animal != null && 
              animal.name != null && 
              animal.especie != null && 
              animal.tipo != null && 
              animal.ownerUsername != null) {
            validCount++;
          } else {
            invalidCount++;
          }
        } catch (e) {
          invalidCount++;
        }
      }
      
      print('Verificación de integridad: $validCount válidos, $invalidCount inválidos');
      return invalidCount == 0;
    } catch (e) {
      print('Error durante verificación de integridad: $e');
      return false;
    }
  }
}
