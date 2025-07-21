import 'package:hive/hive.dart';
import '../models/usuario_rol_model.dart';

class UsuarioRolLocalDataSource {
  static const _boxName = 'usuariosxrol';

  Future<void> addUsuarioRol(UsuarioRolModel ur) async {
    final box = await Hive.openBox<UsuarioRolModel>(_boxName);
    await box.add(ur);
  }

  Future<List<UsuarioRolModel>> getRolesForUsuario(int usuarioId) async {
    final box = await Hive.openBox<UsuarioRolModel>(_boxName);
    return box.values.where((ur) => ur.usuarioId == usuarioId).toList();
  }

  Future<List<UsuarioRolModel>> getUsuariosForRol(int rolId) async {
    final box = await Hive.openBox<UsuarioRolModel>(_boxName);
    return box.values.where((ur) => ur.rolId == rolId).toList();
  }
}
