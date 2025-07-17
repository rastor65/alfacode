from django.db import models

class Productos(models.Model):
    nombre = models.CharField(max_length=30, unique=True)
    precio = models.FloatField()
    marca = models.CharField(max_length=30, unique=True)

    class Meta:
        verbose_name = "producto"
        verbose_name_plural = "productos"

    def __str__(self):
        return f'{self.nombre} - {self.precio}'