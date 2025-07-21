import 'dart:io';
import 'package:flutter/material.dart';
import '../../../data/models/animal_model.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../data/datasources/animal_local_datasource.dart'; // Asegúrate de que esta importación esté

class AnimalDetailPage extends StatelessWidget {
  final AnimalModel animal;

  const AnimalDetailPage({required this.animal, super.key});

  Widget _buildDetailActionButton(BuildContext context, {required IconData icon, required String label, required VoidCallback onTap}) {
    return ElevatedButton.icon(
      icon: Icon(icon),
      label: Text(label),
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        minimumSize: Size(double.infinity, 50),
        padding: const EdgeInsets.symmetric(vertical: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildInfoRow({required String label, required String value, IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.bold, color: AppColors.textDark),
                  ),
                  TextSpan(
                    text: value,
                    style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${animal.name}'),
      ),
      body: GradientBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Card(
            elevation: 4,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    backgroundImage: animal.animalImagen != null && animal.animalImagen!.isNotEmpty
                        ? FileImage(File(animal.animalImagen!)) as ImageProvider
                        : null,
                    child: animal.animalImagen == null || animal.animalImagen!.isEmpty
                        ? Icon(Icons.pets, size: 60, color: AppColors.primary)
                        : null,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '${animal.name} (${animal.tipo})',
                    style: AppTextStyles.headline1.copyWith(color: AppColors.primaryDark),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Especie: ${animal.especie}',
                    style: AppTextStyles.subtitle1.copyWith(color: AppColors.grey),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 30),
                  Divider(color: AppColors.lightGrey),
                  const SizedBox(height: 20),
                  _buildInfoRow(label: 'Raza', value: animal.raza, icon: Icons.pets_outlined),
                  _buildInfoRow(label: 'Sexo', value: animal.sexo, icon: Icons.group),
                  _buildInfoRow(label: 'Estado de Salud', value: animal.estadoSalud, icon: Icons.health_and_safety),
                  _buildInfoRow(label: 'Fecha de Nacimiento', value: animal.fechaNacimiento.toLocal().toString().split(' ')[0], icon: Icons.calendar_today),
                  _buildInfoRow(label: 'Estado Reproductivo', value: animal.estadoReproductivo, icon: Icons.pregnant_woman),
                  FutureBuilder<AnimalModel?>(
                    future: animal.animalPadreKey != null ? AnimalLocalDataSource().getAnimalByKey(animal.animalPadreKey!) : Future.value(null),
                    builder: (context, snapshot) {
                      final padreName = snapshot.data?.name ?? 'N/A';
                      return _buildInfoRow(label: 'Padre', value: padreName, icon: Icons.male);
                    },
                  ),
                  FutureBuilder<AnimalModel?>(
                    future: animal.animalMadreKey != null ? AnimalLocalDataSource().getAnimalByKey(animal.animalMadreKey!) : Future.value(null),
                    builder: (context, snapshot) {
                      final madreName = snapshot.data?.name ?? 'N/A';
                      return _buildInfoRow(label: 'Madre', value: madreName, icon: Icons.female);
                    },
                  ),
                  const SizedBox(height: 30), // Add spacing before action buttons
                  Divider(color: AppColors.lightGrey),
                  const SizedBox(height: 20),
                  _buildDetailActionButton(
                    context,
                    icon: Icons.baby_changing_station,
                    label: 'Ver Reproducciones',
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.reproduccionList,
                        arguments: {'animalKey': animal.key as int},
                      );
                    },
                  ),
                  const SizedBox(height: 15),
                  _buildDetailActionButton(
                    context,
                    icon: Icons.event,
                    label: 'Ver eventos',
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.eventList,
                        arguments: {'animalKey': animal.key as int},
                      );
                    },
                  ),
                  const SizedBox(height: 15),
                  _buildDetailActionButton(
                    context,
                    icon: Icons.vaccines,
                    label: 'Ver vacunas',
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.vacunacionList,
                        arguments: {'animalKey': animal.key as int},
                      );
                    },
                  ),
                  const SizedBox(height: 15),
                  _buildDetailActionButton(
                    context,
                    icon: Icons.healing,
                    label: 'Ver tratamientos',
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.tratamientoList,
                        arguments: {'animalKey': animal.key as int},
                      );
                    },
                  ),
                  const SizedBox(height: 15),
                  _buildDetailActionButton(
                    context,
                    icon: Icons.restaurant,
                    label: 'Ver alimentación',
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        AppRoutes.alimentacionList,
                        arguments: {'animalKey': animal.key as int},
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
