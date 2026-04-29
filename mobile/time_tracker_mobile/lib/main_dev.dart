import 'app.dart';
import 'bootstrap/app_bootstrap.dart';
import 'bootstrap/env_config.dart';

Future<void> main() async {
  await bootstrap(
    () async => const TimeTrackerApp(
      config: EnvConfig(
        flavor: AppFlavor.dev,
        appTitle: 'Time Tracker DEV',
        apiBaseUrl: 'https://dev.api.example.com',
      ),
    ),
  );
}
