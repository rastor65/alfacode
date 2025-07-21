// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rol_recurso_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RolRecursoModelAdapter extends TypeAdapter<RolRecursoModel> {
  @override
  final int typeId = 13;

  @override
  RolRecursoModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RolRecursoModel(
      rolId: fields[0] as int,
      recursoId: fields[1] as int,
    );
  }

  @override
  void write(BinaryWriter writer, RolRecursoModel obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.rolId)
      ..writeByte(1)
      ..write(obj.recursoId);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RolRecursoModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
