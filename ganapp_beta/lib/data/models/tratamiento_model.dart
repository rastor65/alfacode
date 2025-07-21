import 'package:hive/hive.dart';

part 'tratamiento_model.g.dart';

@HiveType(typeId: 4)
class TratamientoModel extends HiveObject {
  @HiveField(0)
  final int animalKey;
  @HiveField(1)
  final String tipoTratamiento; // Ej: Desparasitación, Vitaminización, etc.
  @HiveField(2)
  final String medicamento;
  @HiveField(3)
  final DateTime fechaAplicacion;
  @HiveField(4)
  final String observaciones;

  TratamientoModel({
    required this.animalKey,
    required this.tipoTratamiento,
    required this.medicamento,
    required this.fechaAplicacion,
    required this.observaciones,
  });
}
