import 'package:hive/hive.dart';

part 'animal_model.g.dart';

@HiveType(typeId: 1)
class AnimalModel extends HiveObject {
  @HiveField(0)
  final String name;
  @HiveField(1)
  final String especie; // Vacuno, Ovino, Porcino, Caprino, Aves de Corral
  @HiveField(2)
  final String tipo;    // Vaca, Toro, Ternero, Oveja, Cerdo, Cabra, Pollo, Pato, Pavo
  @HiveField(3)
  final String ownerUsername;
  @HiveField(4)
  final String raza; // Nuevo campo
  @HiveField(5)
  final String sexo; // Nuevo campo: Macho, Hembra
  @HiveField(6)
  final String estadoSalud; // Nuevo campo: Sano, Enfermo, Cuarentena
  @HiveField(7)
  final DateTime fechaNacimiento; // Nuevo campo
  @HiveField(8)
  final String estadoReproductivo; // Nuevo campo: Gestante, Lactante, Vacía, Reproductor
  @HiveField(9)
  final String? animalImagen; // Nuevo campo: Ruta de la imagen (opcional)
  @HiveField(10)
  final int? animalPadreKey; // Nuevo campo: Clave del animal padre (opcional)
  @HiveField(11)
  final int? animalMadreKey; // Nuevo campo: Clave del animal madre (opcional)

  AnimalModel({
    required this.name,
    required this.especie,
    required this.tipo,
    required this.ownerUsername,
    required this.raza,
    required this.sexo,
    required this.estadoSalud,
    required this.fechaNacimiento,
    required this.estadoReproductivo,
    this.animalImagen,
    this.animalPadreKey,
    this.animalMadreKey,
  });
}
