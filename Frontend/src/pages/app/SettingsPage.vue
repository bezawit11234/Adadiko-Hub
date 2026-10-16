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
const frappeApiMode = ref('mock')

function saveSettings() {
  setOrganization({
    ...currentOrg.value,
    name: orgName.value,
  })
  toast.success('Settings Saved', 'Workspace settings have been updated.')
}
</script>

<template>
  <PageContainer max-width="lg">
    <SampleNotice text="Workspace Settings: Tenant configuration, currency, and Frappe v16 API mode selection." />

    <SectionHeading
      title="Workspace Settings"
      description="Manage organization preferences, currency defaults, and Frappe server connection parameters."
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

        <Field label="API Integration Adapter Mode">
          <select
            v-model="frappeApiMode"
            class="block w-full rounded-xl border border-stone-border bg-white px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-signal/20 focus:border-signal"
          >
            <option value="mock">Mock Sales API (Evaluation / Demo Mode)</option>
            <option value="frappe">Frappe / ERPNext v16 API Adapter</option>
          </select>
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
