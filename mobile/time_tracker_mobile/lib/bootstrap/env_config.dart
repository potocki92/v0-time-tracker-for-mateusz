enum AppFlavor { dev, staging, prod }

class EnvConfig {
  const EnvConfig({required this.flavor, required this.appTitle, required this.apiBaseUrl});

  final AppFlavor flavor;
  final String appTitle;
  final String apiBaseUrl;
}
