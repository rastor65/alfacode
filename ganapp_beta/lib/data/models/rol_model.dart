import 'package:hive/hive.dart';

part 'rol_model.g.dart';

@HiveType(typeId: 10)
class RolModel extends HiveObject {
  @HiveField(0)
  final int id;
  @HiveField(1)
  final String nombre; // admin, propietario, trabajador, veterinario

  RolModel({required this.id, required this.nombre});
}
