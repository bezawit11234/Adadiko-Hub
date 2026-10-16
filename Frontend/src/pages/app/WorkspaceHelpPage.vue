<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'
</script>

<template>
  <PageContainer max-width="lg">
    <SampleNotice text="Workspace Help & Documentation: Keyboard shortcuts and Frappe v16 integration guidance." />

    <SectionHeading
      title="Help & Keyboard Shortcuts"
      description="Quick reference for navigating your Adadiko Next workspace efficiently."
    />

    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        Keyboard Shortcuts
      </h3>

      <div class="space-y-3 text-xs">
        <div class="p-3 rounded-xl bg-stone-bg/60 border border-stone-border flex items-center justify-between">
          <span class="text-ink font-medium">Open Command Palette / Search screens</span>
          <kbd class="px-2 py-1 font-mono font-bold bg-white border border-stone-border rounded shadow-2xs">Ctrl + K</kbd>
        </div>

        <div class="p-3 rounded-xl bg-stone-bg/60 border border-stone-border flex items-center justify-between">
          <span class="text-ink font-medium">Close active modal dialog</span>
          <kbd class="px-2 py-1 font-mono font-bold bg-white border border-stone-border rounded shadow-2xs">ESC</kbd>
        </div>
      </div>

      <h3 class="text-base font-bold text-ink font-heading pt-4 pb-2 border-b border-stone-border">
        Support Contacts
      </h3>
      <div class="text-xs text-ink-muted space-y-2">
        <p>Technical Lead: <strong class="text-ink">support@adadiko.io</strong></p>
        <p>Frappe Integration Engineers: <strong class="text-ink">api-team@adadiko.io</strong></p>
      </div>
    </div>
  </PageContainer>
</template>
