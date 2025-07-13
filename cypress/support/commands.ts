// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
      loginAsDoctor(): Chainable<void>
      loginAsPatient(): Chainable<void>
      loginAsSeller(): Chainable<void>
    }
  }
}

// Comando para login como administrador
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type('admin@suma.com');
  cy.get('input[name="password"]').type('admin123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin/dashboard');
});

// Comando para login como doctor
Cypress.Commands.add('loginAsDoctor', () => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type('doctor@example.com');
  cy.get('input[name="password"]').type('doctor123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/doctor/dashboard');
});

// Comando para login como paciente
Cypress.Commands.add('loginAsPatient', () => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type('paciente@example.com');
  cy.get('input[name="password"]').type('paciente123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Comando para login como vendedor
Cypress.Commands.add('loginAsSeller', () => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type('seller@example.com');
  cy.get('input[name="password"]').type('seller123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/seller/dashboard');
}); 