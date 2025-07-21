import 'package:hive/hive.dart';

part 'alimentacion_model.g.dart';

@HiveType(typeId: 5)
class AlimentacionModel extends HiveObject {
  @HiveField(0)
  final int animalKey;
  @HiveField(1)
  final String tipoAlimento; // Ej: Concentrado, Pasto, Suplemento
  @HiveField(2)
  final double cantidad; // Kg, litros, etc.
  @HiveField(3)
  final DateTime fecha;
  @HiveField(4)
  final String observaciones;

  AlimentacionModel({
    required this.animalKey,
    required this.tipoAlimento,
    required this.cantidad,
    required this.fecha,
    required this.observaciones,
  });
}
