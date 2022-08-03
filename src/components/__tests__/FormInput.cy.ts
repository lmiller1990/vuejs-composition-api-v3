/// <reference types="cypress" />
import FormInput from "../FormInput.vue"
import { mount } from "cypress/vue"
import { computed, defineComponent, ref } from "vue"
import { Status } from "../../validation"

describe("FormInput", () => {
  it.only("responds to input", () => {
    const Parent = defineComponent({
      setup() {
        const username = ref('lachlan')
        const status = computed<Status>(() => {
          const valid = username.value.length > 5
          return {
            valid,
            message: valid ? undefined : 'It is too short'
          }
        })
        return {
          username,
          status
        }
      },
      components: {
        FormInput
      },
      template: `
        <FormInput
          name="username"
          v-model="username"
          :status="status"
          type="text
        />
      `
    })

    mount(Parent)

    cy.get('label').contains('username').click()
    cy.get('input').should('be.focused')

    cy.get('[role="alert"]').should('not.exist')
    cy.get('input').clear()

    cy.get('[role="alert"]').should('exist').should('contain.text', 'It is too short')
  })
})
