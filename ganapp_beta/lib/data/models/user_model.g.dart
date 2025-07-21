// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class UserModelAdapter extends TypeAdapter<UserModel> {
  @override
  final int typeId = 0;

  @override
  UserModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return UserModel(
      id: fields[0] as int,
      correo: fields[1] as String,
      passwordHash: fields[2] as String,
      nombres: fields[3] as String?,
      apellidos: fields[4] as String?,
      identificacion: fields[5] as String?,
      celular: fields[6] as String?,
      comunidad: fields[7] as String?,
      avatarUrl: fields[8] as String?,
      estado: fields[9] as int,
    );
  }

  @override
  void write(BinaryWriter writer, UserModel obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.correo)
      ..writeByte(2)
      ..write(obj.passwordHash)
      ..writeByte(3)
      ..write(obj.nombres)
      ..writeByte(4)
      ..write(obj.apellidos)
      ..writeByte(5)
      ..write(obj.identificacion)
      ..writeByte(6)
      ..write(obj.celular)
      ..writeByte(7)
      ..write(obj.comunidad)
      ..writeByte(8)
      ..write(obj.avatarUrl)
      ..writeByte(9)
      ..write(obj.estado);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
