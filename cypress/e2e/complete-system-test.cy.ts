describe('Sistema Completo - Verificación de Funcionalidades', () => {
  
  describe('1. Autenticación y Registro', () => {
    it('should register a new patient', () => {
      cy.visit('/auth/register');
      cy.get('input[name="name"]').type('Paciente Test');
      cy.get('input[name="email"]').type('paciente.test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.contains('Registro exitoso').should('be.visible');
    });

    it('should login as patient', () => {
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('paciente@example.com');
      cy.get('input[name="password"]').type('paciente123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should login as doctor', () => {
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('doctor@example.com');
      cy.get('input[name="password"]').type('doctor123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/doctor/dashboard');
    });

    it('should login as admin', () => {
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('admin@suma.com');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/admin/dashboard');
    });
  });

  describe('2. Funcionalidades del Paciente', () => {
    beforeEach(() => {
      cy.loginAsPatient();
    });

    it('should search for doctors', () => {
      cy.visit('/find-a-doctor');
      cy.get('input[placeholder*="buscar"]').type('Cardiología');
      cy.contains('Buscar').click();
      cy.get('.doctor-card').should('have.length.greaterThan', 0);
    });

    it('should view doctor profile', () => {
      cy.visit('/find-a-doctor');
      cy.get('.doctor-card').first().click();
      cy.url().should('include', '/doctors/');
      cy.contains('Agendar Cita').should('be.visible');
    });

    it('should complete appointment booking flow', () => {
      cy.visit('/doctors/1'); // Asumiendo que existe un doctor con ID 1
      
      // Paso 1: Seleccionar fecha y hora
      cy.contains('Paso 1: Selecciona Fecha y Hora').should('be.visible');
      cy.get('.calendar').click();
      cy.get('[data-date]').first().click();
      cy.get('button').contains('09:00').click();
      cy.contains('Continuar al Paso 2').click();
      
      // Paso 2: Seleccionar servicios
      cy.contains('Paso 2: Elige los Servicios').should('be.visible');
      cy.contains('Continuar al Paso 3').click();
      
      // Paso 3: Método de pago
      cy.contains('Paso 3: Método de Pago').should('be.visible');
      cy.get('input[value="efectivo"]').click();
      cy.contains('Confirmar Cita').click();
      
      // Confirmación
      cy.contains('¡Cita Agendada con Éxito!').should('be.visible');
    });

    it('should view appointment history', () => {
      cy.visit('/dashboard');
      cy.contains('Mis Citas').click();
      cy.get('.appointment-card').should('have.length.greaterThan', 0);
    });

    it('should update profile', () => {
      cy.visit('/profile');
      cy.get('input[name="name"]').clear().type('Nuevo Nombre');
      cy.get('input[name="phone"]').clear().type('123456789');
      cy.contains('Guardar Cambios').click();
      cy.contains('Perfil actualizado').should('be.visible');
    });
  });

  describe('3. Funcionalidades del Doctor', () => {
    beforeEach(() => {
      cy.loginAsDoctor();
    });

    it('should view dashboard', () => {
      cy.visit('/doctor/dashboard');
      cy.contains('Panel del Doctor').should('be.visible');
      cy.contains('Citas').should('be.visible');
      cy.contains('Finanzas').should('be.visible');
    });

    it('should view appointments', () => {
      cy.visit('/doctor/dashboard?view=appointments');
      cy.get('.appointment-card').should('have.length.greaterThan', 0);
    });

    it('should approve payment', () => {
      cy.visit('/doctor/dashboard?view=appointments');
      cy.contains('transferencia').parent().contains('Pendiente').click();
      cy.contains('Aprobar Pago').click();
      cy.contains('Pago aprobado').should('be.visible');
    });

    it('should mark attendance', () => {
      cy.visit('/doctor/dashboard?view=appointments');
      cy.get('.appointment-card').first().click();
      cy.contains('Marcar como Atendido').click();
      cy.contains('Atendido').should('be.visible');
    });

    it('should add clinical notes', () => {
      cy.visit('/doctor/dashboard?view=appointments');
      cy.get('.appointment-card').first().click();
      cy.get('textarea[name="clinicalNotes"]').type('Notas clínicas de prueba');
      cy.get('textarea[name="prescription"]').type('Receta de prueba');
      cy.contains('Guardar').click();
      cy.contains('Notas guardadas').should('be.visible');
    });

    it('should update profile', () => {
      cy.visit('/doctor/dashboard?view=profile');
      cy.get('textarea[name="description"]').clear().type('Nueva descripción');
      cy.get('input[name="consultationFee"]').clear().type('50');
      cy.contains('Guardar Cambios').click();
      cy.contains('Perfil actualizado').should('be.visible');
    });

    it('should manage schedule', () => {
      cy.visit('/doctor/dashboard?view=schedule');
      cy.get('input[name="wednesday"]').uncheck();
      cy.contains('Guardar Horario').click();
      cy.contains('Horario actualizado').should('be.visible');
    });

    it('should report payment', () => {
      cy.visit('/doctor/dashboard?view=subscription');
      cy.contains('Reportar Pago').click();
      cy.get('input[type="file"]').attachFile('comprobante.jpg');
      cy.contains('Guardar').click();
      cy.contains('Pago reportado').should('be.visible');
    });
  });

  describe('4. Funcionalidades del Administrador', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('should view admin dashboard', () => {
      cy.visit('/admin/dashboard');
      cy.contains('Panel de Administración').should('be.visible');
      cy.contains('General').should('be.visible');
      cy.contains('Médicos').should('be.visible');
      cy.contains('Pacientes').should('be.visible');
    });

    it('should manage doctors', () => {
      cy.visit('/admin/dashboard?view=doctors');
      cy.contains('Gestionar Médicos').should('be.visible');
      
      // Desactivar doctor
      cy.contains('Dr. Test').parent().find('button[aria-label="Desactivar"]').click();
      cy.contains('Desactivado').should('be.visible');
      
      // Reactivar doctor
      cy.contains('Dr. Test').parent().find('button[aria-label="Activar"]').click();
      cy.contains('Activo').should('be.visible');
    });

    it('should view patient details', () => {
      cy.visit('/admin/dashboard?view=patients');
      cy.get('input[placeholder="Buscar"]').type('paciente@example.com');
      cy.contains('Ver').click();
      cy.contains('Historial de Citas').should('be.visible');
    });

    it('should approve subscription payments', () => {
      cy.visit('/admin/dashboard?view=finances');
      cy.contains('Pagos Pendientes de Aprobación').click();
      cy.contains('Aprobar').click();
      cy.contains('Pago aprobado').should('be.visible');
    });

    it('should add operational expense', () => {
      cy.visit('/admin/dashboard?view=finances');
      cy.contains('Añadir Gasto Operativo').click();
      cy.get('input[name="description"]').type('Gasto de prueba');
      cy.get('input[name="amount"]').type('100');
      cy.contains('Guardar').click();
      cy.contains('Gasto añadido').should('be.visible');
    });

    it('should manage settings', () => {
      cy.visit('/admin/dashboard?view=settings');
      
      // Añadir ciudad
      cy.contains('Añadir Ciudad').click();
      cy.get('input[name="name"]').type('Ciudad Test');
      cy.get('input[name="subscriptionFee"]').type('200');
      cy.contains('Guardar').click();
      cy.contains('Ciudad añadida').should('be.visible');
      
      // Añadir especialidad
      cy.contains('Añadir Especialidad').click();
      cy.get('input[name="name"]').type('Especialidad Test');
      cy.contains('Guardar').click();
      cy.contains('Especialidad añadida').should('be.visible');
    });

    it('should upload images', () => {
      cy.visit('/admin/dashboard?view=settings');
      cy.get('input[type="file"]').first().selectFile('cypress/fixtures/logo.png', { force: true });
      cy.contains('Imagen Subida').should('be.visible');
    });
  });

  describe('5. Funcionalidades del Vendedor', () => {
    beforeEach(() => {
      cy.loginAsSeller();
    });

    it('should view seller dashboard', () => {
      cy.visit('/seller/dashboard');
      cy.contains('Panel del Vendedor').should('be.visible');
      cy.contains('Cuentas').should('be.visible');
      cy.contains('Finanzas').should('be.visible');
    });

    it('should view referred doctors', () => {
      cy.visit('/seller/dashboard?view=accounts');
      cy.get('.doctor-card').should('have.length.greaterThan', 0);
    });

    it('should view finances', () => {
      cy.visit('/seller/dashboard?view=finances');
      cy.contains('Comisiones').should('be.visible');
      cy.contains('Pagos').should('be.visible');
    });
  });

  describe('6. Funcionalidades Generales', () => {
    it('should search and filter doctors', () => {
      cy.visit('/find-a-doctor');
      
      // Filtrar por especialidad
      cy.get('select[name="specialty"]').select('Cardiología');
      cy.contains('Buscar').click();
      
      // Filtrar por ciudad
      cy.get('select[name="city"]').select('Santo Domingo');
      cy.contains('Buscar').click();
      
      // Verificar resultados
      cy.get('.doctor-card').should('have.length.greaterThan', 0);
    });

    it('should handle notifications', () => {
      cy.loginAsPatient();
      cy.visit('/dashboard');
      
      // Verificar que las notificaciones aparecen
      cy.get('.notification-badge').should('exist');
      
      // Marcar como leídas
      cy.get('.notification-badge').click();
      cy.contains('Marcar como leídas').click();
    });

    it('should handle chat functionality', () => {
      cy.loginAsPatient();
      cy.visit('/dashboard');
      cy.contains('Chat').click();
      
      // Enviar mensaje
      cy.get('textarea[placeholder*="mensaje"]').type('Mensaje de prueba');
      cy.contains('Enviar').click();
      cy.contains('Mensaje de prueba').should('be.visible');
    });
  });

  describe('7. Validaciones y Errores', () => {
    it('should handle invalid login', () => {
      cy.visit('/auth/login');
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      cy.contains('Credenciales inválidas').should('be.visible');
    });

    it('should handle form validations', () => {
      cy.visit('/auth/register');
      cy.get('button[type="submit"]').click();
      cy.contains('El nombre es requerido').should('be.visible');
      cy.contains('El email es requerido').should('be.visible');
      cy.contains('La contraseña es requerida').should('be.visible');
    });

    it('should handle network errors gracefully', () => {
      // Simular error de red
      cy.intercept('GET', '/api/doctors', { forceNetworkError: true });
      cy.visit('/find-a-doctor');
      cy.contains('Error de conexión').should('be.visible');
    });
  });
}); 