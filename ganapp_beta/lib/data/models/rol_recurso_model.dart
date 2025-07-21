import 'package:hive/hive.dart';

part 'rol_recurso_model.g.dart';

@HiveType(typeId: 13)
class RolRecursoModel extends HiveObject {
  @HiveField(0)
  final int rolId;
  @HiveField(1)
  final int recursoId;

  RolRecursoModel({required this.rolId, required this.recursoId});
}
