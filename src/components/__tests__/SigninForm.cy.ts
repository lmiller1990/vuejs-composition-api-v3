/// <reference types="cypress" />
import SigninForm from "../SigninForm.vue"

describe("SigninForm", () => {
  it("renders", () => {
    cy.mount(SigninForm, {})

    cy.get('#Username').as('username').clear()
    cy.get('#Password').as('password').clear()

    cy.get('[role="alert"]').should('have.length', 2)

    cy.get('@username').type('lac')
    cy.get('@password').type('pass')

    cy.get('[role="alert"]').contains('This field must be between 5 and 10')
    cy.get('[role="alert"]').contains('This field must be between 10 and 40')
    cy.get('button').contains('Submit').as('submit').should('be.disabled')

    cy.get('@username').type('lachlan')
    cy.get('@password').type('password123')

    cy.get('[role="alert"]').should('have.length', 0)
    cy.get('@submit').as('submit').should('not.be.disabled')

    cy.intercept('/api/login', {
      statusCode: 401
    }).as('login')

    cy.get('@submit').click()
    cy.wait('@login')

    cy.get('[role="alert"]').contains('Username or password was incorrect.')
  })
})
