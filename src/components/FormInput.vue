<script lang="ts" setup>
defineProps<{
  name: string
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

function handleInput (e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="field">
    <label :for="name" class="label">{{ name }}</label>
    <div class="control">
      <input type="text" :id="name" class="input" :value="modelValue" @input="handleInput">
    </div>
  </div>
</template>