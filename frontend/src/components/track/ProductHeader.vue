<template>
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div class="space-y-3 flex-1">
      <!-- Product ID Badge -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-slate-500">Product ID</span>
        <span
          class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-900"
        >
          #{{ product.id }}
        </span>
      </div>

      <!-- Product Name & Description -->
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          {{ product.name }}
        </h2>
        <p v-if="product.description" class="text-sm text-slate-600 max-w-2xl">
          {{ product.description }}
        </p>
      </div>

      <!-- Status & Holder Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Status Card -->
        <div
          class="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3"
        >
          <p class="text-xs font-medium text-slate-500 mb-2">
            Trạng thái hiện tại
          </p>
          <ProductStatusBadge :status="product.status" class="text-sm" />
        </div>

        <!-- Holder Card -->
        <div
          class="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3"
        >
          <p class="text-xs font-medium text-slate-500 mb-2">Đang giữ bởi</p>
          <div class="flex items-center gap-2">
            <div
              :class="[
                'flex items-center justify-center rounded-lg p-1.5',
                getRoleColor(product.currentHolderRole),
              ]"
            >
              <svg
                class="h-4 w-4"
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
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-slate-900">
                {{ getRoleLabel(product.currentHolderRole) }}
              </p>
              <p
                class="font-mono text-[10px] text-slate-600 truncate"
                :title="'Địa chỉ đã được mã hóa để bảo mật'"
              >
                {{
                  product.currentHolderAddress
                    ? formatAddress(hashAddress(product.currentHolderAddress))
                    : "Chưa xác định"
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Details Grid -->
      <ProductDetailsGrid :metadata="product.metadata || {}" />
    </div>

    <!-- Search Box -->
    <div
      class="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <p class="text-[11px] font-medium text-slate-700 mb-2">Tra cứu lô khác</p>
      <form
        @submit.prevent="$emit('search', searchId)"
        class="flex items-center gap-2"
      >
        <input
          v-model="searchId"
          type="text"
          placeholder="Nhập ID khác..."
          class="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          class="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800 active:bg-slate-900 transition"
        >
          Tra cứu
        </button>
      </form>
      <p v-if="searchError" class="mt-1 text-[11px] text-red-500">
        {{ searchError }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import ProductStatusBadge from "./ProductStatusBadge.vue";
import ProductDetailsGrid from "./ProductDetailsGrid.vue";
import { useTrackingHelpers } from "../../composables/useTrackingHelpers";
import { hashAddress } from "../../utils/helpers";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  searchError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["search"]);

const searchId = ref("");

const { formatAddress, getRoleLabel, getRoleColor } = useTrackingHelpers();

// Reset search when product changes
watch(
  () => props.product.id,
  () => {
    searchId.value = "";
  }
);
</script>
