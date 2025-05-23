from django.db import models
from django.contrib.auth.models import User

class TimeStampedModel(models.Model):
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Rol(models.Model):
    nombre = models.CharField(max_length=30, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre

class Usuario(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil", verbose_name="Usuario de autenticación")
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)
    nombres = models.CharField(max_length=45, verbose_name="Nombres", help_text="Nombres del usuario")
    apellidos = models.CharField(max_length=45, verbose_name="Apellidos", help_text="Apellidos del usuario")
    promedio = models.FloatField(null=True, blank=True, verbose_name="Promedio académico", help_text="Promedio del usuario (si aplica)")
    disponibilidad = models.BooleanField(default=True, verbose_name="¿Está disponible?", help_text="Indica si el usuario está disponible")

    class Meta:
        verbose_name = "Perfil de usuario"
        verbose_name_plural = "Perfiles de usuarios"

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

class UsuarioRol(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='roles_asignados')
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='usuarios_asignados')
    asignado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Asignación de Rol"
        verbose_name_plural = "Asignaciones de Roles"
        unique_together = ['usuario', 'rol']

    def __str__(self):
        return f"{self.usuario} → {self.rol}"