/// <reference types="cypress" />
import PostWriter from "../PostWriter.vue"
import { mount } from "../../../cypress/support/component"
import { Post, createPost } from "../../posts"
import { useUsers } from "../../stores/users"
import { defineComponent } from "vue"
import { DateTime } from "luxon"

describe("PostWriter", () => {
  it("renders call to actions buttons when not authenticated", () => {
    cy.viewport(1000, 600)

    const usersStore = useUsers()
    usersStore.currentUserId = "1";
    const submit = cy.stub();
    const post = createPost(DateTime.now().toISO())

    const Parent = defineComponent({
      components: { PostWriter },
      setup () {
        return {
          post,
          submit
        }
      },
      template: `
        <PostWriter :post="post" @submit="submit" />
      `,
    })

    mount(Parent, {})

    cy.get('[data-cy="editor"]')
      .clear()
      .type([
        "```", 
        "const foo = () => 'BAR'", 
        "```"].join("\n")
    )
    cy.get('code').contains("const foo = () => 'BAR'")

    cy.get('[data-cy="editor"]')
      .clear()
      .type('# Title')
    cy.get('h1').contains('Title')

    cy.get('[data-cy="editor"]')
      .clear()
      .type('Content')
    cy.get('p').contains('Content')

    const expected: Post = { 
      authorId: "1",
      created: post.created,
      html: "<p>Content</p>\n",
      id: "1",
      markdown: "Content",
      title: "Today"
    }

    cy.get('button').contains('Save Post').click().then(() => {
      expect(submit).to.have.been.calledWith(expected)
    })
  })
})
