import 'package:hive/hive.dart';
import '../models/recurso_model.dart';

class RecursoLocalDataSource {
  static const _boxName = 'recursos';

  Future<void> addRecurso(RecursoModel recurso) async {
    final box = await Hive.openBox<RecursoModel>(_boxName);
    await box.put(recurso.id, recurso);
  }

  Future<List<RecursoModel>> getAllRecursos() async {
    final box = await Hive.openBox<RecursoModel>(_boxName);
    return box.values.toList();
  }

  Future<RecursoModel?> getRecursoById(int id) async {
    final box = await Hive.openBox<RecursoModel>(_boxName);
    return box.get(id);
  }
}
