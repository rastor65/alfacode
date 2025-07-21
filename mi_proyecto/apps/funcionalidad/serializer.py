from rest_framework import serializers
from .models import Categoria, TablaMaestra, Animal, Tratamiento, Reproduccion, Evento
from ..autenticacion.models import Usuario 

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class TablaMaestraSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(), source='categoria', write_only=True
    )

    class Meta:
        model = TablaMaestra
        fields = ['id', 'nombre_tipo', 'categoria', 'categoria_id']


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre_usuario']


class AnimalSerializer(serializers.ModelSerializer):
    propietario = UsuarioSerializer(read_only=True)
    propietario_id = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all(), source='propietario', write_only=True)

    especie = TablaMaestraSerializer(read_only=True)
    especie_id = serializers.PrimaryKeyRelatedField(queryset=TablaMaestra.objects.all(), source='especie', write_only=True)

    raza = TablaMaestraSerializer(read_only=True)
    raza_id = serializers.PrimaryKeyRelatedField(queryset=TablaMaestra.objects.all(), source='raza', write_only=True)

    sexo = TablaMaestraSerializer(read_only=True)
    sexo_id = serializers.PrimaryKeyRelatedField(queryset=TablaMaestra.objects.all(), source='sexo', write_only=True)

    estado_reproductivo = TablaMaestraSerializer(read_only=True)
    estado_reproductivo_id = serializers.PrimaryKeyRelatedField(queryset=TablaMaestra.objects.all(), source='estado_reproductivo', write_only=True)

    estado_salud = TablaMaestraSerializer(read_only=True)
    estado_salud_id = serializers.PrimaryKeyRelatedField(queryset=TablaMaestra.objects.all(), source='estado_salud', write_only=True)

    class Meta:
        model = Animal
        fields = [
            'id', 'nombre', 'raza', 'raza_id', 'sexo', 'sexo_id',
            'fecha_nacimiento', 'estado_reproductivo', 'estado_reproductivo_id',
            'estado_salud', 'estado_salud_id', 'imagen_url',
            'propietario', 'propietario_id'
        ]

class TratamientoSerializer(serializers.ModelSerializer):
    animal = AnimalSerializer(read_only=True)
    animal_id = serializers.PrimaryKeyRelatedField(
        queryset=Animal.objects.all(), source='animal', write_only=True
    )
    tipo = TablaMaestraSerializer(read_only=True)
    tipo_id = serializers.PrimaryKeyRelatedField(
        queryset=TablaMaestra.objects.all(), source='tipo', write_only=True
    )

    class Meta:
        model = Tratamiento
        fields = ['id', 'animal', 'animal_id', 'tipo', 'tipo_id',
                  'fecha_aplicacion', 'medicamento', 'observaciones']


class ReproduccionSerializer(serializers.ModelSerializer):
    animales = AnimalSerializer(many=True, read_only=True)
    animales_id = serializers.PrimaryKeyRelatedField(
        queryset=Animal.objects.all(), many=True, source='animales', write_only=True
    )
    tipo = TablaMaestraSerializer(read_only=True)
    tipo_id = serializers.PrimaryKeyRelatedField(
        queryset=TablaMaestra.objects.all(), source='tipo', write_only=True
    )

    class Meta:
        model = Reproduccion
        fields = ['id', 'animales', 'animales_id', 'tipo', 'tipo_id',
                  'fecha_monta', 'fecha_parto_estimada', 'resultado']


class EventoSerializer(serializers.ModelSerializer):
    animal = AnimalSerializer(read_only=True)
    animal_id = serializers.PrimaryKeyRelatedField(
        queryset=Animal.objects.all(), source='animal', write_only=True
    )
    tipo = TablaMaestraSerializer(read_only=True)
    tipo_id = serializers.PrimaryKeyRelatedField(
        queryset=TablaMaestra.objects.all(), source='tipo', write_only=True
    )

    class Meta:
        model = Evento
        fields = ['id', 'animal', 'animal_id', 'tipo', 'tipo_id',
                  'descripcion', 'fecha_evento']
