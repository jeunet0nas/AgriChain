<template>
  <div
    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
  >
    <h2 class="text-sm font-semibold text-slate-900">Tạo token sản phẩm mới</h2>

    <div class="grid grid-cols-1 gap-3 text-xs">
      <!-- Row 1: Tên Lô + Loại -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="font-medium text-slate-700 flex items-center gap-1">
            Tên Lô Hàng
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formBatchName"
            type="text"
            class="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Nhập tên lô hàng"
          />
        </div>

        <div class="space-y-1">
          <label class="font-medium text-slate-700 flex items-center gap-1">
            Loại sản phẩm
            <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formProductType"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="" disabled>Chọn loại sản phẩm</option>
            <option value="fruit">Trái cây</option>
            <option value="vegetable">Rau củ</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Ngày thu hoạch + Tên nông trại -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="font-medium text-slate-700 flex items-center gap-1">
            Ngày thu hoạch
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formHarvestDate"
            type="date"
            class="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>

        <div class="space-y-1">
          <label class="font-medium text-slate-700 flex items-center gap-1">
            Tên nơi sản xuất
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formFarmName"
            type="text"
            class="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Trại nuôi... "
          />
        </div>
      </div>

      <!-- Row 3: Địa chỉ -->
      <div class="space-y-1">
        <label class="font-medium text-slate-700 flex items-center gap-1">
          Địa chỉ
          <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formAddress"
          type="text"
          class="w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Nhập địa chỉ"
        />
      </div>

      <!-- Row 4: Mô tả thêm -->
      <div class="space-y-1">
        <label class="font-medium text-slate-700 flex items-center gap-1">
          Mô tả thêm
        </label>
        <textarea
          v-model="formDescription"
          rows="2"
          class="w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Sản phẩm organic, không sử dụng thuốc trừ sâu..."
        ></textarea>
      </div>
    </div>

    <!-- Upload ảnh sản phẩm -->
    <div class="space-y-2">
      <label class="font-medium text-slate-700 text-xs flex items-center gap-1">
        Ảnh sản phẩm
        <span class="text-red-500">*</span>
      </label>

      <!-- File input hidden -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="handleImageSelect"
      />

      <!-- Chưa chọn ảnh -->
      <div v-if="!selectedImage" class="space-y-2">
        <button
          type="button"
          class="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-xs text-slate-600 hover:border-slate-400 hover:bg-slate-100 transition-colors"
          @click="fileInput?.click()"
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="font-medium">Nhấn để chọn ảnh</span>
            <span class="text-[10px] text-slate-400">
              JPG, PNG, WEBP, GIF (tối đa 5MB)
            </span>
          </div>
        </button>
      </div>

      <!-- Đã chọn ảnh - Hiển thị preview -->
      <div v-else class="space-y-2">
        <div
          class="relative rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <div class="flex items-start gap-3">
            <!-- Preview ảnh -->
            <div
              class="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200"
            >
              <img
                v-if="imagePreview"
                :src="imagePreview"
                alt="Preview"
                class="h-full w-full object-cover"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 space-y-1 text-[11px]">
              <p class="font-medium text-slate-700 truncate">
                {{ selectedImage.name }}
              </p>
              <p class="text-slate-500">
                {{ formatFileSize(selectedImage.size) }}
              </p>
              <p class="text-slate-400">{{ selectedImage.type }}</p>

              <!-- Progress bar khi đang upload -->
              <div v-if="uploadingImage" class="pt-1">
                <div class="flex items-center gap-2">
                  <div
                    class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full bg-emerald-500 transition-all duration-300"
                      :style="{ width: uploadProgress + '%' }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono">
                    {{ uploadProgress }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- Button xóa -->
            <button
              type="button"
              class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition-colors"
              :disabled="uploadingImage"
              @click="clearImage"
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

        <!-- Button chọn ảnh khác -->
        <button
          type="button"
          class="text-xs text-slate-600 hover:text-slate-900 underline"
          :disabled="uploadingImage"
          @click="fileInput?.click()"
        >
          Chọn ảnh khác
        </button>
      </div>

      <!-- Error message cho ảnh -->
      <p v-if="imageError" class="text-[11px] text-red-500">
        {{ imageError }}
      </p>
    </div>

    <div class="flex items-center justify-between pt-2">
      <div class="text-[11px] text-slate-500 space-y-1">
        <p v-if="submitStatus" class="text-emerald-600">
          {{ submitStatus }}
        </p>
        <p v-if="submitError" class="text-red-500">
          {{ submitError }}
        </p>
        <p v-if="lastCreatedId" class="text-slate-500">
          Có thể truy xuất lô này tại ID:
          <span class="font-mono font-semibold">
            {{ lastCreatedId }}
          </span>
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
        :disabled="submitting"
        @click="handleCreateBatch"
      >
        <span>
          {{ submitting ? "Đang gửi giao dịch..." : "Tạo token" }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ethers } from "ethers";
import imageCompression from "browser-image-compression";
import { useSessionStore } from "../../stores/useSessionStore";
import { getSignerContract } from "../../web3/contractClient";
import { hashAddress } from "../../utils/helpers";
import {
  uploadMetadataToIPFS,
  uploadImageToIPFS,
  isIPFSConfigured,
} from "../../web3/ipfsClient";

const emit = defineEmits(["created"]);

const session = useSessionStore();
const isFarmer = computed(() => session.roles.FARMER);

// Form state
const formBatchName = ref("");
const formProductType = ref("");
const formHarvestDate = ref("");
const formFarmName = ref("");
const formAddress = ref("");
const formDescription = ref("");

// Submission state
const submitting = ref(false);
const submitStatus = ref("");
const submitError = ref("");
const lastCreatedId = ref(null);

// Image upload state
const fileInput = ref(null);
const selectedImage = ref(null);
const imagePreview = ref(null);
const imageError = ref("");
const uploadingImage = ref(false);
const uploadProgress = ref(0);

function resetForm() {
  formBatchName.value = "";
  formProductType.value = "";
  formHarvestDate.value = "";
  formFarmName.value = "";
  formAddress.value = "";
  formDescription.value = "";
  clearImage();
}

// 📷 Format file size cho hiển thị
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// 📷 Xử lý khi user chọn ảnh
function handleImageSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  imageError.value = "";

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    imageError.value = "Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF";
    return;
  }

  // Validate file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    imageError.value = `Kích thước ảnh vượt quá ${MAX_SIZE / 1024 / 1024}MB`;
    return;
  }

  // Lưu file và tạo preview
  selectedImage.value = file;
  imagePreview.value = URL.createObjectURL(file);

  console.log("[FarmerCreateBatch] Image selected:", {
    name: file.name,
    size: file.size,
    type: file.type,
  });
}

// 📷 Xóa ảnh đã chọn
function clearImage() {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
  }
  selectedImage.value = null;
  imagePreview.value = null;
  imageError.value = "";
  uploadProgress.value = 0;

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

// 📷 Compress ảnh trước khi upload
async function compressImage(file) {
  try {
    console.log("[FarmerCreateBatch] Compressing image...");

    const options = {
      maxSizeMB: 1, // Max 1MB output
      maxWidthOrHeight: 1920, // Max dimension
      useWebWorker: true,
      fileType: file.type, // Giữ nguyên format
    };

    const compressed = await imageCompression(file, options);

    console.log(
      `[FarmerCreateBatch] Compression: ${formatFileSize(
        file.size
      )} → ${formatFileSize(compressed.size)}`
    );

    return compressed;
  } catch (error) {
    console.warn(
      "[FarmerCreateBatch] Compression failed, using original:",
      error
    );
    return file; // Fallback to original
  }
}

/**
 * Create metadata JSON and upload to IPFS (or localStorage fallback)
 */
async function createMetadataURI(imageCID = null) {
  const metadata = {
    name: formBatchName.value || "Lô không tên",
    productType: formProductType.value || "other",
    harvestDate: formHarvestDate.value || null,
    farmName: formFarmName.value || "Chưa xác định",
    address: formAddress.value || "Chưa xác định",
    description: formDescription.value || "",
    timestamp: new Date().toISOString(),
    createdBy: hashAddress(session.currentAccount) || "Unknown", // 🔒 Hash address for privacy
  };

  // Add image to metadata if available
  if (imageCID) {
    metadata.image = `ipfs://${imageCID}`;
    metadata.imageMimeType = selectedImage.value?.type;
    metadata.imageSize = selectedImage.value?.size;
  }

  // Try IPFS first if configured
  if (isIPFSConfigured()) {
    try {
      console.log("[FarmerCreateBatch] Uploading metadata to IPFS...");
      const ipfsURI = await uploadMetadataToIPFS(metadata);
      console.log("[FarmerCreateBatch] ✅ Metadata URI:", ipfsURI);
      return ipfsURI;
    } catch (error) {
      console.error("[FarmerCreateBatch] ❌ IPFS upload failed:", error);
      // Fallback to localStorage
    }
  }

  // Fallback: localStorage (development only)
  console.warn("[FarmerCreateBatch] Using localStorage fallback");
  const metadataString = JSON.stringify(metadata);
  const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));
  localStorage.setItem(`metadata_${hash}`, metadataString);
  return `local://${hash}`;
}

async function handleCreateBatch() {
  submitStatus.value = "";
  submitError.value = "";
  lastCreatedId.value = null;

  // Validate farmer role
  if (!isFarmer.value) {
    submitError.value = "Bạn không có quyền Farmer.";
    return;
  }

  // Validate required fields
  if (!formBatchName.value.trim()) {
    submitError.value = "Vui lòng nhập tên lô hàng.";
    return;
  }
  if (!formProductType.value) {
    submitError.value = "Vui lòng chọn loại sản phẩm.";
    return;
  }
  if (!formHarvestDate.value) {
    submitError.value = "Vui lòng nhập ngày thu hoạch.";
    return;
  }
  if (!formFarmName.value.trim()) {
    submitError.value = "Vui lòng nhập tên nông trại/hộ sản xuất.";
    return;
  }
  if (!formAddress.value.trim()) {
    submitError.value = "Vui lòng nhập địa chỉ.";
    return;
  }
  if (!selectedImage.value) {
    submitError.value = "Vui lòng chọn ảnh sản phẩm.";
    imageError.value = "Ảnh sản phẩm là bắt buộc";
    return;
  }

  try {
    submitting.value = true;
    imageError.value = "";

    // STEP 1: Upload image to IPFS
    let imageCID = null;
    if (selectedImage.value && isIPFSConfigured()) {
      try {
        submitStatus.value = "Đang compress ảnh...";
        uploadingImage.value = true;

        const compressed = await compressImage(selectedImage.value);

        submitStatus.value = "Đang upload ảnh lên IPFS...";
        uploadProgress.value = 0;

        imageCID = await uploadImageToIPFS(compressed, (percent) => {
          uploadProgress.value = percent;
        });

        console.log(`[FarmerCreateBatch] ✅ Image CID: ${imageCID}`);
        uploadingImage.value = false;
      } catch (imageErr) {
        console.error("[FarmerCreateBatch] Image upload failed:", imageErr);
        uploadingImage.value = false;
        imageError.value = `Lỗi upload ảnh: ${imageErr.message}`;
        submitError.value = "Không thể upload ảnh. Vui lòng thử lại.";
        submitting.value = false;
        return;
      }
    }

    // STEP 2: Create metadata with image CID
    submitStatus.value = "Đang tạo metadata...";
    const uri = await createMetadataURI(imageCID);

    // STEP 3: Get signer contract and call mintBatch()
    submitStatus.value = "Đang gửi giao dịch lên blockchain...";
    const contract = await getSignerContract();

    // ✅ ERC721: mintBatch(uri) - only 1 parameter
    const tx = await contract.mintBatch(uri);

    submitStatus.value = "Đang chờ giao dịch được xác nhận...";
    const receipt = await tx.wait();

    // Parse BatchMinted event to get token ID
    const events = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const mintEvent = events.find((e) => e.name === "BatchMinted");
    if (!mintEvent) {
      throw new Error("Không tìm thấy BatchMinted event");
    }

    const tokenId = Number(mintEvent.args.batchId);
    lastCreatedId.value = tokenId;

    submitStatus.value = `Tạo lô thành công! ID: ${tokenId}`;
    console.log(`[FarmerCreateBatch] Batch ${tokenId} created successfully`);

    // Event listener will auto-add to store, no need to emit
    resetForm();
  } catch (e) {
    console.error("[FarmerCreateBatch] Error:", e);
    submitError.value =
      e.message || "Không thể tạo lô mới. Giao dịch bị huỷ hoặc revert.";
    submitStatus.value = "";
  } finally {
    submitting.value = false;
  }
}
</script>
