<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 class="text-sm font-semibold text-slate-900 mb-3">
      Lịch sử trạng thái
    </h3>

    <!-- Empty state -->
    <div
      v-if="!events || events.length === 0"
      class="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl"
    >
      <svg
        class="mx-auto h-10 w-10 text-slate-400 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-xs text-slate-500">Chưa có lịch sử sự kiện</p>
    </div>

    <!-- Timeline -->
    <ol v-else class="relative border-l border-slate-200 space-y-4 pl-4">
      <li v-for="(ev, idx) in events" :key="idx" class="relative">
        <!-- Event icon -->
        <span
          :class="[
            'absolute -left-[9px] mt-1 h-3 w-3 rounded-full ring-4 ring-white',
            getEventColor(ev.type),
          ]"
        />

        <div
          class="flex flex-col gap-1.5 bg-slate-50 rounded-lg p-3 border border-slate-100"
        >
          <!-- Header: Event type + Timestamp -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span
                :class="['text-xs font-semibold', getEventTextColor(ev.type)]"
              >
                {{ getEventLabel(ev.type) }}
              </span>
              <!-- Status badge -->
              <span
                v-if="ev.statusTo"
                class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700"
              >
                {{ getStatusLabel(ev.statusTo) }}
              </span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono whitespace-nowrap">
              {{ formatTimestamp(ev.timestamp) }}
            </p>
          </div>

          <!-- Actor -->
          <div class="flex items-center gap-1.5 text-[11px] text-slate-600">
            <svg
              class="h-3 w-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="font-medium">Thực hiện bởi:</span>
            <span class="font-mono text-slate-900 break-all">
              {{ formatAddress(ev.actor) }}
            </span>
          </div>

          <!-- Status transition -->
          <div
            v-if="ev.statusFrom || ev.statusTo"
            class="flex items-center gap-1.5 text-[11px] text-slate-600"
          >
            <svg
              class="h-3 w-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span class="font-medium">Trạng thái:</span>
            <span v-if="ev.statusFrom" class="text-slate-500">
              {{ getStatusLabel(ev.statusFrom) }}
            </span>
            <span v-if="ev.statusFrom && ev.statusTo" class="text-slate-400"
              >→</span
            >
            <span v-if="ev.statusTo" class="font-semibold text-slate-900">
              {{ getStatusLabel(ev.statusTo) }}
            </span>
          </div>

          <!-- Location -->
          <div
            v-if="ev.location"
            class="flex items-start gap-1.5 text-[11px] text-slate-600"
          >
            <svg
              class="h-3 w-3 text-slate-400 mt-0.5"
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
            <span class="flex-1">{{ ev.location }}</span>
          </div>

          <!-- Reason Hash (for recalls) -->
          <div
            v-if="ev.reasonHash"
            class="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 rounded px-2 py-1"
          >
            <svg
              class="h-3 w-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <span class="font-medium">Lý do thu hồi:</span>
              <span class="font-mono text-[10px] block mt-0.5 break-all">{{
                ev.reasonHash
              }}</span>
            </div>
          </div>

          <!-- Location Hash (technical) -->
          <div
            v-if="ev.locationHash && ev.locationHash !== '0x' + '0'.repeat(64)"
            class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-1.5 mt-1"
          >
            <svg
              class="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
            <span class="opacity-70">hash:</span>
            <span class="break-all">{{ ev.locationHash.slice(0, 20) }}...</span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { formatTimestamp } from "../../utils/helpers";
import { useTrackingHelpers } from "../../composables/useTrackingHelpers";

defineProps({
  events: {
    type: Array,
    required: true,
  },
});

const {
  formatAddress,
  getStatusLabel,
  getEventLabel,
  getEventColor,
  getEventTextColor,
} = useTrackingHelpers();
</script>
