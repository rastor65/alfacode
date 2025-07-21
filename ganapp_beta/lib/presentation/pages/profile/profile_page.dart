import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../data/models/user_model.dart';
import '../../../data/datasources/user_local_datasource.dart';
import '../../../data/datasources/rol_local_datasource.dart';
import '../../../data/datasources/recurso_local_datasource.dart';
import '../../../data/datasources/usuario_rol_local_datasource.dart';
import '../../../data/datasources/rol_recurso_local_datasource.dart';
import '../../../data/repositories/user_repository.dart';
import '../../widgets/gradient_background.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../dialogs/success_dialog.dart';

class ProfilePage extends StatefulWidget {
  final String userCorreo;
  const ProfilePage({required this.userCorreo, super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  String? nombres;
  String? apellidos;
  String? identificacion;
  String? celular;
  String? comunidad;
  String? avatarUrl;
  File? _selectedImage;
  bool isLoading = true;
  UserModel? user;

  late UserRepository _userRepository;

  @override
  void initState() {
    super.initState();
    _userRepository = UserRepository(
      userLocalDataSource: UserLocalDataSource(),
      rolLocalDataSource: RolLocalDataSource(),
      recursoLocalDataSource: RecursoLocalDataSource(),
      usuarioRolLocalDataSource: UsuarioRolLocalDataSource(),
      rolRecursoLocalDataSource: RolRecursoLocalDataSource(),
    );
    _loadUser();
  }

  Future<void> _loadUser() async {
    user = await _userRepository.userLocalDataSource.getUserByCorreo(widget.userCorreo);
    setState(() {
      nombres = user?.nombres ?? '';
      apellidos = user?.apellidos ?? '';
      identificacion = user?.identificacion ?? '';
      celular = user?.celular ?? '';
      comunidad = user?.comunidad ?? '';
      avatarUrl = user?.avatarUrl;
      if (avatarUrl != null && !avatarUrl!.startsWith('http')) {
        _selectedImage = File(avatarUrl!);
      }
      isLoading = false;
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
        avatarUrl = pickedFile.path;
      });
    }
  }

  void _saveProfile() async {
    if (!_formKey.currentState!.validate() || user == null) return;
    setState(() => isLoading = true);

    user!
      ..nombres = nombres
      ..apellidos = apellidos
      ..identificacion = identificacion
      ..celular = celular
      ..comunidad = comunidad
      ..avatarUrl = avatarUrl;

    await _userRepository.updateUser(user!);

    setState(() => isLoading = false);
    await showSuccessDialog(context, title: '¡Éxito!', message: 'Perfil actualizado correctamente.');
    Navigator.pop(context, user);
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return Scaffold(body: Center(child: CircularProgressIndicator(color: AppColors.primary)));

    return Scaffold(
      appBar: AppBar(title: Text('Mi perfil')),
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
                      GestureDetector(
                        onTap: _pickImage,
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: AppColors.primary.withOpacity(0.1),
                          backgroundImage: _selectedImage != null
                              ? FileImage(_selectedImage!) as ImageProvider
                              : (avatarUrl != null && avatarUrl!.startsWith('http')
                                  ? NetworkImage(avatarUrl!)
                                  : const AssetImage('lib/assets/images/vaca.png')
                                ),
                          child: _selectedImage == null && (avatarUrl == null || avatarUrl!.isEmpty)
                              ? Icon(Icons.camera_alt_outlined, size: 40, color: AppColors.primary)
                              : null,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Editar mi perfil',
                        style: AppTextStyles.headline2.copyWith(color: AppColors.primaryDark),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      TextFormField(
                        initialValue: nombres,
                        decoration: InputDecoration(
                          labelText: 'Nombres',
                          prefixIcon: Icon(Icons.person_outline, color: AppColors.primary),
                        ),
                        onChanged: (val) => nombres = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese sus nombres' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: apellidos,
                        decoration: InputDecoration(
                          labelText: 'Apellidos',
                          prefixIcon: Icon(Icons.person_outline, color: AppColors.primary),
                        ),
                        onChanged: (val) => apellidos = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese sus apellidos' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: identificacion,
                        decoration: InputDecoration(
                          labelText: 'Identificación',
                          prefixIcon: Icon(Icons.credit_card, color: AppColors.primary),
                        ),
                        keyboardType: TextInputType.number,
                        onChanged: (val) => identificacion = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese su número de identificación' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: celular,
                        decoration: InputDecoration(
                          labelText: 'Celular',
                          prefixIcon: Icon(Icons.phone, color: AppColors.primary),
                        ),
                        keyboardType: TextInputType.phone,
                        onChanged: (val) => celular = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese su número de celular' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        initialValue: comunidad,
                        decoration: InputDecoration(
                          labelText: 'Comunidad',
                          prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.primary),
                        ),
                        onChanged: (val) => comunidad = val,
                        validator: (val) => val!.isEmpty ? 'Ingrese su comunidad' : null,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _saveProfile,
                        child: Text('Guardar cambios'),
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
