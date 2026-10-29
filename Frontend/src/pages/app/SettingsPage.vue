<script setup lang="ts">
import { ref } from 'vue'
import { useSession } from '@/composables/useSession'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/common/AppButton.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import PageContainer from '@/components/common/PageContainer.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import Field from '@/components/common/Field.vue'
import TextField from '@/components/common/TextField.vue'
import SampleNotice from '@/components/common/SampleNotice.vue'

const { currentOrg, setOrganization } = useSession()
const toast = useToast()

const orgName = ref(currentOrg.value.name)
const currency = ref('USD ($)')
const timezone = ref('UTC+03:00 (East Africa Time)')
const environmentStatus = ref('Production Cloud (Active)')

function saveSettings() {
  setOrganization({
    ...currentOrg.value,
    name: orgName.value,
  })
  toast.success('Settings Saved', 'Workspace preferences have been updated.')
}
</script>

<template>
  <PageContainer max-width="lg">
    <SectionHeading
      title="Workspace Settings"
      description="Manage organization preferences, currency defaults, and system parameters."
    />

    <div class="bg-white rounded-3xl border border-stone-border shadow-soft p-6 sm:p-8 space-y-6">
      <h3 class="text-base font-bold text-ink font-heading pb-2 border-b border-stone-border">
        General Configuration
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Organization Legal Name">
          <TextField v-model="orgName" />
        </Field>

        <Field label="Default Billing Currency">
          <TextField v-model="currency" />
        </Field>

        <Field label="Operating Timezone">
          <TextField v-model="timezone" />
        </Field>

        <Field label="Environment Status">
          <TextField v-model="environmentStatus" disabled />
        </Field>
      </div>

      <div class="pt-4 border-t border-stone-border flex justify-end">
        <AppButton variant="primary" size="md" @click="saveSettings">
          Save Settings
        </AppButton>
      </div>
    </div>
  </PageContainer>
</template>
