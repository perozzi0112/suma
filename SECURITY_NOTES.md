# 🔒 Notas de Seguridad - Sistema MedAgenda

## ⚠️ Problemas de Seguridad Identificados

### 1. **Sesiones en localStorage**
- **Problema**: Las sesiones se mantienen en `localStorage` del navegador
- **Riesgo**: Las sesiones persisten incluso después de cerrar el navegador
- **Impacto**: Usuarios pueden acceder sin volver a autenticarse desde navegador incógnito

### 2. **Contraseñas en Texto Plano**
- **Problema**: Las contraseñas se almacenan sin encriptar en Firestore
- **Riesgo**: Exposición de credenciales si se compromete la base de datos
- **Impacto**: Alto - credenciales visibles para administradores de Firebase

### 3. **Autenticación Simple**
- **Problema**: No hay tokens JWT ni expiración de sesiones
- **Riesgo**: Sesiones indefinidas sin verificación de integridad
- **Impacto**: Medio - sesiones pueden ser manipuladas

## 🔐 Credenciales de Administrador

### Cuenta Principal
- **Email**: `Perozzi0112@gmail.com`
- **Contraseña**: `..Suma..01`
- **ID**: `admin-suma-2024`

### Cuenta Anterior (Deprecada)
- **Email**: `admin@admin.com`
- **Contraseña**: `1234`
- **Estado**: Deshabilitada

## 🛡️ Mejoras Implementadas

### 1. **Logout Mejorado**
```javascript
const logout = () => {
  setUser(null);
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  // Limpiar cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  router.push('/');
};
```

### 2. **Nueva Cuenta Administradora**
- Credenciales más seguras
- ID único en la base de datos
- Permisos explícitos definidos

## 🚀 Recomendaciones de Seguridad

### Prioridad Alta
1. **Implementar JWT Tokens**
   - Usar tokens con expiración (ej: 24 horas)
   - Almacenar en `sessionStorage` en lugar de `localStorage`
   - Implementar refresh tokens

2. **Encriptar Contraseñas**
   - Usar bcrypt o similar para hash de contraseñas
   - Nunca almacenar contraseñas en texto plano
   - Implementar salt único por usuario

3. **Expiración de Sesiones**
   - Sesiones automáticas después de inactividad
   - Logout forzado después de X tiempo
   - Notificación antes de expirar sesión

### Prioridad Media
4. **Autenticación de Dos Factores (2FA)**
   - SMS o app authenticator para administradores
   - Códigos de verificación por email

5. **Logs de Seguridad**
   - Registrar intentos de login fallidos
   - Alertas por accesos sospechosos
   - Historial de sesiones activas

6. **Validación de IP**
   - Restringir acceso desde IPs específicas
   - Alertas por accesos desde nuevas ubicaciones

### Prioridad Baja
7. **Rate Limiting**
   - Limitar intentos de login por IP
   - Bloquear temporalmente después de X intentos fallidos

8. **Headers de Seguridad**
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options

## 🔧 Implementación Sugerida

### Paso 1: JWT Implementation
```javascript
// Ejemplo de implementación JWT
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
```

### Paso 2: Password Hashing
```javascript
// Ejemplo con bcrypt
import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### Paso 3: Session Management
```javascript
// Ejemplo de gestión de sesiones
const createSession = (user) => {
  const token = generateToken(user);
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('userData', JSON.stringify(user));
};

const checkSession = () => {
  const token = sessionStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) {
    logout();
    return null;
  }
  
  return decoded;
};
```

## 📋 Checklist de Seguridad

- [ ] Implementar JWT tokens
- [ ] Encriptar contraseñas existentes
- [ ] Agregar expiración de sesiones
- [ ] Implementar 2FA para administradores
- [ ] Configurar logs de seguridad
- [ ] Agregar rate limiting
- [ ] Configurar headers de seguridad
- [ ] Implementar validación de IP
- [ ] Crear política de contraseñas
- [ ] Documentar procedimientos de seguridad

## 🚨 Contacto de Emergencia

En caso de compromiso de seguridad:
1. Cambiar inmediatamente la contraseña del administrador
2. Revisar logs de acceso
3. Verificar integridad de datos
4. Notificar a usuarios si es necesario

---

**Última actualización**: Diciembre 2024
**Responsable**: Equipo de Desarrollo Suma 