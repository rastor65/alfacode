from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    CategoriaViewSet,
    TablaMaestraViewSet,
    AnimalViewSet,
    TratamientoViewSet,
    ReproduccionViewSet,
    EventoViewSet
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'tipos', TablaMaestraViewSet)
router.register(r'animales', AnimalViewSet)
router.register(r'tratamientos', TratamientoViewSet)
router.register(r'reproducciones', ReproduccionViewSet)
router.register(r'eventos', EventoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
