<script setup lang="ts">
import EmptyState from './EmptyState.vue'

export interface Column<T = any> {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
  sortable?: boolean
}

withDefaults(
  defineProps<{
    columns: Column[]
    rows: any[]
    loading?: boolean
    emptyTitle?: string
    emptyDescription?: string
    rowClickable?: boolean
  }>(),
  {
    loading: false,
    emptyTitle: 'No records found',
    emptyDescription: 'Try adjusting your search filters or create a new entry.',
    rowClickable: false,
  }
)

defineEmits<{
  (e: 'row-click', row: any): void
}>()
</script>

<template>
  <div class="w-full bg-white rounded-2xl border border-stone-border shadow-soft overflow-hidden">
    <!-- Responsive scrollbox -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-stone-bg/60 border-b border-stone-border text-xs uppercase tracking-wider text-ink-muted">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :style="col.width ? { width: col.width } : {}"
              :class="[
                'px-4 py-3.5 font-semibold select-none',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-stone-border/70">
          <tr v-if="loading">
            <td :colspan="columns.length" class="py-12 text-center text-ink-muted">
              <div class="inline-flex items-center gap-2 text-sm">
                <svg class="animate-spin h-4 w-4 text-signal" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Loading records...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="rows.length === 0">
            <td :colspan="columns.length" class="py-8">
              <EmptyState :title="emptyTitle" :description="emptyDescription">
                <template #action>
                  <slot name="empty-action" />
                </template>
              </EmptyState>
            </td>
          </tr>

          <tr
            v-for="(row, idx) in rows"
            v-else
            :key="row.id || idx"
            :class="[
              'transition-colors duration-100 hover:bg-stone-bg/40',
              rowClickable ? 'cursor-pointer' : '',
            ]"
            @click="rowClickable && $emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 text-ink text-sm',
                col.align === 'right' ? 'text-right num-tabular' : col.align === 'center' ? 'text-center' : 'text-left',
              ]"
            >
              <slot :name="col.key" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Optional pagination or footer slot -->
    <div
      v-if="$slots.footer"
      class="px-4 py-3 bg-stone-subtle border-t border-stone-border flex items-center justify-between text-xs text-ink-muted"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
