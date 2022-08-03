/// <reference types="cypress" />
import FormInput from "../FormInput.vue"
import { mount } from "cypress/vue"

describe("FormInput", () => {
  it("does not render an error when valid", () => {
    mount(FormInput, {
      props: {
        name: "username",
        modelValue: "lachlan",
        type: "text",
        status: {
          valid: true
        }
      }
    })

    cy.get("[role='alert']").should("not.exist")
  })

  it.only("does render an error when invalid", () => {
    mount(FormInput, {
      props: {
        name: "username",
        modelValue: "lachlan",
        type: "text",
        status: {
          valid: false,
          message: 'Invalid'
        }
      }
    })

    cy.get("[role='alert']").should('contain.text', 'Invalid')
  })
})
