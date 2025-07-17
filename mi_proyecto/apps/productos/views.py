from django.shortcuts import render
from rest_framework import generics
from apps.productos.models import *
from serializer.serializers import *


# Create your views here.
class ProductosViewList(generics.ListAPIView):
    queryset = Productos.objects.all()
    serializer_class = ProductoSerializer

class ProductosRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Productos.objects.all()
    serializer_class = ProductoSerializer