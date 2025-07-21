// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rol_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RolModelAdapter extends TypeAdapter<RolModel> {
  @override
  final int typeId = 10;

  @override
  RolModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RolModel(
      id: fields[0] as int,
      nombre: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, RolModel obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.nombre);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RolModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
