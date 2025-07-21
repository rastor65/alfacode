import 'package:flutter/material.dart';
import '../../../data/models/tratamiento_model.dart';
import '../../../data/datasources/tratamiento_local_datasource.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';

class TratamientoFormPage extends StatefulWidget {
  final int animalKey;
  final TratamientoModel? tratamiento;
  TratamientoFormPage({required this.animalKey, this.tratamiento});

  @override
  State<TratamientoFormPage> createState() => _TratamientoFormPageState();
}

class _TratamientoFormPageState extends State<TratamientoFormPage> {
  final _formKey = GlobalKey<FormState>();
  String tipoTratamiento = '';
  String medicamento = '';
  DateTime fechaAplicacion = DateTime.now();
  String observaciones = '';
  bool isEdit = false;

  final tiposTratamiento = [
    'Desparasitación', 'Vitaminización', 'Antibiótico', 'Otro'
  ];

  @override
  void initState() {
    super.initState();
    if (widget.tratamiento != null) {
      isEdit = true;
      tipoTratamiento = widget.tratamiento!.tipoTratamiento;
      medicamento = widget.tratamiento!.medicamento;
      fechaAplicacion = widget.tratamiento!.fechaAplicacion;
      observaciones = widget.tratamiento!.observaciones;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar tratamiento' : 'Registrar tratamiento')),
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
                        isEdit ? 'Modificar registro de tratamiento' : 'Nuevo registro de tratamiento',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      DropdownButtonFormField<String>(
                        value: tipoTratamiento.isNotEmpty ? tipoTratamiento : null,
                        items: tiposTratamiento
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) => setState(() => tipoTratamiento = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Tipo de tratamiento',
                          prefixIcon: Icon(Icons.medical_services, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione un tipo de tratamiento' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: medicamento,
                        decoration: InputDecoration(
                          labelText: 'Medicamento',
                          prefixIcon: Icon(Icons.medication, color: AppColors.primary),
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
                          final newTratamiento = TratamientoModel(
                            animalKey: widget.animalKey,
                            tipoTratamiento: tipoTratamiento,
                            medicamento: medicamento,
                            fechaAplicacion: fechaAplicacion,
                            observaciones: observaciones,
                          );
                          final dataSource = TratamientoLocalDataSource();
                          if (isEdit && widget.tratamiento != null) {
                            await dataSource.updateTratamiento(widget.tratamiento!.key as int, newTratamiento);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Tratamiento actualizado correctamente.');
                          } else {
                            await dataSource.addTratamiento(newTratamiento);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Tratamiento registrado correctamente.');
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
