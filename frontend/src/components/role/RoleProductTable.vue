<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-900">
        {{ title }}
      </h3>
      <p v-if="subtitle" class="text-[11px] text-slate-500">
        {{ subtitle }}
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-if="!products || products.length === 0"
      class="py-4 text-xs text-slate-500 text-center"
    >
      {{ emptyMessage }}
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-xs">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-left">
            <th class="px-3 py-2 font-semibold text-slate-700">ID</th>
            <th class="px-3 py-2 font-semibold text-slate-700">Tên lô</th>
            <th class="px-3 py-2 font-semibold text-slate-700">Trạng thái</th>
            <th class="px-3 py-2 font-semibold text-slate-700">Ảnh</th>
            <th class="px-3 py-2 font-semibold text-slate-700">Chứng chỉ</th>

            <!-- Cột bổ sung (nếu có) -->
            <th
              v-if="$slots.extraColHeader"
              class="px-3 py-2 font-semibold text-slate-700"
            >
              <slot name="extraColHeader" />
            </th>

            <!-- Cột hành động -->
            <th
              v-if="$slots.actions"
              class="px-3 py-2 font-semibold text-slate-700 text-right"
            >
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in products"
            :key="p.id"
            class="border-b border-slate-100 hover:bg-slate-50/80"
          >
            <td class="px-3 py-2 font-mono text-slate-800">#{{ p.id }}</td>
            <td class="px-3 py-2 text-slate-800">
              {{ p.name }}
            </td>
            <td class="px-3 py-2">
              <ProductStatusBadge :status="p.status" />
            </td>
            <td class="px-3 py-2">
              <!-- 📷 Hiển thị trạng thái ảnh -->
              <button
                v-if="hasImage(p)"
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100"
                @click="viewImage(p)"
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Xem ảnh</span>
              </button>
              <span v-else class="text-[10px] text-slate-400 italic">
                Không có ảnh
              </span>
            </td>
            <td class="px-3 py-2">
              <!-- 📄 Hiển thị trạng thái certificate -->
              <button
                v-if="hasCertificate(p)"
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100"
                @click="viewCertificate(p)"
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
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>Xem PDF</span>
              </button>
              <span v-else class="text-[10px] text-slate-400 italic">
                Chưa có
              </span>
            </td>

            <!-- Nội dung cột bổ sung -->
            <td v-if="$slots.extraCol" class="px-3 py-2">
              <slot name="extraCol" :product="p" />
            </td>

            <!-- Nút hành động -->
            <td v-if="$slots.actions" class="px-3 py-2 text-right">
              <slot name="actions" :product="p" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 📷 Modal xem ảnh -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="closeImageModal"
    >
      <div
        class="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 border-b border-slate-200"
        >
          <div>
            <h3 class="text-sm font-semibold text-slate-900">
              Ảnh sản phẩm - Lô #{{ selectedProduct?.id }}
            </h3>
            <p class="text-xs text-slate-600">{{ selectedProduct?.name }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            @click="closeImageModal"
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

        <!-- Image container -->
        <div class="relative bg-slate-50 p-8">
          <div
            v-if="loadingImage"
            class="flex flex-col items-center justify-center py-24 gap-3"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
            ></div>
            <p class="text-sm text-slate-600">Đang tải ảnh từ IPFS...</p>
          </div>

          <div v-else-if="imageLoadError" class="py-24 text-center">
            <p class="text-sm text-red-600">{{ imageLoadError }}</p>
            <button
              type="button"
              class="mt-4 text-xs text-blue-600 hover:underline"
              @click="loadImageForModal(selectedProduct)"
            >
              Thử lại
            </button>
          </div>

          <div v-else-if="modalImageURL" class="flex justify-center">
            <img
              :src="modalImageURL"
              :alt="selectedProduct?.name"
              class="max-h-[70vh] w-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        <!-- Footer with actions -->
        <div
          class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50"
        >
          <div class="text-xs text-slate-600">
            <p v-if="selectedProduct?.metadata?.imageMimeType">
              Định dạng: {{ selectedProduct.metadata.imageMimeType }}
            </p>
            <p
              v-if="selectedProduct?.metadata?.imageSize"
              class="text-slate-500"
            >
              Kích thước:
              {{ formatFileSize(selectedProduct.metadata.imageSize) }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="downloadImage"
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
              <span>Tải về</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 📄 Modal xem PDF Certificate -->
    <div
      v-if="showCertificateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click="closeCertificateModal"
    >
      <div
        class="relative max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 border-b border-slate-200"
        >
          <div>
            <h3 class="text-sm font-semibold text-slate-900">
              📄 Certificate - Lô #{{ selectedCertificateProduct?.id }}
            </h3>
            <p class="text-xs text-slate-600">
              {{ selectedCertificateProduct?.name }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            @click="closeCertificateModal"
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

        <!-- PDF Viewer -->
        <div class="relative bg-slate-50" style="height: 70vh">
          <div
            v-if="loadingCertificate"
            class="flex flex-col items-center justify-center h-full gap-3"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-red-600"
            ></div>
            <p class="text-sm text-slate-600">Đang tải PDF từ IPFS...</p>
          </div>

          <div
            v-else-if="certificateLoadError"
            class="flex flex-col items-center justify-center h-full"
          >
            <p class="text-sm text-red-600">{{ certificateLoadError }}</p>
            <button
              type="button"
              class="mt-4 text-xs text-blue-600 hover:underline"
              @click="loadCertificateForModal(selectedCertificateProduct)"
            >
              Thử lại
            </button>
          </div>

          <embed
            v-else-if="modalCertificateURL"
            :src="modalCertificateURL"
            type="application/pdf"
            class="w-full h-full"
          />
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50"
        >
          <div class="text-xs text-slate-600">
            <p v-if="selectedCertificateProduct?.metadata?.certificateName">
              File: {{ selectedCertificateProduct.metadata.certificateName }}
            </p>
            <p
              v-if="selectedCertificateProduct?.metadata?.certificateSize"
              class="text-slate-500"
            >
              Kích thước:
              {{
                formatFileSize(
                  selectedCertificateProduct.metadata.certificateSize
                )
              }}
            </p>
            <p
              v-if="selectedCertificateProduct?.metadata?.attestedBy"
              class="text-slate-500"
            >
              Attested by:
              {{
                selectedCertificateProduct.metadata.attestedBy.slice(0, 10)
              }}...
            </p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              @click="downloadCertificate"
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
              <span>Tải về PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import ProductStatusBadge from "../track/ProductStatusBadge.vue";
import {
  fetchMetadataFromIPFS,
  fetchImageFromIPFS,
  fetchPDFFromIPFS,
} from "../../web3/ipfsClient";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  products: {
    type: Array,
    required: true,
  },
  emptyMessage: {
    type: String,
    default: "Không có dữ liệu để hiển thị.",
  },
});

// 📷 Modal state
const showImageModal = ref(false);
const selectedProduct = ref(null);
const modalImageURL = ref(null);
const loadingImage = ref(false);
const imageLoadError = ref("");

// 📄 Certificate modal state
const showCertificateModal = ref(false);
const selectedCertificateProduct = ref(null);
const modalCertificateURL = ref(null);
const loadingCertificate = ref(false);
const certificateLoadError = ref("");

// 📷 Check if product has image
function hasImage(product) {
  // Check nếu metadata đã load và có image
  if (product.metadata?.image) {
    return true;
  }

  // Nếu chưa load metadata nhưng có IPFS URI, assume có image
  // (metadata sẽ được fetch on-demand khi click)
  if (product.uri?.startsWith("ipfs://")) {
    return true; // Hiển thị nút "Xem ảnh", load khi click
  }

  return false;
}

// 📄 Check if product has certificate
function hasCertificate(product) {
  // Check nếu metadata đã load và có certificate
  if (product.metadata?.certificate) {
    return true;
  }

  // Nếu chưa load metadata nhưng có IPFS URI và status = INSPECTING trở lên
  // Assume có thể có certificate
  if (
    product.uri?.startsWith("ipfs://") &&
    ["INSPECTING", "IN_TRANSIT", "DELIVERED", "RETAILED", "CONSUMED"].includes(
      product.status
    )
  ) {
    return true; // Hiển thị nút "Xem PDF", load khi click
  }

  return false;
}

// 📷 Format file size
function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// 📷 View image - Mở modal và load ảnh
async function viewImage(product) {
  selectedProduct.value = product;
  showImageModal.value = true;
  await loadImageForModal(product);
}

// 📷 Load image từ IPFS
async function loadImageForModal(product) {
  loadingImage.value = true;
  imageLoadError.value = "";
  modalImageURL.value = null;

  try {
    console.log("[RoleProductTable] 🔍 Product data:", {
      id: product.id,
      name: product.name,
      uri: product.uri,
      hasMetadata: !!product.metadata,
      metadataImage: product.metadata?.image,
    });

    // Fetch metadata nếu chưa có
    if (!product.metadata) {
      console.log("[RoleProductTable] Fetching metadata from:", product.uri);
      product.metadata = await fetchMetadataFromIPFS(product.uri);
      console.log("[RoleProductTable] ✅ Metadata fetched:", product.metadata);
    }

    const imageCID = product.metadata?.image;
    console.log("[RoleProductTable] 📷 Image CID from metadata:", imageCID);

    if (!imageCID) {
      throw new Error("Sản phẩm không có ảnh");
    }

    console.log("[RoleProductTable] Loading image from IPFS:", imageCID);

    // Fetch image blob từ IPFS
    const blob = await fetchImageFromIPFS(imageCID);
    console.log("[RoleProductTable] ✅ Image blob loaded:", {
      size: blob.size,
      type: blob.type,
    });

    modalImageURL.value = URL.createObjectURL(blob);

    console.log("[RoleProductTable] ✅ Image loaded successfully");
  } catch (error) {
    console.error("[RoleProductTable] Failed to load image:", error);
    imageLoadError.value = `Không thể tải ảnh: ${error.message}`;
  } finally {
    loadingImage.value = false;
  }
}

// 📷 Download image
async function downloadImage() {
  if (!modalImageURL.value || !selectedProduct.value) return;

  try {
    const response = await fetch(modalImageURL.value);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `product-${selectedProduct.value.id}.${
      selectedProduct.value.metadata?.imageMimeType?.split("/")[1] || "jpg"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("[RoleProductTable] ✅ Image downloaded");
  } catch (error) {
    console.error("[RoleProductTable] Download failed:", error);
    alert("Không thể tải ảnh về. Vui lòng thử lại.");
  }
}

// 📷 Close modal
function closeImageModal() {
  showImageModal.value = false;
  if (modalImageURL.value) {
    URL.revokeObjectURL(modalImageURL.value);
  }
  modalImageURL.value = null;
  selectedProduct.value = null;
  imageLoadError.value = "";
}

// 📄 View certificate - Mở modal và load PDF
async function viewCertificate(product) {
  selectedCertificateProduct.value = product;
  showCertificateModal.value = true;
  await loadCertificateForModal(product);
}

// 📄 Load certificate từ IPFS
async function loadCertificateForModal(product) {
  loadingCertificate.value = true;
  certificateLoadError.value = "";
  modalCertificateURL.value = null;

  try {
    console.log("[RoleProductTable] 🔍 Loading certificate for product:", {
      id: product.id,
      name: product.name,
      status: product.status,
      uri: product.uri,
      hasMetadata: !!product.metadata,
      hasCertificateInMetadata: !!product.metadata?.certificate,
    });

    // Fetch metadata nếu chưa có
    if (!product.metadata) {
      console.log("[RoleProductTable] Fetching metadata from:", product.uri);
      product.metadata = await fetchMetadataFromIPFS(product.uri);
      console.log("[RoleProductTable] ✅ Metadata fetched:", product.metadata);
    } else {
      console.log(
        "[RoleProductTable] Using existing metadata:",
        product.metadata
      );
    }

    const certificateCID = product.metadata?.certificate;
    console.log(
      "[RoleProductTable] 📄 Certificate CID from metadata:",
      certificateCID
    );

    if (!certificateCID) {
      throw new Error("Sản phẩm chưa có certificate");
    }

    console.log(
      "[RoleProductTable] Loading certificate from IPFS:",
      certificateCID
    );

    // Fetch PDF blob từ IPFS
    const blob = await fetchPDFFromIPFS(certificateCID);
    modalCertificateURL.value = URL.createObjectURL(blob);

    console.log("[RoleProductTable] ✅ Certificate loaded successfully");
  } catch (error) {
    console.error("[RoleProductTable] Failed to load certificate:", error);
    certificateLoadError.value = `Không thể tải certificate: ${error.message}`;
  } finally {
    loadingCertificate.value = false;
  }
}

// 📄 Download certificate
async function downloadCertificate() {
  if (!modalCertificateURL.value || !selectedCertificateProduct.value) return;

  try {
    const response = await fetch(modalCertificateURL.value);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      selectedCertificateProduct.value.metadata?.certificateName ||
      `certificate-${selectedCertificateProduct.value.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("[RoleProductTable] ✅ Certificate downloaded");
  } catch (error) {
    console.error("[RoleProductTable] Certificate download failed:", error);
    alert("Không thể tải certificate về. Vui lòng thử lại.");
  }
}

// 📄 Close certificate modal
function closeCertificateModal() {
  showCertificateModal.value = false;
  if (modalCertificateURL.value) {
    URL.revokeObjectURL(modalCertificateURL.value);
  }
  modalCertificateURL.value = null;
  selectedCertificateProduct.value = null;
  certificateLoadError.value = "";
}
</script>
