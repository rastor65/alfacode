import 'package:flutter/material.dart';
import 'dart:io';
import '../../../data/models/user_model.dart';
import '../../../data/datasources/animal_local_datasource.dart'; // Agregado para limpieza
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/confirmation_dialog.dart';

class HomePage extends StatefulWidget {
  final UserModel user;
  const HomePage({required this.user, super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late UserModel _currentUser;
  final AnimalLocalDataSource _animalDataSource = AnimalLocalDataSource();

  @override
  void initState() {
    super.initState();
    _currentUser = widget.user;
    _checkDataIntegrity();
  }

  // Verificar integridad de datos al iniciar
  Future<void> _checkDataIntegrity() async {
    try {
      final isValid = await _animalDataSource.verifyDataIntegrity();
      if (!isValid) {
        print('Se detectaron datos corruptos, limpiando automáticamente...');
        await _animalDataSource.forceCleanDatabase();
      }
    } catch (e) {
      print('Error al verificar integridad de datos: $e');
    }
  }

  Widget _buildActionButton(BuildContext context, {required IconData icon, required String label, required VoidCallback onTap}) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 48, color: AppColors.primary),
              const SizedBox(height: 10),
              Text(
                label,
                style: AppTextStyles.subtitle1.copyWith(color: AppColors.textDark),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inicio'),
        actions: [
          // Botón de limpieza para debugging (opcional)
          if (true) // Cambiar a false en producción
            IconButton(
              icon: const Icon(Icons.cleaning_services),
              onPressed: () async {
                final confirmed = await showConfirmationDialog(
                  context,
                  title: 'Limpiar Datos Corruptos',
                  content: '¿Quieres limpiar los datos corruptos de la base de datos?',
                  confirmText: 'Limpiar',
                  confirmColor: AppColors.accent,
                );
                if (confirmed == true) {
                  await _animalDataSource.forceCleanDatabase();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Datos limpiados correctamente'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              },
              tooltip: 'Limpiar datos corruptos',
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final confirmed = await showConfirmationDialog(
                context,
                title: 'Cerrar Sesión',
                content: '¿Estás seguro de que quieres cerrar sesión?',
                confirmText: 'Sí, cerrar',
                cancelText: 'No',
                confirmColor: AppColors.error,
              );
              if (confirmed == true) {
                Navigator.pushReplacementNamed(context, AppRoutes.login);
              }
            },
            tooltip: 'Cerrar sesión',
          ),
        ],
      ),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundImage: _currentUser.avatarUrl != null && _currentUser.avatarUrl!.isNotEmpty
                            ? (_currentUser.avatarUrl!.startsWith('http')
                                ? NetworkImage(_currentUser.avatarUrl!)
                                : Image.file(
                                    File(_currentUser.avatarUrl!),
                                    errorBuilder: (context, error, stackTrace) => Image.asset('lib/assets/images/vaca.png'),
                                  ).image
                              )
                            : const AssetImage('lib/assets/images/vaca.png'),
                        backgroundColor: AppColors.lightGrey,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '¡Hola, ${_currentUser.nombres?.split(' ').first ?? _currentUser.correo.split('@').first}!',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Bienvenido a tu panel de control ganadero.',
                        style: AppTextStyles.bodyText1.copyWith(color: AppColors.grey),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Resumen Rápido',
                        style: AppTextStyles.subtitle1.copyWith(color: AppColors.textDark),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Aquí podrás ver estadísticas clave y alertas futuras de tus animales.',
                        style: AppTextStyles.bodyText2.copyWith(color: AppColors.grey),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 20,
                mainAxisSpacing: 20,
                children: [
                  _buildActionButton(
                    context,
                    icon: Icons.pets,
                    label: 'Mis Animales',
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.animalList,
                        arguments: {'ownerUsername': _currentUser.correo},
                      );
                    },
                  ),
                  _buildActionButton(
                    context,
                    icon: Icons.person,
                    label: 'Mi Perfil',
                    onTap: () async {
                      final updatedUser = await Navigator.pushNamed(
                        context,
                        AppRoutes.profile,
                        arguments: {'userCorreo': _currentUser.correo},
                      );
                      if (updatedUser != null && updatedUser is UserModel) {
                        setState(() {
                          _currentUser = updatedUser;
                        });
                      }
                    },
                  ),
                  _buildActionButton(
                    context,
                    icon: Icons.restaurant,
                    label: 'Alimentación General',
                    onTap: () {
                      Navigator.pushNamed(context, AppRoutes.allAlimentacionList, arguments: {'ownerUsername': _currentUser.correo});
                    },
                  ),
                  _buildActionButton(
                    context,
                    icon: Icons.event,
                    label: 'Eventos Generales',
                    onTap: () {
                      Navigator.pushNamed(context, AppRoutes.allEventList, arguments: {'ownerUsername': _currentUser.correo});
                    },
                  ),
                  _buildActionButton(
                    context,
                    icon: Icons.healing,
                    label: 'Tratamientos Generales',
                    onTap: () {
                      Navigator.pushNamed(context, AppRoutes.allTratamientoList, arguments: {'ownerUsername': _currentUser.correo});
                    },
                  ),
                  _buildActionButton(
                    context,
                    icon: Icons.vaccines,
                    label: 'Vacunaciones Generales',
                    onTap: () {
                      Navigator.pushNamed(context, AppRoutes.allVacunacionList, arguments: {'ownerUsername': _currentUser.correo});
                    },
                  ),
                  _buildActionButton(
                    context,
                    icon: Icons.baby_changing_station,
                    label: 'Reproducciones Generales',
                    onTap: () {
                      Navigator.pushNamed(context, AppRoutes.allReproduccionList, arguments: {'ownerUsername': _currentUser.correo});
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
