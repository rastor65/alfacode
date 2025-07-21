import 'package:flutter/material.dart';

/// Returns a PageRouteBuilder with a slide transition animation.
/// The new page slides in from the right.
PageRouteBuilder slideTransitionPageRoute(Widget page) {
  return PageRouteBuilder(
    pageBuilder: (context, animation, secondaryAnimation) => page,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      const begin = Offset(1.0, 0.0); // Start from right
      const end = Offset.zero; // End at original position
      const curve = Curves.easeOut; // Smooth deceleration

      var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));

      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );
    },
    transitionDuration: const Duration(milliseconds: 300), // Duration of the animation
  );
}
