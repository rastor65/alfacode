import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';

// Importa tus modelos
import 'data/models/user_model.dart';
import 'data/models/animal_model.dart';
import 'data/models/event_model.dart';
import 'data/models/vacunacion_model.dart';
import 'data/models/tratamiento_model.dart';
import 'data/models/alimentacion_model.dart';
import 'data/models/rol_model.dart';
import 'data/models/recurso_model.dart';
import 'data/models/usuario_rol_model.dart';
import 'data/models/rol_recurso_model.dart';
import 'data/models/reproduccion_model.dart';

// Importa tu archivo de rutas
import 'routes/app_routes.dart';

// Importa tu tema
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  // Registra los adapters
  Hive.registerAdapter(UserModelAdapter());
  Hive.registerAdapter(AnimalModelAdapter());
  Hive.registerAdapter(EventModelAdapter());
  Hive.registerAdapter(VacunacionModelAdapter());
  Hive.registerAdapter(TratamientoModelAdapter());
  Hive.registerAdapter(AlimentacionModelAdapter());
  Hive.registerAdapter(RolModelAdapter());
  Hive.registerAdapter(RecursoModelAdapter());
  Hive.registerAdapter(UsuarioRolModelAdapter());
  Hive.registerAdapter(RolRecursoModelAdapter());
  Hive.registerAdapter(ReproduccionModelAdapter());
  runApp(MiApp());
}

class MiApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Control Ganadero',
      theme: AppTheme.lightTheme,
      initialRoute: AppRoutes.splash,
      // Usamos onGenerateRoute para aplicar transiciones personalizadas
      onGenerateRoute: AppRoutes.onGenerateRoute,
      debugShowCheckedModeBanner: false,
    );
  }
}
