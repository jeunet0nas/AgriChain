<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
      badgeClasses,
    ]"
  >
    <span class="h-1.5 w-1.5 rounded-full mr-1.5" :class="dotClasses" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const labelMap = {
  HARVESTED: "Đã thu hoạch",
  INSPECTING: "Đang kiểm định",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã giao cho bán lẻ",
  RETAILED: "Đang bán lẻ",
  CONSUMED: "Đã tiêu thụ",
  RECALLED: "Đã thu hồi",
};

const colorMap = {
  HARVESTED: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  INSPECTING: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  IN_TRANSIT: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  DELIVERED: {
    badge: "bg-lime-50 text-lime-700 border-lime-200",
    dot: "bg-lime-500",
  },
  RETAILED: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  CONSUMED: {
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  RECALLED: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const label = computed(() => labelMap[props.status] || props.status);
const badgeClasses = computed(
  () =>
    (colorMap[props.status] || {}).badge ||
    "bg-slate-100 border-slate-200 text-slate-700"
);
const dotClasses = computed(
  () => (colorMap[props.status] || {}).dot || "bg-slate-500"
);
</script>
