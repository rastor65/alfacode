import 'package:hive/hive.dart';

part 'user_model.g.dart';

@HiveType(typeId: 0)
class UserModel extends HiveObject {
  @HiveField(0)
  final int id;
  @HiveField(1)
  final String correo;           // Email (username)
  @HiveField(2)
  final String passwordHash;
  @HiveField(3)
  String? nombres;
  @HiveField(4)
  String? apellidos;
  @HiveField(5)
  String? identificacion;
  @HiveField(6)
  String? celular;
  @HiveField(7)
  String? comunidad;
  @HiveField(8)
  String? avatarUrl;
  @HiveField(9)
  int estado; // 1=activo, 0=inactivo

  UserModel({
    required this.id,
    required this.correo,
    required this.passwordHash,
    this.nombres,
    this.apellidos,
    this.identificacion,
    this.celular,
    this.comunidad,
    this.avatarUrl,
    this.estado = 1,
  });
}
