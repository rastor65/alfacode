// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recurso_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RecursoModelAdapter extends TypeAdapter<RecursoModel> {
  @override
  final int typeId = 12;

  @override
  RecursoModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return RecursoModel(
      id: fields[0] as int,
      nombre: fields[1] as String,
      descripcion: fields[2] as String,
      path: fields[3] as String,
      metodo: fields[4] as String,
    );
  }

  @override
  void write(BinaryWriter writer, RecursoModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.nombre)
      ..writeByte(2)
      ..write(obj.descripcion)
      ..writeByte(3)
      ..write(obj.path)
      ..writeByte(4)
      ..write(obj.metodo);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RecursoModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
