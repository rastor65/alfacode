import 'package:flutter/material.dart';
import '../presentation/pages/splash/splash_page.dart';
import '../presentation/pages/login/login_page.dart';
import '../presentation/pages/register/register_page.dart';
import '../presentation/pages/home/home_page.dart';
import '../presentation/pages/animals/animal_list_page.dart';
import '../presentation/pages/profile/profile_page.dart';
import '../presentation/pages/animals/animal_detail_page.dart';
import '../presentation/pages/animals/animal_form_page.dart';
import '../presentation/pages/alimentacion/alimentacion_list_page.dart';
import '../presentation/pages/alimentacion/alimentacion_form_page.dart';
import '../presentation/pages/events/event_list_page.dart';
import '../presentation/pages/events/event_form_page.dart';
import '../presentation/pages/tratamiento/tratamiento_list_page.dart';
import '../presentation/pages/tratamiento/tratamiento_form_page.dart';
import '../presentation/pages/vacunacion/vacunacion_list_page.dart';
import '../presentation/pages/vacunacion/vacunacion_form_page.dart';

// Nuevas importaciones para las listas generales
import '../presentation/pages/alimentacion/all_alimentacion_list_page.dart';
import '../presentation/pages/events/all_event_list_page.dart';
import '../presentation/pages/tratamiento/all_tratamiento_list_page.dart';
import '../presentation/pages/vacunacion/all_vacunacion_list_page.dart';

import '../presentation/pages/reproduccion/reproduccion_list_page.dart';
import '../presentation/pages/reproduccion/reproduccion_form_page.dart';
import '../presentation/pages/reproduccion/all_reproduccion_list_page.dart';


import '../core/utils/page_transitions.dart';

class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String home = '/home';
  static const String animalList = '/animals';
  static const String animalDetail = '/animal-detail';
  static const String animalForm = '/animal-form';
  static const String profile = '/profile';
  static const String alimentacionList = '/alimentacion';
  static const String alimentacionForm = '/alimentacion-form';
  static const String eventList = '/events';
  static const String eventForm = '/event-form';
  static const String tratamientoList = '/tratamientos';
  static const String tratamientoForm = '/tratamiento-form';
  static const String vacunacionList = '/vacunaciones';
  static const String vacunacionForm = '/vacunacion-form';

  // Nuevas rutas para las listas generales
  static const String allAlimentacionList = '/all-alimentacion';
  static const String allEventList = '/all-events';
  static const String allTratamientoList = '/all-tratamientos';
  static const String allVacunacionList = '/all-vacunaciones';

  static const String reproduccionList = '/reproducciones';
  static const String reproduccionForm = '/reproduccion-form';
  static const String allReproduccionList = '/all-reproducciones';


  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return slideTransitionPageRoute(SplashPage());
      case login:
        return slideTransitionPageRoute(LoginPage());
      case register:
        return slideTransitionPageRoute(RegisterPage());
      case home:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(HomePage(user: args['user']));
      case animalList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AnimalListPage(ownerUsername: args['ownerUsername']));
      case animalDetail:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AnimalDetailPage(animal: args['animal']));
      case animalForm:
        final args = settings.arguments as Map<String, dynamic>?;
        return slideTransitionPageRoute(AnimalFormPage(
          ownerUsername: args?['ownerUsername'] ?? '',
          animal: args?['animal'],
        ));
      case profile:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(ProfilePage(userCorreo: args['userCorreo']));
      case alimentacionList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AlimentacionListPage(animalKey: args['animalKey']));
      case alimentacionForm:
        final args = settings.arguments as Map<String, dynamic>?;
        return slideTransitionPageRoute(AlimentacionFormPage(
          animalKey: args?['animalKey'] ?? 0,
          alimentacion: args?['alimentacion'],
        ));
      case eventList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(EventListPage(animalKey: args['animalKey']));
      case eventForm:
        final args = settings.arguments as Map<String, dynamic>?;
        return slideTransitionPageRoute(EventFormPage(
          animalKey: args?['animalKey'] ?? 0,
          event: args?['event'],
        ));
      case tratamientoList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(TratamientoListPage(animalKey: args['animalKey']));
      case tratamientoForm:
        final args = settings.arguments as Map<String, dynamic>?;
        return slideTransitionPageRoute(TratamientoFormPage(
          animalKey: args?['animalKey'] ?? 0,
          tratamiento: args?['tratamiento'],
        ));
      case vacunacionList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(VacunacionListPage(animalKey: args['animalKey']));
      case vacunacionForm:
        final args = settings.arguments as Map<String, dynamic>?;
        return slideTransitionPageRoute(VacunacionFormPage(
          animalKey: args?['animalKey'] ?? 0,
          vacunacion: args?['vacunacion'],
        ));
      
      // Nuevas rutas para las listas generales, ahora esperando ownerUsername
      case allAlimentacionList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AllAlimentacionListPage(ownerUsername: args['ownerUsername']));
      case allEventList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AllEventListPage(ownerUsername: args['ownerUsername']));
      case allTratamientoList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AllTratamientoListPage(ownerUsername: args['ownerUsername']));
      case allVacunacionList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AllVacunacionListPage(ownerUsername: args['ownerUsername']));

      case reproduccionList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(ReproduccionListPage(animalKey: args['animalKey']));
      case reproduccionForm:
        final args = settings.arguments as Map<String, dynamic>?;
        return slideTransitionPageRoute(ReproduccionFormPage(
          animalId: args?['animalId'] ?? 0,
          reproduccion: args?['reproduccion'],
        ));
      case allReproduccionList:
        final args = settings.arguments as Map<String, dynamic>;
        return slideTransitionPageRoute(AllReproduccionListPage(ownerUsername: args['ownerUsername']));

      default:
        return MaterialPageRoute(builder: (context) => Text('Error: Ruta desconocida ${settings.name}'));
    }
  }
}
