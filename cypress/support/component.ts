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
import { mount as _mount } from 'cypress/vue'

import { createPinia, Pinia, setActivePinia } from 'pinia'
import { createNewRouter } from '../../src/router'
import "highlight.js/styles/atom-one-dark.css";
import { createWebHashHistory } from 'vue-router'

let pinia: Pinia = createPinia()

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

type MountingOptions<T> = Parameters<typeof _mount<T>>[1]

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof _mount;
    }
  }
}

export function mount<T>(comp: any, payload: MountingOptions<T> = {}) {
  const _props: T = {
    ...payload.props,
  } as any;

  return _mount(comp as any, {
    ...payload,
    props: _props,
    global: {
      plugins: [
        pinia,
        createNewRouter(createWebHashHistory())
      ]
    }
  });
}
