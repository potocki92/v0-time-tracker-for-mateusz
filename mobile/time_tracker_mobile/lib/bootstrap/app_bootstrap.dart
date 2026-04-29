import 'package:flutter/widgets.dart';

Future<void> bootstrap(Future<Widget> Function() builder) async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(await builder());
}
