import 'package:hive/hive.dart';

part 'usuario_rol_model.g.dart';

@HiveType(typeId: 11)
class UsuarioRolModel extends HiveObject {
  @HiveField(0)
  final int usuarioId;
  @HiveField(1)
  final int rolId;

  UsuarioRolModel({required this.usuarioId, required this.rolId});
}
