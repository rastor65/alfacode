import 'package:hive/hive.dart';
import '../models/rol_recurso_model.dart';

class RolRecursoLocalDataSource {
  static const _boxName = 'rolxrecurso';

  Future<void> addRolRecurso(RolRecursoModel rr) async {
    final box = await Hive.openBox<RolRecursoModel>(_boxName);
    await box.add(rr);
  }

  Future<List<RolRecursoModel>> getRecursosForRol(int rolId) async {
    final box = await Hive.openBox<RolRecursoModel>(_boxName);
    return box.values.where((rr) => rr.rolId == rolId).toList();
  }

  Future<List<RolRecursoModel>> getRolesForRecurso(int recursoId) async {
    final box = await Hive.openBox<RolRecursoModel>(_boxName);
    return box.values.where((rr) => rr.recursoId == recursoId).toList();
  }
}
