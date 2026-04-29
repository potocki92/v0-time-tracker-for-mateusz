# Plan wydzielenia modułu Flutter + wdrożenia iOS

## 1) Analiza obecnej struktury repozytorium i strategia wydzielenia

Repozytorium jest aplikacją webową (Next.js/TypeScript) z wyraźnymi domenami biznesowymi (`features/*`, `lib/finance/*`, `services/*`).
Najbezpieczniejsza strategia migracji do Flutter i iOS to:

1. **Wydzielenie domeny biznesowej najpierw** (np. faktury/finanse) do czystej warstwy domenowej w Dart.
2. **Oddzielenie źródeł danych** (API, storage, auth) od logiki domenowej.
3. **Dopiero potem podpięcie UI Fluttera**.

Dzięki temu unikasz przepisywania wszystkiego naraz i możesz uruchomić testy jednostkowe już na etapie migracji logiki.

---

## 2) Proponowana struktura nowego folderu aplikacji (Clean Architecture)

Zakładamy nowy katalog: `mobile/time_tracker_mobile`.

```txt
mobile/
  time_tracker_mobile/
    analysis_options.yaml
    pubspec.yaml
    lib/
      bootstrap/
        app_bootstrap.dart
        env_config.dart
      core/
        error/
          failures.dart
        network/
          dio_client.dart
          connectivity_service.dart
        utils/
          date_utils.dart
          money_formatter.dart
        di/
          service_locator.dart
      features/
        invoices/
          domain/
            entities/
              invoice.dart
              invoice_item.dart
            repositories/
              invoice_repository.dart
            usecases/
              create_invoice.dart
              list_invoices.dart
              calculate_totals.dart
          data/
            datasources/
              invoice_remote_data_source.dart
              invoice_local_data_source.dart
            models/
              invoice_model.dart
            repositories/
              invoice_repository_impl.dart
          presentation/
            cubit/
              invoice_cubit.dart
              invoice_state.dart
            pages/
              invoices_page.dart
              invoice_form_page.dart
            widgets/
              invoice_card.dart
        projects/
          domain/...
          data/...
          presentation/...
      l10n/
        app_pl.arb
        app_en.arb
      app.dart
      main_dev.dart
      main_staging.dart
      main_prod.dart
    test/
      unit/
      widget/
      integration/
    ios/
      Runner/
        Info.plist
      Podfile
      Runner.xcodeproj/
      Runner.xcworkspace/
```

### Zasady warstw
- `domain`: zero zależności od Flutter/UI i frameworków IO.
- `data`: implementacje repozytoriów, mapowanie modeli, API/local DB.
- `presentation`: Flutter widgets + state management (np. Bloc/Cubit lub Riverpod).
- `core`: współdzielone komponenty techniczne (networking, błędy, DI, utility).

---

## 3) Instrukcja migracji kodu z głównego repo do nowego folderu

## Krok A — utworzenie projektu Flutter

```bash
mkdir -p mobile
cd mobile
flutter create --org com.yourcompany time_tracker_mobile
cd time_tracker_mobile
```

## Krok B — mapowanie domen z TypeScript do Dart

Przykładowa mapa:
- `lib/finance/*` (TS) -> `lib/features/invoices/domain/usecases/*` + `domain/entities/*` (Dart)
- `services/invoices.ts` -> `data/datasources/*` + `data/repositories/*`
- `features/invoices/*` (UI web) -> `presentation/pages/*`, `presentation/widgets/*`

## Krok C — migracja zależności (`pubspec.yaml`)

Bazowy zestaw produkcyjny:

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  dio: ^5.7.0
  freezed_annotation: ^2.4.4
  json_annotation: ^4.9.0
  flutter_bloc: ^8.1.6
  get_it: ^8.0.2
  injectable: ^2.5.0
  equatable: ^2.0.5
  intl: ^0.20.2
  shared_preferences: ^2.3.2
  flutter_secure_storage: ^9.2.2
  permission_handler: ^11.3.1
  app_tracking_transparency: ^2.0.5

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.13
  freezed: ^2.5.7
  json_serializable: ^6.8.0
  injectable_generator: ^2.6.2
  flutter_lints: ^5.0.0
```

Następnie:

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

## Krok D — kolejność przenoszenia kodu
1. Encje i typy domenowe (`invoice`, `money`, `status`).
2. Czyste use case’y (kalkulacje, walidacja, statusy).
3. Repozytoria interfejsowe (`domain/repositories`).
4. Implementacje `data` (API/Supabase/REST).
5. Stan + UI (`presentation`).
6. Testy jednostkowe na każdym etapie.

---

## 4) Konfiguracja iOS (CocoaPods, Xcode, Info.plist, certyfikaty)

## CocoaPods / Podfile
W `ios/Podfile`:

```ruby
platform :ios, '13.0'

ENV['COCOAPODS_DISABLE_STATS'] = 'true'

project 'Runner', {
  'Debug' => :debug,
  'Profile' => :release,
  'Release' => :release,
}

require File.expand_path(File.join('packages', 'flutter_tools', 'bin', 'podhelper'), flutter_root)

flutter_ios_podfile_setup

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
  end
end
```

Polecenia:

```bash
cd ios
pod repo update
pod install
```

## Xcode: Schemes + Build Settings
Utwórz schematy:
- `Runner-dev`
- `Runner-staging`
- `Runner-prod`

Powiąż je z konfiguracjami build:
- Debug-dev, Release-dev
- Debug-staging, Release-staging
- Debug-prod, Release-prod

Kluczowe Build Settings:
- `PRODUCT_BUNDLE_IDENTIFIER` per flavor (np. `com.company.app.dev`)
- `SWIFT_VERSION = 5.0+`
- `IPHONEOS_DEPLOYMENT_TARGET = 13.0` (lub wyżej)

## Info.plist — uprawnienia i iOS specyfika
Dodaj klucze zależnie od funkcji:
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `NSUserTrackingUsageDescription` (ATT)

Notch / bezpieczne obszary:
- W UI Flutter konsekwentnie używaj `SafeArea`.
- Testuj na urządzeniach z Dynamic Island oraz starszych bez notcha.

ATT (App Tracking Transparency):
- Request tylko jeśli realnie używasz trackingu.
- Zaimplementuj “pre-permission screen” z uzasadnieniem.

## Certyfikaty i Provisioning

### Automatycznie (zalecane dla małych zespołów)
- Xcode Automatic Signing + App Store Connect API key dla CI.
- Narzędzia: Codemagic signing albo Fastlane match (hybrydowo).

### Manualnie (większe organizacje/compliance)
- Rozdziel certyfikaty per environment.
- Provisioning profiles versionowane i rotowane przez właściciela security.
- Sekrety wyłącznie w vault (GitHub Encrypted Secrets / Codemagic variables).

---

## 5) Build Flavors: dev / staging / prod

## Flutter entrypointy
- `lib/main_dev.dart`
- `lib/main_staging.dart`
- `lib/main_prod.dart`

Uruchamianie:

```bash
flutter run --flavor dev -t lib/main_dev.dart
flutter run --flavor staging -t lib/main_staging.dart
flutter run --flavor prod -t lib/main_prod.dart
```

Build IPA:

```bash
flutter build ipa --flavor staging -t lib/main_staging.dart
flutter build ipa --flavor prod -t lib/main_prod.dart
```

## Pliki konfiguracyjne per env
- `--dart-define=API_BASE_URL=...`
- `--dart-define=SENTRY_DSN=...`
- `--dart-define=ENV=staging`

Przykład:

```bash
flutter build ipa \
  --flavor prod \
  -t lib/main_prod.dart \
  --dart-define=ENV=prod \
  --dart-define=API_BASE_URL=https://api.example.com
```

---

## 6) CI/CD (GitHub Actions lub Codemagic)

## Minimalny pipeline
1. `flutter pub get`
2. `dart format --set-exit-if-changed .`
3. `flutter analyze`
4. `flutter test`
5. `flutter build ipa --flavor ...`
6. Upload do TestFlight (Fastlane pilot / Codemagic publish)

## Rekomendacje DevOps
- Cache: Flutter SDK + pub + CocoaPods.
- Wymuś branch protection (testy + analyze).
- Wersjonowanie: SemVer + build number z CI (np. `GITHUB_RUN_NUMBER`).
- Crash reporting: Sentry/Firebase Crashlytics per flavor.

---

## 7) Konkretna sekwencja działań (krok po kroku)

1. Stwórz `mobile/time_tracker_mobile` i uruchom pustą apkę na iOS Simulator.
2. Dodaj warstwy `core/domain/data/presentation` dla jednego feature (np. invoices).
3. Przenieś 1 use case end-to-end + testy.
4. Dodaj flavor `dev` i osobny bundle ID.
5. Skonfiguruj signing + TestFlight dla `staging`.
6. Rozszerz migrację na kolejne feature’y.

---

## 8) Checklista przed App Store Connect

- [ ] `flutter analyze` bez warningów krytycznych.
- [ ] Testy jednostkowe i widgetowe przechodzą.
- [ ] Flavor `prod` ma poprawny `PRODUCT_BUNDLE_IDENTIFIER`.
- [ ] `Info.plist` zawiera wszystkie wymagane usage descriptions.
- [ ] ATT wdrożone poprawnie (jeśli używany tracking).
- [ ] Ikony, launch screen, nazwa aplikacji, wersja i build number ustawione.
- [ ] Certyfikat dystrybucyjny i provisioning profile aktywne.
- [ ] Archive w Xcode przechodzi bez błędów.
- [ ] Upload do TestFlight zakończony sukcesem.
- [ ] App Privacy + eksport szyfrowania uzupełnione w App Store Connect.
- [ ] Release notes gotowe per wersja.

