#!/usr/bin/env bash
set -euo pipefail

if ! command -v flutter >/dev/null 2>&1; then
  echo "❌ Flutter CLI not found. Install Flutter first: https://docs.flutter.dev/get-started/install"
  exit 1
fi

flutter --version
flutter pub get

# Recreate missing iOS scaffold when repo was extracted without Xcode project files.
if [ ! -d "ios/Runner.xcodeproj" ]; then
  echo "ℹ️  Missing ios/Runner.xcodeproj - generating iOS scaffold with flutter create"
  flutter create --platforms=ios --org com.timetracker.mobile .
fi

cd ios
pod install
cd ..

echo "✅ iOS project is prepared. Next step on macOS:"
echo "   flutter run -d <your-iphone-id> -t lib/main_dev.dart"
