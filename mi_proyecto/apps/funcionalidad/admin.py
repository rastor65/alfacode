from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import *

admin.site.register(Categoria)
admin.site.register(TablaMaestra)
admin.site.register(Animal)
admin.site.register(Tratamiento)
admin.site.register(Reproduccion)
admin.site.register(Evento)
