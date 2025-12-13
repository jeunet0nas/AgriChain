<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      :class="[
        'relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden',
        type === 'certificate' ? 'max-w-5xl flex flex-col' : 'max-w-4xl',
        'max-h-[90vh]',
      ]"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50"
      >
        <div>
          <h3 class="text-sm font-semibold text-slate-900">
            {{ modalTitle }}
          </h3>
          <p class="text-xs text-slate-600">
            {{ product?.name }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          @click="$emit('close')"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div
        :class="[
          type === 'certificate'
            ? 'flex-1 bg-slate-100 overflow-hidden'
            : 'p-4 bg-slate-100 flex items-center justify-center',
        ]"
      >
        <!-- Loading State -->
        <div
          v-if="loading"
          :class="[
            'text-center',
            type === 'certificate'
              ? 'flex items-center justify-center h-full'
              : 'py-16',
          ]"
        >
          <div>
            <div
              :class="[
                'inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent',
                type === 'certificate' ? 'border-red-600' : 'border-blue-600',
              ]"
            />
            <p class="mt-3 text-sm text-slate-600">{{ loadingText }}</p>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          :class="[
            type === 'certificate'
              ? 'flex flex-col items-center justify-center h-full'
              : 'text-center py-16 max-w-md mx-auto',
          ]"
        >
          <svg
            class="h-12 w-12 text-red-400 mb-3"
            :class="type === 'certificate' ? '' : 'mx-auto'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm text-red-600 mb-3">{{ error }}</p>
          <button
            type="button"
            class="text-xs text-blue-600 hover:underline"
            @click="$emit('retry')"
          >
            Thử lại
          </button>
        </div>

        <!-- Image Content -->
        <img
          v-else-if="type === 'image' && url"
          :src="url"
          :alt="product?.name"
          class="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain"
        />

        <!-- Certificate Content -->
        <embed
          v-else-if="type === 'certificate' && url"
          :src="url"
          type="application/pdf"
          class="w-full h-[70vh]"
        />
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50"
      >
        <div class="text-xs text-slate-600">
          <template v-if="type === 'image'">
            <p v-if="product?.metadata?.imageSize">
              Kích thước: {{ formatFileSize(product.metadata.imageSize) }}
            </p>
            <p v-if="product?.metadata?.imageMimeType" class="text-slate-500">
              Định dạng: {{ product.metadata.imageMimeType }}
            </p>
          </template>
          <template v-else-if="type === 'certificate'">
            <p v-if="product?.metadata?.certificateName">
              File: {{ product.metadata.certificateName }}
            </p>
            <p v-if="product?.metadata?.certificateSize" class="text-slate-500">
              Kích thước:
              {{ formatFileSize(product.metadata.certificateSize) }}
            </p>
            <p v-if="product?.metadata?.attestedBy" class="text-slate-500">
              Attested by:
              {{ product.metadata.attestedBy.slice(0, 10) }}...
            </p>
          </template>
        </div>
        <button
          v-if="url"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          @click="$emit('download')"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>{{ downloadButtonText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: (val) => ["image", "certificate"].includes(val),
  },
  product: {
    type: Object,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

defineEmits(["close", "download", "retry"]);

const modalTitle = computed(() => {
  if (!props.product) return "";
  return props.type === "image"
    ? `Ảnh chứng từ nguồn gốc cho #${props.product.id}`
    : `Chứng chỉ kiểm định #${props.product.id}`;
});

const loadingText = computed(() => {
  return props.type === "image"
    ? "Đang tải ảnh từ IPFS..."
    : "Đang tải certificate từ IPFS...";
});

const downloadButtonText = computed(() => {
  return props.type === "image" ? "Tải về ảnh" : "Tải về PDF";
});

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>
