import 'package:flutter/material.dart';
import '../../../data/models/vacunacion_model.dart';
import '../../../data/datasources/vacunacion_local_datasource.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';

class VacunacionFormPage extends StatefulWidget {
  final int animalKey;
  final VacunacionModel? vacunacion;
  VacunacionFormPage({required this.animalKey, this.vacunacion});

  @override
  State<VacunacionFormPage> createState() => _VacunacionFormPageState();
}

class _VacunacionFormPageState extends State<VacunacionFormPage> {
  final _formKey = GlobalKey<FormState>();
  String nombreVacuna = '';
  String medicamento = '';
  DateTime fechaAplicacion = DateTime.now();
  String observaciones = '';
  bool isEdit = false;

  @override
  void initState() {
    super.initState();
    if (widget.vacunacion != null) {
      isEdit = true;
      nombreVacuna = widget.vacunacion!.nombreVacuna;
      medicamento = widget.vacunacion!.medicamento;
      fechaAplicacion = widget.vacunacion!.fechaAplicacion;
      observaciones = widget.vacunacion!.observaciones;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar vacuna' : 'Registrar vacuna')),
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        isEdit ? 'Modificar registro de vacuna' : 'Nuevo registro de vacuna',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        initialValue: nombreVacuna,
                        decoration: InputDecoration(
                          labelText: 'Nombre de la vacuna',
                          prefixIcon: Icon(Icons.vaccines, color: AppColors.primary),
                        ),
                        onChanged: (val) => nombreVacuna = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese el nombre de la vacuna' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: medicamento,
                        decoration: InputDecoration(
                          labelText: 'Medicamento',
                          prefixIcon: Icon(Icons.medical_information, color: AppColors.primary),
                        ),
                        onChanged: (val) => medicamento = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese el medicamento' : null,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: Text(
                          'Fecha: ${fechaAplicacion.toLocal().toString().split(' ')[0]}',
                          style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
                        ),
                        trailing: Icon(Icons.calendar_today, color: AppColors.primary),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: fechaAplicacion,
                            firstDate: DateTime(2000),
                            lastDate: DateTime.now(),
                            builder: (context, child) {
                              return Theme(
                                data: Theme.of(context).copyWith(
                                  colorScheme: ColorScheme.light(
                                    primary: AppColors.primary,
                                    onPrimary: AppColors.textLight,
                                    onSurface: AppColors.textDark,
                                  ),
                                  textButtonTheme: TextButtonThemeData(
                                    style: TextButton.styleFrom(
                                      foregroundColor: AppColors.primaryDark,
                                    ),
                                  ),
                                ),
                                child: child!,
                              );
                            },
                          );
                          if (picked != null) setState(() => fechaAplicacion = picked);
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: observaciones,
                        decoration: InputDecoration(
                          labelText: 'Observaciones',
                          prefixIcon: Icon(Icons.notes, color: AppColors.primary),
                        ),
                        onChanged: (val) => observaciones = val,
                        maxLines: 3,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () async {
                          if (!_formKey.currentState!.validate()) return;
                          final newVacunacion = VacunacionModel(
                            animalKey: widget.animalKey,
                            nombreVacuna: nombreVacuna,
                            medicamento: medicamento,
                            fechaAplicacion: fechaAplicacion,
                            observaciones: observaciones,
                          );
                          final dataSource = VacunacionLocalDataSource();
                          if (isEdit && widget.vacunacion != null) {
                            await dataSource.updateVacunacion(widget.vacunacion!.key as int, newVacunacion);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Vacuna actualizada correctamente.');
                          } else {
                            await dataSource.addVacunacion(newVacunacion);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Vacuna registrada correctamente.');
                          }
                          Navigator.pop(context, true);
                        },
                        child: Text(isEdit ? 'Guardar cambios' : 'Registrar'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
