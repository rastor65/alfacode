import 'package:flutter/material.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/gradient_background.dart'; // Importa el nuevo widget
import '../../../core/constants/app_colors.dart'; // Para colores
import '../../../core/constants/app_text_styles.dart'; // Para estilos de texto
import 'package:lottie/lottie.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  _SplashPageState createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<Offset>
  _slideAnimation; // Nuevo: para el deslizamiento del texto

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(
        seconds: 2,
      ), // Duración total para la animación del logo y texto inicial
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.elasticOut, // Efecto más elástico/rebotante
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(
          0.0,
          0.7,
          curve: Curves.easeIn,
        ), // Desvanecimiento más rápido
      ),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
          // Desliza hacia arriba desde abajo
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(
              0.3,
              1.0,
              curve: Curves.easeOutCubic,
            ), // Empieza a deslizarse después de que el logo inicia
          ),
        );

    _controller.forward(); // Inicia la animación

    _navigate();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _navigate() async {
    // Espera un total de 3 segundos (2s de animación + 1s adicional para el indicador de carga)
    await Future.delayed(const Duration(seconds: 3));

    bool usuarioLogueado =
        false; // Mantén esto en 'false' para ir al login por ahora
    if (usuarioLogueado) {
      // Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else {
      Navigator.pushReplacementNamed(context, AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        // Usa el widget de fondo con gradiente personalizado
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo animado
              FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Lottie.asset(
                    'assets/animations/loading.json',
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                    repeat: true, // Para que se repita la animación
                    animate: true, // Para que inicie automáticamente
                  ),
                ),
              ),
              const SizedBox(height: 30), // Espaciado aumentado
              // Texto animado
              SlideTransition(
                position: _slideAnimation,
                child: FadeTransition(
                  opacity:
                      _fadeAnimation, // Reutiliza el desvanecimiento para el texto
                  child: Column(
                    children: [
                      Text(
                        'Gestión Ganadera El Manantial',
                        style: AppTextStyles.headline1.copyWith(
                          color: AppColors
                              .primaryDark, // Usa un primario más oscuro para contraste
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Tu aliado en el campo', // Nueva frase de enganche
                        style: AppTextStyles.subtitle1.copyWith(
                          color: AppColors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40), // Espaciado aumentado
              // Indicador de carga
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.primary,
                ), // Asegura que use el color primario
              ),
            ],
          ),
        ),
      ),
    );
  }
}
