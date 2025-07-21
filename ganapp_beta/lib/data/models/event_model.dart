import 'package:hive/hive.dart';

part 'event_model.g.dart';

@HiveType(typeId: 2)
class EventModel extends HiveObject {
  @HiveField(0)
  final int animalKey; // Hive key del animal relacionado
  @HiveField(1)
  final String tipo; // Tipo de evento (Nacimiento, Muerte, Venta, etc)
  @HiveField(2)
  final String descripcion;
  @HiveField(3)
  final DateTime fecha;

  EventModel({
    required this.animalKey,
    required this.tipo,
    required this.descripcion,
    required this.fecha,
  });
}
