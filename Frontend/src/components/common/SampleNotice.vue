<script setup lang="ts">
withDefaults(
  defineProps<{
    inline?: boolean
    text?: string
  }>(),
  {
    inline: false,
    text: '',
  }
)
</script>

<template>
  <!-- Demo notices removed for clean production workspace -->
</template>
