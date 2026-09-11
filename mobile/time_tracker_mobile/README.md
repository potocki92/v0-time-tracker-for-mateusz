# time_tracker_mobile

Minimalna, działająca aplikacja Flutter (Clean Architecture + flavor `dev/staging/prod`) przygotowana pod iOS.

## Co zawiera appka

- Ekran listy faktur (`InvoicesPage`) z ładowaniem przez `Cubit`.
- Warstwy: `presentation`, `domain`, `data`.
- Flavor entrypointy:
  - `lib/main_dev.dart`
  - `lib/main_staging.dart`
  - `lib/main_prod.dart`

## Szybki start (lokalnie)

```bash
flutter pub get
flutter run -t lib/main_dev.dart
```

## iPhone / iOS — pełne przygotowanie projektu

> Ten folder był wyciągnięty z monorepo i może nie mieć pełnego scaffoldu iOS (`Runner.xcodeproj`).
> Do automatycznego przygotowania użyj skryptu:

```bash
./scripts_setup_ios.sh
```

Skrypt:
1. sprawdza czy jest Flutter,
2. robi `flutter pub get`,
3. jeśli brakuje projektu Xcode, wykonuje `flutter create --platforms=ios ...`,
4. uruchamia `pod install`.

## Uruchomienie na fizycznym iPhonie (macOS)

1. Podłącz iPhone i zaufaj komputerowi.
2. Sprawdź urządzenia:
   ```bash
   flutter devices
   ```
3. Uruchom aplikację:
   ```bash
   flutter run -d <DEVICE_ID> -t lib/main_dev.dart
   ```
4. Jeśli trzeba, otwórz `ios/Runner.xcworkspace` w Xcode i ustaw:
   - **Signing & Capabilities** (Team),
   - unikalne **Bundle Identifier**.

## Wymagania

- Flutter 3.22+ (Dart 3.4+)
- Xcode + CocoaPods
- macOS (dla buildu i uruchomienia na iPhonie)

## Instalacja na iPhonie (realnie: co jest możliwe)

Nie da się legalnie zainstalować aplikacji iOS „po prostu pobranej jak APK” bez podpisu Apple.
Masz 3 opcje:

1. **Uruchomienie developerskie z Maca (najszybsze)**
   - `flutter run -d <DEVICE_ID> -t lib/main_dev.dart`
2. **TestFlight (najwygodniejsze do instalacji jak normalna appka)**
   - build i upload przez Xcode/Transporter,
   - dodanie testera w App Store Connect,
   - instalacja przez aplikację TestFlight.
3. **Ad Hoc / Enterprise**
   - wymaga certyfikatów, provisioning profile i listy UDID urządzeń.

### Minimalny flow do TestFlight

1. Otwórz `ios/Runner.xcworkspace`.
2. W `Signing & Capabilities` ustaw Team i unikalny Bundle ID.
3. Zwiększ `version` i `build number`.
4. Product → Archive.
5. Distribute App → App Store Connect → Upload.
6. W App Store Connect dodaj testerów i udostępnij build.

Dopiero wtedy możesz „pobrać i zainstalować” aplikację na telefonie jak zwykły użytkownik iOS.
