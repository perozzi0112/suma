# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## ¡ATENCIÓN! ¿La aplicación no se conecta a la base de datos?

Si ves un error como `(auth/invalid-api-key)` o `Missing or insufficient permissions`, significa que la aplicación no tiene las "llaves" correctas para acceder a tu proyecto de Firebase, o no tiene permiso para entrar.

**Sigue estos dos pasos con mucho cuidado.**

### Paso 1: Configura tus credenciales en el archivo `.env`

1.  En la lista de archivos a la izquierda, busca el archivo llamado `.env`. Este es tu archivo de secretos.
    *   **¿No ves el archivo `.env`?** He ajustado la configuración para que se muestre. Si aún no lo ves, es posible que el explorador de archivos lo oculte. Refresca la página o busca la opción para "mostrar archivos ocultos" en la configuración del explorador.
2.  Abre la [Consola de Firebase](https://console.firebase.google.com/) en una nueva pestaña.
3.  Selecciona tu proyecto (ej. `medagenda`).
4.  Haz clic en el **engranaje (⚙️)** al lado de "Project Overview" y luego en **Project settings**.
5.  En la pestaña "General", baja hasta la sección "Your apps".
6.  Busca tu aplicación web (suele tener un ícono `</>`). Si no tienes una, créala haciendo clic en ese ícono y dale un apodo.
7.  Dentro de la tarjeta de tu aplicación, busca **SDK setup and configuration** y selecciona la opción **"Config"**.
8.  Se mostrará un bloque de código como este:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...abcde",
      authDomain: "tu-proyecto.firebaseapp.com",
      projectId: "tu-proyecto",
      storageBucket: "tu-proyecto.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef123456"
    };
    ```
9.  **Copia los valores** de cada una de las variables y pégalos en tu archivo `.env`. Debe quedar así:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...abcde"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
    NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"
    ```

**¡Importante!** Al guardar el archivo `.env`, la aplicación se reiniciará automáticamente. Si el error persiste, significa que una de las claves fue copiada incorrectamente. Por favor, revísalas con mucho cuidado.

### Paso 2: Publica las reglas de seguridad

Si las credenciales son correctas pero sigues viendo un error de "Missing or insufficient permissions", significa que las reglas de seguridad de tu base de datos están bloqueando la aplicación.

**Solución:** Haz clic en el botón **"Publish"** en la parte superior de Firebase Studio. Esto desplegará la aplicación junto con las reglas de seguridad necesarias para que la base de datos funcione. Este es el paso final y crucial.
