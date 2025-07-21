import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  final String usuario;

  const HomePage({required this.usuario});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Inicio')),
      body: Center(child: Text('¡Bienvenido, $usuario!')),
    );
  }
}
