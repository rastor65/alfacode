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
import '../../../core/utils/password_utils.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import 'package:hive/hive.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../widgets/gradient_background.dart';
import '../../widgets/auth_header.dart';
import '../../widgets/auth_form_container.dart';
import '../../widgets/custom_auth_text_field.dart';
import '../../widgets/auth_password_field.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  String correo = '';
  String contrasena = '';
  String confirmarContrasena = '';
  String nombres = '';
  String apellidos = '';
  String identificacion = '';
  String celular = '';
  String comunidad = '';
  File? _selectedImage;

  bool isLoading = false;

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
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  void _registerUser() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => isLoading = true);

    final existing = await _userRepository.userLocalDataSource.getUserByCorreo(correo);
    if (existing != null) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('El correo ya está registrado'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final usersBox = await Hive.openBox<UserModel>('users');
    final int newId = usersBox.isEmpty ? 1 : (usersBox.keys.cast<int>().reduce((a, b) => a > b ? a : b) + 1);

    final hash = hashPassword(contrasena);

    final user = UserModel(
      id: newId,
      correo: correo,
      passwordHash: hash,
      nombres: nombres,
      apellidos: apellidos,
      identificacion: identificacion,
      celular: celular,
      comunidad: comunidad,
      avatarUrl: _selectedImage?.path,
      estado: 1,
    );

    await _userRepository.register(user);

    final propietarioRol = await _userRepository.rolLocalDataSource.getRolById(2);
    if (propietarioRol != null) {
      await _userRepository.assignRoleToUser(user.id, propietarioRol.id);
    } else {
      print('Advertencia: El rol "propietario" no se encontró para asignar al nuevo usuario.');
    }

    setState(() => isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('¡Cuenta creada exitosamente!'),
        backgroundColor: AppColors.success,
      ),
    );

    // Navegación con ruta nombrada
    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AuthHeader(
                  mediaWidget: GestureDetector(
                    onTap: _pickImage,
                    child: CircleAvatar(
                      radius: 60,
                      backgroundColor: AppColors.primary.withOpacity(0.1),
                      backgroundImage: _selectedImage != null
                          ? FileImage(_selectedImage!) as ImageProvider
                          : null,
                      child: _selectedImage == null
                          ? Icon(
                              Icons.camera_alt_outlined,
                              size: 40,
                              color: AppColors.primary,
                            )
                          : null,
                    ),
                  ),
                  title: 'Crear Cuenta',
                  subtitle: 'Únete a Gestión Ganadera El Manantial',
                  subtitleColor: AppColors.grey,
                ),
                const SizedBox(height: 30),
                AuthFormContainer(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        CustomAuthTextField(
                          labelText: 'Correo electrónico',
                          hintText: 'Ej: tu@ejemplo.com',
                          prefixIcon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          onChanged: (val) => correo = val,
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return 'Ingrese su correo electrónico';
                            }
                            if (!val.contains('@')) {
                              return 'Ingrese un correo válido';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        CustomAuthTextField(
                          labelText: 'Nombres',
                          prefixIcon: Icons.person_outline,
                          onChanged: (val) => nombres = val,
                          validator: (val) => val!.isEmpty ? 'Ingrese sus nombres' : null,
                        ),
                        const SizedBox(height: 16),
                        CustomAuthTextField(
                          labelText: 'Apellidos',
                          prefixIcon: Icons.person_outline,
                          onChanged: (val) => apellidos = val,
                          validator: (val) => val!.isEmpty ? 'Ingrese sus apellidos' : null,
                        ),
                        const SizedBox(height: 16),
                        CustomAuthTextField(
                          labelText: 'Identificación',
                          prefixIcon: Icons.credit_card,
                          keyboardType: TextInputType.number,
                          onChanged: (val) => identificacion = val,
                          validator: (val) => val!.isEmpty ? 'Ingrese su número de identificación' : null,
                        ),
                        const SizedBox(height: 16),
                        CustomAuthTextField(
                          labelText: 'Celular',
                          prefixIcon: Icons.phone,
                          keyboardType: TextInputType.phone,
                          onChanged: (val) => celular = val,
                          validator: (val) => val!.isEmpty ? 'Ingrese su número de celular' : null,
                        ),
                        const SizedBox(height: 16),
                        CustomAuthTextField(
                          labelText: 'Comunidad',
                          prefixIcon: Icons.location_on_outlined,
                          onChanged: (val) => comunidad = val,
                          validator: (val) => val!.isEmpty ? 'Ingrese su comunidad' : null,
                        ),
                        const SizedBox(height: 16),
                        AuthPasswordField(
                          labelText: 'Contraseña',
                          hintText: 'Mínimo 6 caracteres',
                          onChanged: (val) => contrasena = val,
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return 'Ingrese una contraseña';
                            }
                            if (val.length < 6) {
                              return 'La contraseña debe tener al menos 6 caracteres';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        AuthPasswordField(
                          labelText: 'Confirmar contraseña',
                          hintText: 'Repita su contraseña',
                          onChanged: (val) => confirmarContrasena = val,
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return 'Confirme su contraseña';
                            }
                            if (val != contrasena) {
                              return 'Las contraseñas no coinciden';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        isLoading
                            ? SizedBox(
                                height: 50,
                                child: Center(
                                  child: CircularProgressIndicator(
                                    color: AppColors.primary,
                                  ),
                                ),
                              )
                            : ElevatedButton(
                                onPressed: _registerUser,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryDark,
                                  foregroundColor: AppColors.textLight,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 2,
                                ),
                                child: Text(
                                  'Crear Cuenta',
                                  style: AppTextStyles.buttonText,
                                ),
                              ),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: RichText(
                            text: TextSpan(
                              text: '¿Ya tienes cuenta? ',
                              style: AppTextStyles.bodyText2,
                              children: [
                                TextSpan(
                                  text: 'Inicia sesión',
                                  style: AppTextStyles.linkText.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.none,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
