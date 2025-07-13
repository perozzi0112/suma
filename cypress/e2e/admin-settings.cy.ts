describe('Admin Settings Module', () => {
  beforeEach(() => {
    // Login como administrador
    cy.visit('/auth/login');
    cy.get('input[name="email"]').type('admin@suma.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    
    // Navegar al dashboard de admin
    cy.visit('/admin/dashboard');
    cy.contains('Configuración').click();
  });

  it('should display all configuration sections', () => {
    // Verificar que todas las secciones estén presentes
    cy.contains('Configuración General').should('be.visible');
    cy.contains('Imágenes de la Plataforma').should('be.visible');
    cy.contains('Configuración Regional').should('be.visible');
    cy.contains('Ciclo de Facturación').should('be.visible');
    cy.contains('Especialidades de Belleza').should('be.visible');
    cy.contains('Ciudades y Tarifas').should('be.visible');
    cy.contains('Especialidades Médicas').should('be.visible');
  });

  it('should update logo and hero image URLs', () => {
    // Actualizar URL del logo
    cy.get('input[name="logoUrl"]').clear().type('https://example.com/new-logo.png');
    
    // Actualizar URL de la imagen principal
    cy.get('input[name="heroImageUrl"]').clear().type('https://example.com/new-hero.jpg');
    
    // Guardar cambios
    cy.contains('Guardar Cambios').click();
    
    // Verificar que se guardó
    cy.contains('Configuración Guardada').should('be.visible');
  });

  it('should upload logo image file', () => {
    // Subir archivo de imagen para el logo
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/logo.png', { force: true });
    
    // Verificar que se subió
    cy.contains('Imagen Subida').should('be.visible');
    cy.contains('La imagen del logo ha sido actualizada').should('be.visible');
  });

  it('should upload hero image file', () => {
    // Subir archivo de imagen para el hero
    cy.get('input[type="file"]').last().selectFile('cypress/fixtures/hero.jpg', { force: true });
    
    // Verificar que se subió
    cy.contains('Imagen Subida').should('be.visible');
    cy.contains('La imagen principal ha sido actualizada').should('be.visible');
  });

  it('should change currency and timezone', () => {
    // Cambiar moneda
    cy.get('select[name="currency"]').select('VES');
    
    // Cambiar zona horaria
    cy.get('select[name="timezone"]').select('America/Mexico_City');
    
    // Guardar cambios
    cy.contains('Guardar Cambios').click();
    
    // Verificar que se guardó
    cy.contains('Configuración Guardada').should('be.visible');
  });

  it('should update billing cycle days', () => {
    // Cambiar día de inicio del ciclo
    cy.get('select[name="billingCycleStartDay"]').select('5');
    
    // Cambiar día de fin del ciclo
    cy.get('select[name="billingCycleEndDay"]').select('10');
    
    // Guardar cambios
    cy.contains('Guardar Cambios').click();
    
    // Verificar que se guardó
    cy.contains('Configuración Guardada').should('be.visible');
  });

  it('should add beauty specialty', () => {
    // Añadir nueva especialidad de belleza
    cy.get('input[id="newBeautySpecialty"]').type('Dermatología Estética');
    cy.contains('Añadir').click();
    
    // Verificar que se añadió
    cy.contains('Especialidad Añadida').should('be.visible');
    cy.contains('Dermatología Estética').should('be.visible');
  });

  it('should remove beauty specialty', () => {
    // Primero añadir una especialidad
    cy.get('input[id="newBeautySpecialty"]').type('Especialidad Temporal');
    cy.contains('Añadir').click();
    
    // Luego eliminarla
    cy.contains('Especialidad Temporal').parent().find('button').click();
    
    // Verificar que se eliminó
    cy.contains('Especialidad Eliminada').should('be.visible');
    cy.contains('Especialidad Temporal').should('not.exist');
  });

  it('should add new city', () => {
    // Añadir nueva ciudad
    cy.contains('Añadir Ciudad').click();
    cy.get('input[name="name"]').type('Santiago');
    cy.get('input[name="subscriptionFee"]').type('150');
    cy.contains('Guardar').click();
    
    // Verificar que se añadió
    cy.contains('Ciudad añadida').should('be.visible');
    cy.contains('Santiago').should('be.visible');
    cy.contains('$150.00').should('be.visible');
  });

  it('should add new medical specialty', () => {
    // Añadir nueva especialidad médica
    cy.contains('Añadir Especialidad').click();
    cy.get('input[name="name"]').type('Cardiología');
    cy.contains('Guardar').click();
    
    // Verificar que se añadió
    cy.contains('Especialidad añadida').should('be.visible');
    cy.contains('Cardiología').should('be.visible');
  });

  it('should edit existing city', () => {
    // Editar ciudad existente
    cy.contains('Santiago').parent().find('button').first().click();
    cy.get('input[name="subscriptionFee"]').clear().type('200');
    cy.contains('Guardar').click();
    
    // Verificar que se actualizó
    cy.contains('Ciudad actualizada').should('be.visible');
    cy.contains('$200.00').should('be.visible');
  });

  it('should delete city', () => {
    // Eliminar ciudad
    cy.contains('Santiago').parent().find('button').last().click();
    cy.contains('Sí, Eliminar').click();
    
    // Verificar que se eliminó
    cy.contains('Ciudad eliminada').should('be.visible');
    cy.contains('Santiago').should('not.exist');
  });

  it('should validate image upload restrictions', () => {
    // Intentar subir archivo no válido
    cy.get('input[type="file"]').first().selectFile('cypress/fixtures/document.pdf', { force: true });
    
    // Verificar mensaje de error
    cy.contains('Por favor selecciona un archivo de imagen válido').should('be.visible');
  });

  it('should validate image size limit', () => {
    // Crear un archivo grande (más de 5MB)
    cy.fixture('large-image.jpg').then((fileContent) => {
      const blob = new Blob([fileContent], { type: 'image/jpeg' });
      const file = new File([blob], 'large-image.jpg', { type: 'image/jpeg' });
      
      cy.get('input[type="file"]').first().selectFile(file, { force: true });
      
      // Verificar mensaje de error
      cy.contains('La imagen no puede ser mayor a 5MB').should('be.visible');
    });
  });
}); 