// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'alimentacion_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AlimentacionModelAdapter extends TypeAdapter<AlimentacionModel> {
  @override
  final int typeId = 5;

  @override
  AlimentacionModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AlimentacionModel(
      animalKey: fields[0] as int,
      tipoAlimento: fields[1] as String,
      cantidad: fields[2] as double,
      fecha: fields[3] as DateTime,
      observaciones: fields[4] as String,
    );
  }

  @override
  void write(BinaryWriter writer, AlimentacionModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.animalKey)
      ..writeByte(1)
      ..write(obj.tipoAlimento)
      ..writeByte(2)
      ..write(obj.cantidad)
      ..writeByte(3)
      ..write(obj.fecha)
      ..writeByte(4)
      ..write(obj.observaciones);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AlimentacionModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
