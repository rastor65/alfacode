// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'animal_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AnimalModelAdapter extends TypeAdapter<AnimalModel> {
  @override
  final int typeId = 1;

  @override
  AnimalModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AnimalModel(
      name: fields[0] as String,
      especie: fields[1] as String,
      tipo: fields[2] as String,
      ownerUsername: fields[3] as String,
      raza: fields[4] as String,
      sexo: fields[5] as String,
      estadoSalud: fields[6] as String,
      fechaNacimiento: fields[7] as DateTime,
      estadoReproductivo: fields[8] as String,
      animalImagen: fields[9] as String?,
      animalPadreKey: fields[10] as int?,
      animalMadreKey: fields[11] as int?,
    );
  }

  @override
  void write(BinaryWriter writer, AnimalModel obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.name)
      ..writeByte(1)
      ..write(obj.especie)
      ..writeByte(2)
      ..write(obj.tipo)
      ..writeByte(3)
      ..write(obj.ownerUsername)
      ..writeByte(4)
      ..write(obj.raza)
      ..writeByte(5)
      ..write(obj.sexo)
      ..writeByte(6)
      ..write(obj.estadoSalud)
      ..writeByte(7)
      ..write(obj.fechaNacimiento)
      ..writeByte(8)
      ..write(obj.estadoReproductivo)
      ..writeByte(9)
      ..write(obj.animalImagen)
      ..writeByte(10)
      ..write(obj.animalPadreKey)
      ..writeByte(11)
      ..write(obj.animalMadreKey);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AnimalModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
