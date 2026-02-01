**BUILDS**
https://expo.dev/accounts/chiagger/projects/smartpantry
In ogni caso fare npx expo-doctor@latest prima della build

**APRIRE L'APP IN LOCALE**

**Android**

_Metodo 1, con device fisico tramite Expo_

- Installare l'app Expo Go sul dispositivo fisico.
- Creare la build con
  eas build --profile development-simulator --platform android
- Trovare la build su <a href="https://expo.dev/accounts/chiagger/projects/SamnEat/builds">Expo Application Services</a> e installarla sul dispositivo Android.
- Da terminale npx expo start --dev-client. Ci verrà mostrato un QR Code che va scannerizzato con l'app Expo Go dal telefono per aprire l'app in locale.

_Metodo 2, con emulatore tramite Expo_

- Scaricare Android Studio per avere accesso agli emulatori Android.
- Creare la build con
  eas build --profile development-simulator --platform android
- Trovare la build su <a href="https://expo.dev/accounts/chiagger/projects/SamnEat/builds">Expo Application Services</a>, scaricarla e installarla trascinandola all'interno dell'emulatore.

_Metodo 2, con emulatore tramite npm_

- Scaricare Android Studio per avere accesso agli emulatori Android.
- Lanciare il comando npx expo run:android

**iOS**

_Metodo 1_

- Scaricare xCode per avere accesso agli emulatori di iOS.
- Comando npx expo prebuild
- Aprire ios/SamnEat.xcworkspace su xCode
- Premere il pulsante play su xCode per avviare una build
- A build conclusa, lanciare npm run start per avviare il server locale e premere i per aprirlo sull'emulatore iOS

**BUILD DI PRODUZIONE, TESTING E RILASCIO**

**Android**

- Lanciare eas build --platform android --profile production --auto-submit
- La build sarà visibile nella sezione Internal Testing di Google Play Console ed è scaricabile e testabile da dispositivo fisico su invito (con Google Play Store)

**iOS**

- Lanciare eas build --platform ios --profile production --auto-submit
- La build sarà visibile nella sezione TestFlight su App Store Connect ed è testabile da dispositivo fisico su invito con app TestFlight

**CODE PUSH SENZA RILASCIARE UNA NUOVA VERSIONE**
eas update --channel production --message "your message"

**Note varie:**

- Quando si cancella utente da Firebase Authentication ricordarsi di cancellare anche da Firestore Database
- Comando per fare deploy delle cloud functions: firebase deploy --only functions, oppure firebase deploy --only functions:functionName per una function specifica
