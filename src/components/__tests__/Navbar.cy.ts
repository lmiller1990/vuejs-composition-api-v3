/// <reference types="cypress" />
import Navbar from "../Navbar.vue"
import { mount } from "../../../cypress/support/component"

describe("Navbar", () => {
  it("renders", () => {
    mount(Navbar)
  })
})
