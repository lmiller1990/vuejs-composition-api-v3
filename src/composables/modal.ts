import { ref } from "vue";

const show = ref(false);

export function useModal() {
  return {
    show,
    showModal: () => (show.value = true),
    hideModal: () => (show.value = false),
  };
}
