import 'package:flutter/material.dart';
import '../../../data/datasources/user_local_datasource.dart';
import '../../../data/datasources/rol_local_datasource.dart';
import '../../../data/datasources/recurso_local_datasource.dart';
import '../../../data/datasources/usuario_rol_local_datasource.dart';
import '../../../data/datasources/rol_recurso_local_datasource.dart';
import '../../../data/repositories/user_repository.dart';
import '../../../core/utils/password_utils.dart';
import '../../../routes/app_routes.dart'; // Importa AppRoutes
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../widgets/gradient_background.dart';
import '../../widgets/auth_header.dart';
import '../../widgets/auth_form_container.dart';
import '../../widgets/custom_auth_text_field.dart';
import '../../widgets/auth_password_field.dart';
// import 'package:lottie/lottie.dart'; // Ya no es necesario si solo usas GIFs

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  String correo = '';
  String contrasena = '';
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
    _initializeData();
  }

  Future<void> _initializeData() async {
    await _userRepository.initializeRolesAndResources();
  }

  void _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => isLoading = true);

    final user = await _userRepository.login(correo, hashPassword(contrasena));

    setState(() => isLoading = false);

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Credenciales incorrectas o usuario inactivo'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // Navegación con ruta nombrada y argumentos
    Navigator.pushReplacementNamed(
      context,
      AppRoutes.home,
      arguments: {'user': user},
    );
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
                  mediaWidget: ClipRRect(
                    borderRadius: BorderRadius.circular(60),
                    child: Image.asset( // Cambiado de Lottie.asset a Image.asset
                      'assets/images/vaca-06.gif',
                      width: 120,
                      height: 120,
                      fit: BoxFit.cover,
                      // Los GIFs se repiten automáticamente si están configurados para ello en el archivo GIF.
                      // No se necesita una propiedad 'repeat' aquí como en Lottie.
                    ),
                  ),
                  title: 'Gestión Ganadera',
                  subtitle: 'El Manantial',
                  subtitleColor: AppColors.accent,
                ),
                const SizedBox(height: 40),
                AuthFormContainer(
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Iniciar Sesión',
                          style: AppTextStyles.headline2.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        CustomAuthTextField(
                          labelText: 'Correo electrónico',
                          prefixIcon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          onChanged: (val) => correo = val,
                          validator: (val) =>
                              val!.isEmpty ? 'Ingrese su correo electrónico' : (val.contains('@') ? null : 'Ingrese un correo válido'),
                        ),
                        const SizedBox(height: 16),
                        AuthPasswordField(
                          labelText: 'Contraseña',
                          onChanged: (val) => contrasena = val,
                          validator: (val) =>
                              val!.isEmpty ? 'Ingrese su contraseña' : null,
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
                                onPressed: _login,
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
                                  'Iniciar Sesión',
                                  style: AppTextStyles.buttonText,
                                ),
                              ),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, AppRoutes.register);
                          },
                          child: RichText(
                            text: TextSpan(
                              text: '¿No tienes cuenta? ',
                              style: AppTextStyles.bodyText2,
                              children: [
                                TextSpan(
                                  text: 'Regístrate',
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
