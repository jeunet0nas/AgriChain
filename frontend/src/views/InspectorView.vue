<template>
  <section class="space-y-6">
    <!-- Nếu không có quyền Inspector -->
    <div
      v-if="!roles.INSPECTOR"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"
    >
      Bạn chưa có quyền truy cập vai trò <strong>Inspector</strong>. Hãy kết nối
      ví có role phù hợp hoặc nhờ Admin cấp quyền.
    </div>

    <!-- Nội dung chính cho Inspector -->
    <div v-else class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-xl font-semibold tracking-tight text-slate-900">
          Bảng điều khiển kiểm định viên
        </h2>
        <p class="text-sm text-slate-600 max-w-2xl">
          Kiểm tra các lô cần được chứng thực và cập nhật trạng thái sang
          <strong>INSPECTING</strong>. Sau khi attest on-chain, luồng tiếp theo
          sẽ do nông dân và logistics xử lý.
        </p>
      </div>

      <!-- Thông báo trạng thái attest -->
      <div v-if="attestError || attestSuccess" class="space-y-1 text-xs">
        <p v-if="attestSuccess" class="text-emerald-600">
          {{ attestSuccess }}
        </p>
        <p v-if="attestError" class="text-red-500">
          {{ attestError }}
        </p>
      </div>

      <!-- Lô chờ kiểm định -->
      <RoleProductTable
        :products="harvestedProducts"
        title="Lô chờ kiểm định"
        subtitle="Các lô đã thu hoạch, do nông dân nắm giữ, chờ kiểm định."
        empty-message="Chưa có lô nào ở trạng thái HARVESTED."
      >
        <template #actions="{ product }">
          <button
            type="button"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
            @click="openAttestModal(product)"
          >
            Kiểm định
          </button>
        </template>
      </RoleProductTable>

      <!-- Lô đang kiểm định -->
      <RoleProductTable
        :products="inspectingProducts"
        title="Lô đẫ kiểm định"
        subtitle="Các lô đã được kiểm định"
        empty-message="Chưa có lô nào ở trạng thái INSPECTING."
      />
    </div>

    <!-- Modal kiểm định với tải PDF -->
    <div
      v-if="showAttestModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="closeAttestModal"
    >
      <div
        class="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 border-b border-slate-200"
        >
          <div>
            <h3 class="text-sm font-semibold text-slate-900">
              Kiểm định lô hàng #{{ selectedProduct?.id }}
            </h3>
            <p class="text-xs text-slate-600">{{ selectedProduct?.name }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            @click="closeAttestModal"
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
        <div class="p-6 space-y-4">
          <!-- PDF Upload -->
          <div class="space-y-2">
            <label
              class="font-medium text-slate-700 text-xs flex items-center gap-1"
            >
              Chứng chỉ PDF
              <span class="text-red-500">*</span>
            </label>

            <!-- File input hidden -->
            <input
              ref="pdfFileInput"
              type="file"
              accept="application/pdf"
              class="hidden"
              @change="handlePDFSelect"
            />

            <!-- Chưa chọn PDF -->
            <div v-if="!selectedPDF" class="space-y-2">
              <button
                type="button"
                class="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-xs text-slate-600 hover:border-slate-400 hover:bg-slate-100 transition-colors"
                @click="pdfFileInput?.click()"
              >
                <div class="flex flex-col items-center gap-2">
                  <svg
                    class="h-8 w-8 text-slate-400"
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
                  <span class="font-medium">Nhấn để chọn PDF</span>
                  <span class="text-[10px] text-slate-400"> Tối đa 10MB </span>
                </div>
              </button>
            </div>

            <!-- Đã chọn PDF - Preview -->
            <div v-else class="space-y-2">
              <div
                class="relative rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div class="flex items-start gap-3">
                  <!-- PDF Icon -->
                  <div
                    class="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg border border-red-200 bg-red-50"
                  >
                    <svg
                      class="h-6 w-6 text-red-600"
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
                  </div>

                  <!-- Info -->
                  <div class="flex-1 space-y-1 text-[11px]">
                    <p class="font-medium text-slate-700 truncate">
                      {{ selectedPDF.name }}
                    </p>
                    <p class="text-slate-500">
                      {{ formatFileSize(selectedPDF.size) }}
                    </p>

                    <!-- Progress bar -->
                    <div v-if="uploadingPDF" class="pt-1">
                      <div class="flex items-center gap-2">
                        <div
                          class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"
                        >
                          <div
                            class="h-full bg-emerald-500 transition-all duration-300"
                            :style="{ width: pdfUploadProgress + '%' }"
                          ></div>
                        </div>
                        <span class="text-[10px] text-slate-500 font-mono">
                          {{ pdfUploadProgress }}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Button xóa -->
                  <button
                    type="button"
                    class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition-colors"
                    :disabled="uploadingPDF || submitting"
                    @click="clearPDF"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Button chọn PDF khác -->
              <button
                type="button"
                class="text-xs text-slate-600 hover:text-slate-900 underline"
                :disabled="uploadingPDF || submitting"
                @click="pdfFileInput?.click()"
              >
                Chọn PDF khác
              </button>
            </div>

            <!-- Error message cho PDF -->
            <p v-if="pdfError" class="text-[11px] text-red-500">
              {{ pdfError }}
            </p>
          </div>

          <!-- Status messages -->
          <div v-if="modalAttestError || modalAttestSuccess" class="text-xs">
            <p v-if="modalAttestSuccess" class="text-emerald-600">
              {{ modalAttestSuccess }}
            </p>
            <p v-if="modalAttestError" class="text-red-500">
              {{ modalAttestError }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50"
        >
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            :disabled="submitting"
            @click="closeAttestModal"
          >
            Hủy
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
            :disabled="!selectedPDF || submitting"
            @click="handleAttestWithPDF"
          >
            <span v-if="submitting">Đang xử lý...</span>
            <span v-else>Xác nhận kiểm định</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import RoleProductTable from "../components/role/RoleProductTable.vue";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import { useInspectorAttest } from "../composables/useInspectorAttest";

// Stores
const productsStore = useProductsStore();
const session = useSessionStore();
const roles = computed(() => session.roles);

// Inspector attest composable
const {
  // Modal state
  showAttestModal,
  selectedProduct,
  submitting,
  modalAttestError,
  modalAttestSuccess,

  // PDF state
  pdfFileInput,
  selectedPDF,
  pdfError,
  uploadingPDF,
  pdfUploadProgress,

  // Methods
  openAttestModal,
  closeAttestModal,
  handlePDFSelect,
  formatFileSize,
  handleAttestWithPDF,
} = useInspectorAttest();

// Product filters - Inspector xem các lô HARVESTED (do FARMER giữ)
const harvestedProducts = computed(() =>
  productsStore.products.filter(
    (p) => p.status === "HARVESTED" && p.currentHolderRole === "FARMER"
  )
);

const inspectingProducts = computed(() =>
  productsStore.products.filter((p) => p.status === "INSPECTING")
);
</script>
