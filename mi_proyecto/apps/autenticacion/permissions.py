from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):

    ADMIN_NAMES = ['Administrador', 'administrador', 'admin', 'Admin']
    
    def has_permission(self, request, view):
        user = request.user
        perfil = getattr(user, 'perfil', None)
        if perfil and perfil.rol and perfil.rol.nombre:
            return perfil.rol.nombre.lower() in self.ADMIN_NAMES
        return False

class IsUserRole(BasePermission):

    USER_NAMES = ['Usuario', 'usuario', 'user', 'User']
    
    def has_permission(self, request, view):
        user = request.user
        perfil = getattr(user, 'perfil', None)
        if perfil and perfil.rol and perfil.rol.nombre:
            return perfil.rol.nombre.lower() in self.USER_NAMES
        return False
