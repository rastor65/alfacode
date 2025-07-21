import 'package:hive/hive.dart';

part 'vacunacion_model.g.dart';

@HiveType(typeId: 3)
class VacunacionModel extends HiveObject {
  @HiveField(0)
  final int animalKey;
  @HiveField(1)
  final String nombreVacuna;
  @HiveField(2)
  final String medicamento;
  @HiveField(3)
  final DateTime fechaAplicacion;
  @HiveField(4)
  final String observaciones;

  VacunacionModel({
    required this.animalKey,
    required this.nombreVacuna,
    required this.medicamento,
    required this.fechaAplicacion,
    required this.observaciones,
  });
}
