# SUMA - Sistema Unificado de Medicina Avanzada

SUMA es una plataforma integral para la gestión de citas médicas que conecta pacientes, médicos, vendedores y administradores en un ecosistema completo.

## 🚀 Características Principales

### Para Pacientes
- ✅ Búsqueda y filtrado de médicos por especialidad y ubicación
- ✅ Agendamiento de citas con selección de fecha, hora y servicios
- ✅ Múltiples métodos de pago (efectivo y transferencia bancaria)
- ✅ Sistema de cupones y descuentos
- ✅ Chat en tiempo real con médicos
- ✅ Historial de citas y notificaciones
- ✅ Gestión de favoritos

### Para Médicos
- ✅ Panel de control completo con estadísticas
- ✅ Gestión de citas y horarios
- ✅ Sistema de pagos y suscripciones
- ✅ Gestión de servicios y precios
- ✅ Chat con pacientes
- ✅ Soporte técnico integrado
- ✅ Gestión de cuentas bancarias

### Para Vendedores
- ✅ Panel de referidos y comisiones
- ✅ Gestión de médicos asignados
- ✅ Reportes financieros
- ✅ Sistema de marketing

### Para Administradores
- ✅ Dashboard completo con métricas
- ✅ Gestión de usuarios y permisos
- ✅ Sistema de pagos y finanzas
- ✅ Gestión de ciudades y especialidades
- ✅ Soporte técnico centralizado
- ✅ Reportes y analytics

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage)
- **PWA**: Next-PWA para funcionalidad offline
- **AI**: Google AI para asistente inteligente
- **Mapas**: Leaflet para ubicaciones
- **Testing**: Cypress para pruebas E2E

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- Cuenta de Google AI (opcional, para el asistente)

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd suma
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear un archivo `.env.local` con las siguientes variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI Configuration (opcional)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

4. **Configurar Firebase**
   - Crear un proyecto en Firebase Console
   - Habilitar Authentication, Firestore y Storage
   - Configurar las reglas de seguridad (ya incluidas en el proyecto)
   - Desplegar las reglas de Firestore y Storage

5. **Ejecutar el proyecto**
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:9002`

## 🔐 Configuración de Firebase

### Reglas de Firestore
Las reglas de seguridad ya están configuradas en `firestore.rules` y permiten:
- Lectura pública de perfiles de médicos
- Acceso autenticado a datos personales
- Control de acceso basado en roles

### Reglas de Storage
Las reglas de Storage están en `storage.rules` y permiten:
- Subida de comprobantes de pago (máximo 10MB)
- Imágenes de perfil y banner
- Materiales de marketing (solo administradores)

### Desplegar Reglas
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Desplegar reglas
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🧪 Testing

### Ejecutar pruebas E2E
```bash
# Abrir Cypress
npm run cypress:open

# Ejecutar pruebas en modo headless
npm run cypress:run
```

### Verificar tipos TypeScript
```bash
npm run typecheck
```

## 📱 Funcionalidades PWA

El sistema incluye funcionalidades PWA:
- Instalación como aplicación nativa
- Funcionamiento offline
- Notificaciones push
- Sincronización automática

## 🤖 Asistente AI

El sistema incluye un asistente inteligente que puede:
- Responder preguntas sobre el sistema
- Ayudar con el agendamiento de citas
- Proporcionar información médica básica
- Asistir con problemas técnicos

## 🔄 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Servidor de producción

# Testing
npm run test:e2e         # Ejecutar pruebas E2E
npm run cypress:open     # Abrir Cypress

# Utilidades
npm run lint             # Verificar código
npm run typecheck        # Verificar tipos TypeScript
```

## 📊 Estructura del Proyecto

```
src/
├── app/                 # Páginas de Next.js App Router
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base de UI
│   ├── admin/          # Componentes específicos de admin
│   ├── doctor/         # Componentes específicos de doctor
│   └── seller/         # Componentes específicos de vendedor
├── lib/                # Utilidades y servicios
│   ├── firebase.ts     # Configuración de Firebase
│   ├── auth.tsx        # Autenticación
│   ├── types.ts        # Tipos TypeScript
│   └── firestoreService.ts # Servicios de Firestore
├── hooks/              # Hooks personalizados
└── ai/                 # Configuración de AI
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico:
- Crear un ticket en el sistema de soporte
- Contactar al equipo de desarrollo
- Revisar la documentación técnica

## 🔄 Changelog

### v1.0.0
- ✅ Sistema completo de agendamiento
- ✅ Paneles para todos los roles
- ✅ Sistema de pagos integrado
- ✅ Chat en tiempo real
- ✅ PWA funcional
- ✅ Asistente AI
- ✅ Testing E2E completo
- ✅ Reglas de seguridad implementadas

---

**SUMA** - Conectando la medicina del futuro, hoy.
