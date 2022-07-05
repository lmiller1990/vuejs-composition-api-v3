import {
  defineComponent,
  DefineComponent,
  markRaw,
  ref,
} from "vue";
import SignupForm from "../components/SignupForm.vue";

const show = ref(false);

const modalComponent = ref();

type ModalComponent = "signup" | "login";

export function useModal() {
  return {
    show,
    modalComponent,
    setModalComponent: (type?: ModalComponent) => {
      switch (type) {
        case undefined:
          return
        case 'login': 
          return modalComponent.value = markRaw(SignupForm);
        case 'signup': 
          return modalComponent.value = markRaw(SignupForm);
        default:
          throw Error('...')
      }
    },
    showModal: () => (show.value = true),
    hideModal: () => (show.value = false),
  };
}
