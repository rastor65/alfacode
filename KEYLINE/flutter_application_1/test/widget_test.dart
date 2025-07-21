import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_application_1/main.dart';

void main() {
  testWidgets('Carga vista principal AnimalListView', (
    WidgetTester tester,
  ) async {
    // Construir la app
    await tester.pumpWidget(MyApp());

    // Verificar que se renderice el AppBar
    expect(find.byType(AppBar), findsOneWidget);

    // Verificar que se muestre el título
    expect(find.text('Listado de Animales'), findsOneWidget);
  });
}
