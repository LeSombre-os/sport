# Packaging Android avec Capacitor

## Pourquoi Capacitor ?
- Gratuit (MIT), simple, performant (WebView Chrome)
- Accès natif : vibration, notifications, partage

## Procédure
`ash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Programme Force" "com.sport.force" --webDir "."
npx cap add android
npx cap sync
cd android
./gradlew assembleDebug
# APK dans android/app/build/outputs/apk/debug/
`

## Plugins utiles
- @capacitor/haptics (retour haptique)
- @capacitor/status-bar
- @capacitor/splash-screen
- @capacitor/share

## Coût
- Capacitor : Gratuit
- Android Studio : Gratuit
- Play Store : 25$ (one-time, optionnel)
