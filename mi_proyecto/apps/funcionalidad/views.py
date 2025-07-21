from rest_framework import viewsets
from .models import Categoria, TablaMaestra, Animal, Tratamiento, Reproduccion, Evento
from .serializer import (
    CategoriaSerializer,
    TablaMaestraSerializer,
    AnimalSerializer,
    TratamientoSerializer,
    ReproduccionSerializer,
    EventoSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class TablaMaestraViewSet(viewsets.ModelViewSet):
    queryset = TablaMaestra.objects.all()
    serializer_class = TablaMaestraSerializer


class AnimalViewSet(viewsets.ModelViewSet):
    queryset = Animal.objects.all()
    serializer_class = AnimalSerializer


class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer


class ReproduccionViewSet(viewsets.ModelViewSet):
    queryset = Reproduccion.objects.all()
    serializer_class = ReproduccionSerializer


class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
