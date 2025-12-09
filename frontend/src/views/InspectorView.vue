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
        title="Lô chờ kiểm định (HARVESTED)"
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
        title="Lô đang kiểm định (INSPECTING)"
        subtitle="Các lô đã được attest."
        empty-message="Chưa có lô nào ở trạng thái INSPECTING."
      />
    </div>

    <!-- 📄 Modal Attest với PDF upload -->
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
              🔍 Attest Product #{{ selectedProduct?.id }}
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
              📄 Certificate PDF
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
            <span v-else>Xác nhận Attest</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import RoleProductTable from "../components/role/RoleProductTable.vue";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import { getSignerContract } from "../web3/contractClient";
import { toLocationHash, hashAddress } from "../utils/helpers";
import { reloadProductEvents } from "../stores/useProductSync";
import {
  uploadMetadataToIPFS,
  uploadPDFToIPFS,
  fetchMetadataFromIPFS,
} from "../web3/ipfsClient";

// Stores
const productsStore = useProductsStore();
const session = useSessionStore();
const roles = computed(() => session.roles);
const currentAccount = computed(() => session.currentAccount);

// State cho attest (legacy - giữ để tương thích)
const attestLoadingId = ref(null);
const attestError = ref("");
const attestSuccess = ref("");

// 📄 Modal state
const showAttestModal = ref(false);
const selectedProduct = ref(null);
const submitting = ref(false);
const modalAttestError = ref("");
const modalAttestSuccess = ref("");

// 📄 PDF upload state
const pdfFileInput = ref(null);
const selectedPDF = ref(null);
const pdfError = ref("");
const uploadingPDF = ref(false);
const pdfUploadProgress = ref(0);

// 📄 Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Helper location hash
// function toLocationHash(locationString) {
//   if (!locationString || !locationString.trim()) {
//     return "0x" + "0".repeat(64);
//   }
//   return ethers.keccak256(ethers.toUtf8Bytes(locationString.trim()));
// }

// 👇 SỬA: Computed với debug log
const harvestedProducts = computed(() => {
  const filtered = productsStore.products.filter(
    (p) => p.status === "HARVESTED" && p.currentHolderRole === "FARMER"
  );

  console.log(
    "[Inspector] Harvested products:",
    filtered.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    }))
  );

  return filtered;
});

const inspectingProducts = computed(() => {
  const filtered = productsStore.products.filter(
    (p) => p.status === "INSPECTING"
  );

  console.log(
    "[Inspector] Inspecting products:",
    filtered.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    }))
  );

  return filtered;
});

// 📄 Open attest modal
function openAttestModal(product) {
  selectedProduct.value = product;
  showAttestModal.value = true;
  clearPDF();
  modalAttestError.value = "";
  modalAttestSuccess.value = "";
}

// 📄 Close attest modal
function closeAttestModal() {
  showAttestModal.value = false;
  selectedProduct.value = null;
  clearPDF();
  modalAttestError.value = "";
  modalAttestSuccess.value = "";
}

// 📄 Handle PDF selection
function handlePDFSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  pdfError.value = "";

  // Validate file type
  if (file.type !== "application/pdf") {
    pdfError.value = "Chỉ chấp nhận file PDF";
    return;
  }

  // Validate file size (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    pdfError.value = `Kích thước file vượt quá ${MAX_SIZE / 1024 / 1024}MB`;
    return;
  }

  selectedPDF.value = file;
  console.log("[Inspector] PDF selected:", {
    name: file.name,
    size: file.size,
    type: file.type,
  });
}

// 📄 Clear selected PDF
function clearPDF() {
  selectedPDF.value = null;
  pdfError.value = "";
  pdfUploadProgress.value = 0;

  if (pdfFileInput.value) {
    pdfFileInput.value.value = "";
  }
}

// 📄 Main attest function với PDF
async function handleAttestWithPDF() {
  modalAttestError.value = "";
  modalAttestSuccess.value = "";

  if (!selectedProduct.value || !selectedPDF.value) {
    modalAttestError.value = "Vui lòng chọn PDF certificate";
    return;
  }

  if (!roles.value.INSPECTOR) {
    modalAttestError.value = "Bạn không có quyền Inspector.";
    return;
  }

  try {
    submitting.value = true;

    // BƯỚC 1: Upload PDF lên IPFS
    modalAttestSuccess.value = "Đang upload certificate lên IPFS...";
    uploadingPDF.value = true;
    pdfUploadProgress.value = 0;

    const certificateCID = await uploadPDFToIPFS(
      selectedPDF.value,
      (percent) => {
        pdfUploadProgress.value = percent;
      }
    );

    console.log(`[Inspector] ✅ Certificate uploaded: ${certificateCID}`);
    uploadingPDF.value = false;

    // BƯỚC 2: Fetch metadata hiện tại và update với certificate
    modalAttestSuccess.value = "Đang cập nhật metadata...";

    console.log("[Inspector] 📋 Current product state:", {
      id: selectedProduct.value.id,
      oldURI: selectedProduct.value.uri,
      hasMetadata: !!selectedProduct.value.metadata,
      oldMetadata: selectedProduct.value.metadata,
    });

    let currentMetadata = selectedProduct.value.metadata;
    if (!currentMetadata && selectedProduct.value.uri.startsWith("ipfs://")) {
      console.log(
        "[Inspector] Fetching current metadata from:",
        selectedProduct.value.uri
      );
      currentMetadata = await fetchMetadataFromIPFS(selectedProduct.value.uri);
      console.log("[Inspector] ✅ Current metadata fetched:", currentMetadata);
    }

    // Tạo metadata mới với certificate info
    const updatedMetadata = {
      ...currentMetadata,
      certificate: certificateCID,
      certificateName: selectedPDF.value.name,
      certificateSize: selectedPDF.value.size,
      attestedBy: hashAddress(currentAccount.value), // 🔒 Hash address for privacy
      attestedAt: new Date().toISOString(),
    };

    console.log("[Inspector] 📦 New metadata to upload:", updatedMetadata);

    // Upload metadata mới lên IPFS
    const newMetadataURI = await uploadMetadataToIPFS(updatedMetadata);
    console.log(
      `[Inspector] ✅ New metadata uploaded to IPFS: ${newMetadataURI}`
    );
    console.log(
      `[Inspector] 🔄 Metadata change: ${selectedProduct.value.uri} → ${newMetadataURI}`
    );

    // BƯỚC 3: Gọi smart contract attest
    modalAttestSuccess.value = "Đang gửi transaction attest...";

    const contract = await getSignerContract();

    // 3a. Update batch URI on-chain (chỉ cần 1 transaction)
    // Note: Inspector phải update URI để attach certificate
    console.log("[Inspector] 📝 Updating batch URI + marking inspected...");

    // Update URI trước
    const txUpdateURI = await contract.updateBatchURI(
      selectedProduct.value.id,
      newMetadataURI
    );
    modalAttestSuccess.value = "Đang cập nhật metadata...";
    await txUpdateURI.wait();
    console.log("[Inspector] ✅ Batch URI updated on-chain");

    // 3b. Mark batch inspected (transaction thứ 2 - bắt buộc để thay đổi status)
    modalAttestSuccess.value = "Đang gửi transaction attest...";
    const tx = await contract.markBatchInspected(selectedProduct.value.id);

    modalAttestSuccess.value = "Đang chờ transaction được xác nhận...";
    await tx.wait();

    // BƯỚC 4: Update local store
    const actor = currentAccount.value || "0xINSPECTOR";
    const timestamp = new Date().toISOString();

    console.log("[Inspector] 📝 Updating local store with new status...");
    productsStore.updateStatus(selectedProduct.value.id, "INSPECTING", {
      actor,
      timestamp,
      currentHolderRole: selectedProduct.value.currentHolderRole,
      currentHolderAddress: selectedProduct.value.currentHolderAddress,
      addEvent: false, // Event listener sẽ tự add
    });

    // Update metadata trong product
    console.log(
      "[Inspector] 📝 Manually updating product URI and metadata in store..."
    );
    const product = productsStore.getById(selectedProduct.value.id);
    if (product) {
      const oldURI = product.uri;
      product.uri = newMetadataURI;
      product.metadata = updatedMetadata;
      console.log("[Inspector] ✅ Local product updated:", {
        id: product.id,
        oldURI,
        newURI: product.uri,
        hasNewCertificate: !!product.metadata?.certificate,
        certificateCID: product.metadata?.certificate,
      });
    } else {
      console.error(
        "[Inspector] ⚠️ Could not find product in store to update!"
      );
    }

    modalAttestSuccess.value = `✅ Attest thành công! Certificate đã được lưu on-chain.`;

    console.log("[Inspector] 🎉 Attest complete:", {
      productId: selectedProduct.value.id,
      certificateCID,
      newMetadataURI,
      updatedMetadata,
    });

    // 🔄 Force reload events để đảm bảo timeline đầy đủ
    console.log("[Inspector] 🔄 Reloading events for timeline...");
    await reloadProductEvents(selectedProduct.value.id);

    // Đóng modal sau 2s
    setTimeout(() => {
      closeAttestModal();
    }, 2000);
  } catch (error) {
    console.error("[Inspector] Attest failed:", error);
    modalAttestError.value = `Lỗi: ${error.message}`;
    uploadingPDF.value = false;
  } finally {
    submitting.value = false;
  }
}

// Legacy function - giữ để không break code cũ
async function attestOnChain(product) {
  attestError.value = "";
  attestSuccess.value = "";

  console.log("[Inspector] Attesting product:", {
    id: product.id,
    name: product.name,
    status: product.status,
  });

  if (!product) return;

  if (!roles.value.INSPECTOR) {
    attestError.value = "Bạn không có quyền Inspector.";
    return;
  }

  try {
    attestLoadingId.value = product.id;

    const contract = await getSignerContract();
    // ERC721: No locationHash parameter needed
    const tx = await contract.markBatchInspected(product.id);
    attestSuccess.value = "Đang chờ giao dịch attest được xác nhận...";
    await tx.wait();

    const actor = currentAccount.value || "0xINSPECTOR...DEMO";
    const timestamp = new Date().toISOString();

    // 👇 SỬA: Tắt auto-add event, chỉ update status
    productsStore.updateStatus(product.id, "INSPECTING", {
      actor,
      locationHash,
      timestamp,
      currentHolderRole: product.currentHolderRole,
      currentHolderAddress: product.currentHolderAddress,
      addEvent: false, // ← Tắt auto-add event
    });

    // 👇 XÓA: Không thêm event thủ công nữa, để blockchain event tự add
    // productsStore.addEvent(...) đã bị xóa

    attestSuccess.value = `Chứng nhận on-chain thành công cho lô "${product.name}" (ID ${product.id}).`;

    console.log("[Inspector] Attest success for:", {
      id: product.id,
      name: product.name,
    });
  } catch (e) {
    console.error("[Inspector] markBatchInspected error:", e);
    attestError.value =
      "Không thể attest lô này. Giao dịch bị huỷ hoặc revert.";
  } finally {
    attestLoadingId.value = null;
  }
}
</script>
