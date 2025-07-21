import 'package:hive/hive.dart';
import '../models/user_model.dart';

class UserLocalDataSource {
  static const _boxName = 'users';

  Future<void> addUser(UserModel user) async {
    final box = await Hive.openBox<UserModel>(_boxName);
    await box.put(user.id, user);
  }

  Future<UserModel?> getUserByCorreo(String correo) async {
    try {
      final box = await Hive.openBox<UserModel>(_boxName);
      final users = box.values.where((user) => 
        user != null && 
        user.correo != null && 
        user.correo == correo
      );
      return users.isNotEmpty ? users.first : null;
    } catch (e) {
      print('Error al obtener usuario por correo $correo: $e');
      return null;
    }
  }

  Future<UserModel?> getUserById(int id) async {
    try {
      final box = await Hive.openBox<UserModel>(_boxName);
      return box.get(id);
    } catch (e) {
      print('Error al obtener usuario por ID $id: $e');
      return null;
    }
  }

  Future<void> updateUser(UserModel user) async {
    final box = await Hive.openBox<UserModel>(_boxName);
    await box.put(user.id, user);
  }

  Future<List<UserModel>> getAllUsers() async {
    final box = await Hive.openBox<UserModel>(_boxName);
    return box.values.where((user) => user != null).toList();
  }
}
