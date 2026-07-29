# Libro de los Malditos

Aplicación móvil de tareas con una estética original de fantasía oscura, desarrollada con React Native, TypeScript y Expo.

## Funciones

- Crear, completar y eliminar juramentos.
- Marcar tareas prioritarias como maldiciones.
- Consultar progreso, estadísticas e historial en el Códice.
- Guardar los datos localmente en el dispositivo.
- Interfaz inspirada en un grimorio con cuero, pergamino y tipografía Cinzel.

## Ejecutar el proyecto

```bash
npm install
npx expo start
```

El proyecto utiliza Expo SDK 54 para mantener compatibilidad con Expo Go en dispositivos físicos.

## APK

Para generar una APK instalable con el Android toolchain local:

```powershell
npm install
npx expo prebuild --platform android
npm run android:apk
```

El archivo resultante queda en
`android/app/build/outputs/apk/release/app-release.apk`.

Esta compilación local sirve para instalar y probar la aplicación directamente.
Para publicar en Google Play se debe configurar una clave de carga privada y generar
un Android App Bundle (`.aab`).
