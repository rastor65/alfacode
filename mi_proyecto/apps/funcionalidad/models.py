from django.db import models
from ..autenticacion.models import *

# Create your models here.
class Categoria(models.Model):
    nombre_categoria = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre_categoria
    
class TablaMaestra(models.Model):
    nombre_tipo = models.CharField(max_length=100)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nombre_tipo} - {self.categoria}"
    
from django.db import models
from ..autenticacion.models import Usuario

class Animal(models.Model):
    nombre = models.CharField(max_length=100)
    especie = models.ForeignKey('TablaMaestra', on_delete=models.CASCADE, related_name='animales_especie')
    raza = models.ForeignKey('TablaMaestra', on_delete=models.CASCADE, related_name='animales_raza')
    sexo = models.ForeignKey('TablaMaestra', on_delete=models.CASCADE, related_name='animales_sexo')
    fecha_nacimiento = models.DateField()
    estado_reproductivo = models.ForeignKey('TablaMaestra', on_delete=models.CASCADE, related_name='animales_estado_reproductivo')
    estado_salud = models.ForeignKey('TablaMaestra', on_delete=models.CASCADE, related_name='animales_estado_salud')
    propietario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='animales')
    imagen_url = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre
    
class Tratamiento(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE)
    tipo = models.ForeignKey(TablaMaestra, on_delete=models.CASCADE)
    fecha_aplicacion = models.DateField()
    medicamento = models.CharField(max_length=100)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Tratamiento para {self.animal.nombre} - {self.medicamento}"

class Reproduccion(models.Model):
    animales = models.ManyToManyField('Animal', related_name='reproducciones')
    tipo = models.ForeignKey(TablaMaestra, on_delete=models.CASCADE)
    fecha_monta = models.DateField()
    fecha_parto_estimada = models.DateField()
    resultado = models.CharField(max_length=100)

    def __str__(self):
        return f"Reproducción ({self.resultado})"

class Evento(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE)
    tipo = models.ForeignKey(TablaMaestra, on_delete=models.CASCADE)
    descripcion = models.TextField()
    fecha_evento = models.DateField()

    def __str__(self):
        return f"Evento de {self.animal.nombre} - {self.tipo.nombre_tipo}"