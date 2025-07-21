// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reproduccion_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ReproduccionModelAdapter extends TypeAdapter<ReproduccionModel> {
  @override
  final int typeId = 6;

  @override
  ReproduccionModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ReproduccionModel(
      animalId: fields[0] as int,
      tipoReproduccion: fields[1] as String,
      fechaReproduccion: fields[2] as DateTime,
      fechaEstimadaParto: fields[3] as DateTime?,
      resultadoReproduccion: fields[4] as String,
      animalPadreKey: fields[5] as int?,
      animalMadreKey: fields[6] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, ReproduccionModel obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.animalId)
      ..writeByte(1)
      ..write(obj.tipoReproduccion)
      ..writeByte(2)
      ..write(obj.fechaReproduccion)
      ..writeByte(3)
      ..write(obj.fechaEstimadaParto)
      ..writeByte(4)
      ..write(obj.resultadoReproduccion)
      ..writeByte(5)
      ..write(obj.animalPadreKey)
      ..writeByte(6)
      ..write(obj.animalMadreKey);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReproduccionModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
