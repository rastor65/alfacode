import 'package:flutter/material.dart';
import '../../../data/models/alimentacion_model.dart';
import '../../../data/datasources/alimentacion_local_datasource.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';

class AlimentacionFormPage extends StatefulWidget {
  final int animalKey;
  final AlimentacionModel? alimentacion;
  AlimentacionFormPage({required this.animalKey, this.alimentacion});

  @override
  State<AlimentacionFormPage> createState() => _AlimentacionFormPageState();
}

class _AlimentacionFormPageState extends State<AlimentacionFormPage> {
  final _formKey = GlobalKey<FormState>();
  String tipoAlimento = '';
  double cantidad = 0.0;
  DateTime fecha = DateTime.now();
  String observaciones = '';
  bool isEdit = false;

  final tiposAlimento = [
    'Concentrado', 'Pasto', 'Suplemento', 'Otro'
  ];

  @override
  void initState() {
    super.initState();
    if (widget.alimentacion != null) {
      isEdit = true;
      tipoAlimento = widget.alimentacion!.tipoAlimento;
      cantidad = widget.alimentacion!.cantidad;
      fecha = widget.alimentacion!.fecha;
      observaciones = widget.alimentacion!.observaciones;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar alimentación' : 'Registrar alimentación')),
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
                        isEdit ? 'Modificar registro de alimentación' : 'Nuevo registro de alimentación',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      DropdownButtonFormField<String>(
                        value: tipoAlimento.isNotEmpty ? tipoAlimento : null,
                        items: tiposAlimento
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) => setState(() => tipoAlimento = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Tipo de alimento',
                          prefixIcon: Icon(Icons.fastfood, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione un tipo de alimento' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: cantidad == 0.0 ? '' : cantidad.toString(),
                        decoration: InputDecoration(
                          labelText: 'Cantidad (kg)',
                          prefixIcon: Icon(Icons.scale, color: AppColors.primary),
                        ),
                        keyboardType: TextInputType.numberWithOptions(decimal: true),
                        onChanged: (val) =>
                            cantidad = double.tryParse(val) ?? 0.0,
                        validator: (val) => (val == null || double.tryParse(val) == null)
                            ? 'Ingrese la cantidad'
                            : null,
                      ),
                      const SizedBox(height: 16),
                      ListTile(
                        title: Text(
                          'Fecha: ${fecha.toLocal().toString().split(' ')[0]}',
                          style: AppTextStyles.bodyText1.copyWith(color: AppColors.textDark),
                        ),
                        trailing: Icon(Icons.calendar_today, color: AppColors.primary),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: fecha,
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
                          if (picked != null) setState(() => fecha = picked);
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
                          final newAlimentacion = AlimentacionModel(
                            animalKey: widget.animalKey,
                            tipoAlimento: tipoAlimento,
                            cantidad: cantidad,
                            fecha: fecha,
                            observaciones: observaciones,
                          );
                          final dataSource = AlimentacionLocalDataSource();
                          if (isEdit && widget.alimentacion != null) {
                            await dataSource.updateAlimentacion(widget.alimentacion!.key as int, newAlimentacion);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Alimentación actualizada correctamente.');
                          } else {
                            await dataSource.addAlimentacion(newAlimentacion);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Alimentación registrada correctamente.');
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
