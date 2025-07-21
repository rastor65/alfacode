import 'package:flutter/material.dart';
import '../../../data/models/event_model.dart';
import '../../../data/datasources/event_local_datasource.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';

class EventFormPage extends StatefulWidget {
  final int animalKey;
  final EventModel? event;
  EventFormPage({required this.animalKey, this.event});

  @override
  State<EventFormPage> createState() => _EventFormPageState();
}

class _EventFormPageState extends State<EventFormPage> {
  final _formKey = GlobalKey<FormState>();
  String tipo = '';
  String descripcion = '';
  DateTime fecha = DateTime.now();
  bool isEdit = false;

  final tiposEvento = [
    'Nacimiento', 'Muerte', 'Venta', 'Compra', 'Pérdida', 'Otro'
  ];

  @override
  void initState() {
    super.initState();
    if (widget.event != null) {
      isEdit = true;
      tipo = widget.event!.tipo;
      descripcion = widget.event!.descripcion;
      fecha = widget.event!.fecha;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Editar evento' : 'Registrar evento')),
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
                        isEdit ? 'Modificar evento' : 'Nuevo evento',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      DropdownButtonFormField<String>(
                        value: tipo.isNotEmpty ? tipo : null,
                        items: tiposEvento
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (val) => setState(() => tipo = val ?? ''),
                        decoration: InputDecoration(
                          labelText: 'Tipo de evento',
                          prefixIcon: Icon(Icons.category, color: AppColors.primary),
                        ),
                        validator: (val) => val == null || val.isEmpty ? 'Seleccione un tipo de evento' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: descripcion,
                        decoration: InputDecoration(
                          labelText: 'Descripción',
                          prefixIcon: Icon(Icons.description, color: AppColors.primary),
                        ),
                        onChanged: (val) => descripcion = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese descripción' : null,
                        maxLines: 3,
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
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () async {
                          if (!_formKey.currentState!.validate()) return;
                          final newEvent = EventModel(
                            animalKey: widget.animalKey,
                            tipo: tipo,
                            descripcion: descripcion,
                            fecha: fecha,
                          );
                          final dataSource = EventLocalDataSource();
                          if (isEdit && widget.event != null) {
                            await dataSource.updateEvent(widget.event!.key as int, newEvent);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Evento actualizado correctamente.');
                          } else {
                            await dataSource.addEvent(newEvent);
                            await showSuccessDialog(context, title: '¡Éxito!', message: 'Evento registrado correctamente.');
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
