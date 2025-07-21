import 'package:hive/hive.dart';

part 'recurso_model.g.dart';

@HiveType(typeId: 12)
class RecursoModel extends HiveObject {
  @HiveField(0)
  final int id;
  @HiveField(1)
  final String nombre;
  @HiveField(2)
  final String descripcion;
  @HiveField(3)
  final String path;
  @HiveField(4)
  final String metodo; // Ej: GET, POST, VIEW

  RecursoModel({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.path,
    required this.metodo,
  });
}
