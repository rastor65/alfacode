import 'package:hive/hive.dart';
import '../models/rol_model.dart';

class RolLocalDataSource {
  static const _boxName = 'roles';

  Future<void> addRol(RolModel rol) async {
    final box = await Hive.openBox<RolModel>(_boxName);
    await box.put(rol.id, rol);
  }

  Future<List<RolModel>> getAllRoles() async {
    final box = await Hive.openBox<RolModel>(_boxName);
    return box.values.toList();
  }

  Future<RolModel?> getRolById(int id) async {
    final box = await Hive.openBox<RolModel>(_boxName);
    return box.get(id);
  }
}
