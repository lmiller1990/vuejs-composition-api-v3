/// <reference types="cypress" />
import Timeline from "../Timeline.vue"
import { thisMonth, thisWeek, today } from "../../posts"
import { defineComponent } from "vue"

describe("Timeline", () => {
  it("renders", () => {
    const Parent = defineComponent({
      components: { Timeline },
      template: `
        <Suspense>
          <template #default>
            <Timeline />
          </template>
        </Suspense>
      `
    })

    cy.intercept('/api/posts', {
      body: JSON.stringify([
        today, thisWeek, thisMonth
      ])
    }).as('posts')

    cy.mount(Parent)

    cy.wait('@posts')

    cy.contains('Today').as('today')
    cy.contains('This Week').as('this week')
    cy.contains('This Month').as('this month')
    cy.get(".message-header").contains("Posts for today")

    cy.get('[role="link"]').should('have.length', 1)

    cy.get('@this week').click()
    cy.get(".message-header").contains("Posts for this week")
    cy.get('[role="link"]').should('have.length', 2)

    cy.get('@this month').click()
    cy.get(".message-header").contains("Posts for this month")
    cy.get('[role="link"]').should('have.length', 3)
  })
})
