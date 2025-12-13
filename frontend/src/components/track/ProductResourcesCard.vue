<template>
  <div
    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
  >
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-slate-900">Tài nguyên đính kèm</h3>
      <span class="text-[10px] text-slate-500 truncate">
        URI metadata:
        <span class="font-mono text-emerald-700">{{ product.uri }}</span>
      </span>
    </div>

    <!-- Cards for Image & Certificate -->
    <div
      v-if="hasImage(product) || hasCertificate(product)"
      class="grid gap-4 sm:grid-cols-2"
    >
      <!-- Image Card -->
      <div
        v-if="hasImage(product)"
        class="rounded-xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white p-4 hover:shadow-md transition-all"
      >
        <div class="flex items-start gap-3">
          <div class="shrink-0 rounded-lg bg-blue-100 p-3 text-blue-600">
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-slate-900 mb-1">
              Ảnh sản phẩm
            </h4>
            <p class="text-xs text-slate-600 mb-3">
              Ảnh chụp lô hàng lúc thu hoạch
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
              @click="$emit('view-image', product)"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>Xem ảnh</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Certificate Card -->
      <div
        v-if="hasCertificate(product)"
        class="rounded-xl border-2 border-red-200 bg-linear-to-br from-red-50 to-white p-4 hover:shadow-md transition-all"
      >
        <div class="flex items-start gap-3">
          <div class="shrink-0 rounded-lg bg-red-100 p-3 text-red-600">
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-slate-900 mb-1">
              Chứng chỉ kiểm định
            </h4>
            <p class="text-xs text-slate-600 mb-3">
              Certificate từ Inspector (PDF)
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 active:bg-red-800 transition shadow-sm"
              @click="$emit('view-certificate', product)"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>Xem PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
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
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <p class="text-xs text-slate-500">Chưa có tài nguyên đính kèm</p>
    </div>
  </div>
</template>

<script setup>
import { useIPFSResource } from "../../composables/useIPFSResource";

defineProps({
  product: {
    type: Object,
    required: true,
  },
});

defineEmits(["view-image", "view-certificate"]);

const { hasImage, hasCertificate } = useIPFSResource();
</script>
