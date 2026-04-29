import 'app.dart';
import 'bootstrap/app_bootstrap.dart';
import 'bootstrap/env_config.dart';

Future<void> main() async {
  await bootstrap(
    () async => const TimeTrackerApp(
      config: EnvConfig(
        flavor: AppFlavor.staging,
        appTitle: 'Time Tracker STAGING',
        apiBaseUrl: 'https://staging.api.example.com',
      ),
    ),
  );
}
