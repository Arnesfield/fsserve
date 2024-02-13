<script setup lang="ts">
const props = defineProps<{
  inputId?: string;
  checkbox?: boolean;
  checked?: boolean;
  disabled?: boolean;
}>();
defineEmits<{ (event: 'check'): void }>();
const slots = defineSlots<{
  icon?(): any;
  title?(): any;
  subtitle1?(): any;
  subtitle2?(): any;
  action?(): any;
}>();
</script>

<template>
  <li>
    <input
      v-if="props.checkbox"
      type="checkbox"
      class="checkbox"
      :id="props.inputId"
      :checked="props.checked"
      :disabled="props.disabled"
      @change="() => $emit('check')"
    />
    <label :for="props.inputId">
      <span v-if="slots.icon" class="icon">
        <slot name="icon" />
      </span>
      <span class="title">
        <div v-if="slots.title">
          <slot name="title" />
        </div>
        <div v-if="slots.subtitle1 || slots.subtitle2" class="subtitle">
          <span v-if="slots.subtitle1" class="subtitle1">
            <slot name="subtitle1" />
          </span>
          <span v-if="slots.subtitle2" class="subtitle2">
            <slot name="subtitle2" />
          </span>
        </div>
      </span>
    </label>
    <span v-if="slots.action" class="action">
      <slot name="action" />
    </span>
  </li>
</template>

<style scoped>
li {
  display: flex;
  padding: 2px 8px;
  column-gap: 8px;
  &:nth-child(even) {
    background-color: var(--color-background-mute);
  }
}

label {
  flex: 1;
  display: flex;
  overflow: hidden;
  column-gap: 8px;
}

.icon {
  filter: grayscale(1);
  text-shadow: 0 0 0 var(--color-text);
}

.title {
  flex: 1;
  overflow: hidden;
  word-wrap: break-word;
}

.subtitle {
  display: flex;
  column-gap: 4px;
  color: var(--color-text);
  font-size: 0.8em;
  .subtitle1 {
    flex: 1;
  }
}

.icon,
.action {
  margin-top: auto;
  margin-bottom: auto;
}
</style>
