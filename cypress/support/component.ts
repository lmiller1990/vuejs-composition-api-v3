// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount as _mount } from 'cypress/vue'

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof _mount
    }
  }
}

Cypress.Commands.add('mount', _mount)

import { createPinia, Pinia, setActivePinia } from 'pinia'
import { createNewRouter } from '../../src/router'


let pinia: Pinia = createPinia()

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

export function mount (Comp: any) {
  return _mount(Comp, {
    global: {
      plugins: [
        pinia,
        createNewRouter(createWebHashHistory())
      ]
    }
  })
}

import "highlight.js/styles/atom-one-dark.css";
import { create } from 'cypress/types/lodash'
import { createWebHashHistory } from 'vue-router'

// Example use:
// cy.mount(MyComponent)