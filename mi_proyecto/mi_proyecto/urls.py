from django.contrib import admin
from django.urls import path
from apps.autenticacion.views import *
from apps.productos.views import ProductosRetrieveUpdateDestroyView, ProductosViewList
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/autenticacion/', include('apps.autenticacion.urls')),

    path('usuarios/', UsuarioListView.as_view(), name='usuario-list-create'),
    path('usuarios/<int:pk>/', UsuarioRetrieveUpdateDestroyView.as_view(), name='usuario-detail'),

    path('productos/', ProductosViewList.as_view(), name='productos-list-create'),
    path('productos/<int:pk>/', ProductosRetrieveUpdateDestroyView.as_view(), name='productos-detail'),
    
]
