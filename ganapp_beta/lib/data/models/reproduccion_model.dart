import 'package:hive/hive.dart';

part 'reproduccion_model.g.dart';

@HiveType(typeId: 6) // Asegúrate de que este typeId sea único y el siguiente disponible
class ReproduccionModel extends HiveObject {
  @HiveField(0)
  final int animalId; // La clave del animal producto de esta reproducción
  @HiveField(1)
  final String tipoReproduccion; // Ej: Monta Natural, Inseminación Artificial, Transferencia de Embriones
  @HiveField(2)
  final DateTime fechaReproduccion;
  @HiveField(3)
  final DateTime? fechaEstimadaParto; // Opcional, puede ser nulo si no aplica o no se conoce
  @HiveField(4)
  final String resultadoReproduccion; // Ej: Exitosa, Fallida, Aborto, Nacimiento
  @HiveField(5)
  final int? animalPadreKey; // Clave del padre de la reproducción (opcional)
  @HiveField(6)
  final int? animalMadreKey; // Clave de la madre de la reproducción (opcional)


  ReproduccionModel({
    required this.animalId,
    required this.tipoReproduccion,
    required this.fechaReproduccion,
    this.fechaEstimadaParto,
    required this.resultadoReproduccion,
    this.animalPadreKey,
    this.animalMadreKey,
  });
}
