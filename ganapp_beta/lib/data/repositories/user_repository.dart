import '../models/user_model.dart';
import '../models/rol_model.dart';
import '../models/recurso_model.dart';
import '../models/usuario_rol_model.dart'; // Asegúrate de que esta importación esté presente
import '../models/rol_recurso_model.dart'; // Asegúrate de que esta importación esté presente

import '../datasources/user_local_datasource.dart';
import '../datasources/rol_local_datasource.dart';
import '../datasources/recurso_local_datasource.dart';
import '../datasources/usuario_rol_local_datasource.dart';
import '../datasources/rol_recurso_local_datasource.dart';

class UserRepository {
  final UserLocalDataSource userLocalDataSource;
  final RolLocalDataSource rolLocalDataSource;
  final RecursoLocalDataSource recursoLocalDataSource;
  final UsuarioRolLocalDataSource usuarioRolLocalDataSource;
  final RolRecursoLocalDataSource rolRecursoLocalDataSource;

  UserRepository({
    required this.userLocalDataSource,
    required this.rolLocalDataSource,
    required this.recursoLocalDataSource,
    required this.usuarioRolLocalDataSource,
    required this.rolRecursoLocalDataSource,
  });

  Future<void> register(UserModel user) async {
    await userLocalDataSource.addUser(user);
    // En el futuro: await remoteDataSource.addUser(user);
  }

  Future<UserModel?> login(String correo, String passwordHash) async {
    final user = await userLocalDataSource.getUserByCorreo(correo);
    if (user != null && user.passwordHash == passwordHash && user.estado == 1) {
      return user;
    }
    return null;
  }

  Future<void> updateUser(UserModel user) async {
    await userLocalDataSource.updateUser(user);
  }

  // Métodos para roles y recursos
  Future<List<RolModel>> getUserRoles(int userId) async {
    final userRoles = await usuarioRolLocalDataSource.getRolesForUsuario(userId);
    final List<RolModel> roles = [];
    for (var ur in userRoles) {
      final rol = await rolLocalDataSource.getRolById(ur.rolId);
      if (rol != null) {
        roles.add(rol);
      }
    }
    return roles;
  }

  Future<List<RecursoModel>> getAccessibleResources(int userId) async {
    final userRoles = await getUserRoles(userId);
    final Set<int> accessibleResourceIds = {};

    for (var rol in userRoles) {
      final rolResources = await rolRecursoLocalDataSource.getRecursosForRol(rol.id);
      for (var rr in rolResources) {
        accessibleResourceIds.add(rr.recursoId);
      }
    }

    final List<RecursoModel> resources = [];
    for (var id in accessibleResourceIds) {
      final recurso = await recursoLocalDataSource.getRecursoById(id);
      if (recurso != null) {
        resources.add(recurso);
      }
    }
    return resources;
  }

  // Método para inicializar roles y recursos (ejemplo, se llamaría una vez al inicio de la app)
  Future<void> initializeRolesAndResources() async {
    // Roles
    await rolLocalDataSource.addRol(RolModel(id: 1, nombre: 'admin'));
    await rolLocalDataSource.addRol(RolModel(id: 2, nombre: 'propietario'));
    await rolLocalDataSource.addRol(RolModel(id: 3, nombre: 'trabajador'));
    await rolLocalDataSource.addRol(RolModel(id: 4, nombre: 'veterinario'));

    // Recursos (ejemplos)
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 101, nombre: 'Gestionar Animales', descripcion: 'Acceso a la lista y formularios de animales', path: '/animals', metodo: 'VIEW'));
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 102, nombre: 'Gestionar Usuarios', descripcion: 'Acceso a la gestión de usuarios', path: '/users', metodo: 'VIEW'));
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 103, nombre: 'Ver Reportes', descripcion: 'Acceso a los reportes de la granja', path: '/reports', metodo: 'VIEW'));
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 104, nombre: 'Gestionar Vacunas', descripcion: 'Acceso a la gestión de vacunas', path: '/vacunacion', metodo: 'VIEW'));
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 105, nombre: 'Gestionar Tratamientos', descripcion: 'Acceso a la gestión de tratamientos', path: '/tratamiento', metodo: 'VIEW'));
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 106, nombre: 'Gestionar Alimentacion', descripcion: 'Acceso a la gestión de alimentación', path: '/alimentacion', metodo: 'VIEW'));
    await recursoLocalDataSource.addRecurso(RecursoModel(id: 107, nombre: 'Gestionar Eventos', descripcion: 'Acceso a la gestión de eventos', path: '/events', metodo: 'VIEW'));


    // Asignar recursos a roles (ejemplos)
    // Admin tiene acceso a todo
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 101));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 102));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 103));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 104));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 105));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 106));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 1, recursoId: 107));
    // Propietario tiene acceso a gestionar animales, vacunas, tratamientos, alimentación, eventos y ver reportes
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 2, recursoId: 101));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 2, recursoId: 103));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 2, recursoId: 104));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 2, recursoId: 105));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 2, recursoId: 106));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 2, recursoId: 107));
    // Trabajador tiene acceso a gestionar animales, vacunas, tratamientos, alimentación, eventos
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 3, recursoId: 101));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 3, recursoId: 104));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 3, recursoId: 105));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 3, recursoId: 106));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 3, recursoId: 107));
    // Veterinario tiene acceso a gestionar vacunas y tratamientos
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 4, recursoId: 104));
    await rolRecursoLocalDataSource.addRolRecurso(RolRecursoModel(rolId: 4, recursoId: 105));
  }

  // Método para asignar un rol a un usuario
  Future<void> assignRoleToUser(int userId, int rolId) async {
    await usuarioRolLocalDataSource.addUsuarioRol(UsuarioRolModel(usuarioId: userId, rolId: rolId));
  }
}
