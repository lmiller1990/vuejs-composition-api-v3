/// <reference types="cypress" />
import Navbar from "../Navbar.vue"
import { useUsers } from "../../stores/users"

describe("Navbar", () => {
  it.only("renders call to actions buttons when not authenticated", () => {
    cy.mount(Navbar, {})
    cy.get('button').contains('Sign Up')
    cy.get('button').contains('Sign In')
  })

  it("renders actions buttons when authenticated", () => {
    const usersStore = useUsers()
    usersStore.currentUserId = '1'

    cy.mount(Navbar, {})

    cy.get('a').contains('New Post')
    cy.get('button').contains('Log Out')
  })
})
