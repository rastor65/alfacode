// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tratamiento_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class TratamientoModelAdapter extends TypeAdapter<TratamientoModel> {
  @override
  final int typeId = 4;

  @override
  TratamientoModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return TratamientoModel(
      animalKey: fields[0] as int,
      tipoTratamiento: fields[1] as String,
      medicamento: fields[2] as String,
      fechaAplicacion: fields[3] as DateTime,
      observaciones: fields[4] as String,
    );
  }

  @override
  void write(BinaryWriter writer, TratamientoModel obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.animalKey)
      ..writeByte(1)
      ..write(obj.tipoTratamiento)
      ..writeByte(2)
      ..write(obj.medicamento)
      ..writeByte(3)
      ..write(obj.fechaAplicacion)
      ..writeByte(4)
      ..write(obj.observaciones);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TratamientoModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
