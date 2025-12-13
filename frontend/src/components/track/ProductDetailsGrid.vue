<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <!-- Product Type -->
    <div
      v-if="metadata?.productType"
      class="flex items-start gap-2 text-xs text-slate-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200"
    >
      <svg
        class="h-4 w-4 text-emerald-500 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
      <div>
        <span class="font-medium">Loại:</span>
        <span class="ml-1">{{ formatProductType(metadata.productType) }}</span>
      </div>
    </div>

    <!-- Harvest Date -->
    <div
      v-if="metadata?.harvestDate"
      class="flex items-start gap-2 text-xs text-slate-600 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200"
    >
      <svg
        class="h-4 w-4 text-blue-500 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <div>
        <span class="font-medium">Thu hoạch:</span>
        <span class="ml-1">{{ formatDate(metadata.harvestDate) }}</span>
      </div>
    </div>

    <!-- Farm Name -->
    <div
      v-if="metadata?.farmName"
      class="flex items-start gap-2 text-xs text-slate-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200"
    >
      <svg
        class="h-4 w-4 text-amber-600 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      <div>
        <span class="font-medium">Nông trại:</span>
        <span class="ml-1">{{ metadata.farmName }}</span>
      </div>
    </div>

    <!-- Address -->
    <div
      v-if="metadata?.address"
      class="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
    >
      <svg
        class="h-4 w-4 text-slate-400 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <div>
        <span class="font-medium">Địa chỉ:</span>
        <span class="ml-1">{{ metadata.address }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTrackingHelpers } from "../../composables/useTrackingHelpers";

defineProps({
  metadata: {
    type: Object,
    required: true,
  },
});

const { formatProductType, formatDate } = useTrackingHelpers();
</script>
