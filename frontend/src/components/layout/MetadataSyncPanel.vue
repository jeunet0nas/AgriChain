<template>
  <div
    class="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3"
    v-if="showPanel"
  >
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h3
          class="text-sm font-semibold text-amber-900 flex items-center gap-2"
        >
          ⚠️ Đồng bộ metadata giữa các trình duyệt
        </h3>
        <p class="text-xs text-amber-700">
          Metadata được lưu trong localStorage (chỉ tồn tại trong 1 trình
          duyệt). Để Inspector/Admin thấy tên sản phẩm thay vì "Lô #id", bạn cần
          sync metadata.
        </p>
      </div>
      <button
        type="button"
        class="text-amber-600 hover:text-amber-800"
        @click="showPanel = false"
      >
        ✕
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      <!-- Export Options -->
      <div class="space-y-2">
        <p class="font-medium text-amber-900">📤 Export (từ Farmer browser)</p>
        <button
          type="button"
          class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-amber-800 hover:bg-amber-50"
          @click="handleCopyToClipboard"
        >
          Copy metadata vào clipboard
        </button>
        <button
          type="button"
          class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-amber-800 hover:bg-amber-50"
          @click="handleDownload"
        >
          Download metadata file (.json)
        </button>
      </div>

      <!-- Import Options -->
      <div class="space-y-2">
        <p class="font-medium text-amber-900">
          📥 Import (vào Inspector/Admin browser)
        </p>
        <button
          type="button"
          class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-amber-800 hover:bg-amber-50"
          @click="handlePasteFromClipboard"
        >
          Paste metadata từ clipboard
        </button>
        <label
          class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-amber-800 hover:bg-amber-50 cursor-pointer block text-center"
        >
          Upload metadata file (.json)
          <input
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileUpload"
          />
        </label>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" class="text-xs">
      <p
        :class="{
          'text-emerald-700': statusType === 'success',
          'text-red-700': statusType === 'error',
          'text-blue-700': statusType === 'info',
        }"
      >
        {{ statusMessage }}
      </p>
    </div>

    <!-- Instructions -->
    <details class="text-xs text-amber-700">
      <summary class="cursor-pointer font-medium hover:text-amber-900">
        📖 Hướng dẫn sử dụng
      </summary>
      <ol class="mt-2 space-y-1 list-decimal list-inside">
        <li>
          Trên <strong>Farmer browser</strong>: Click "Copy metadata" hoặc
          "Download file"
        </li>
        <li>
          Chuyển sang <strong>Inspector/Admin browser</strong>: Click "Paste
          metadata" hoặc "Upload file"
        </li>
        <li>Refresh trang (F5) để thấy tên sản phẩm đầy đủ</li>
      </ol>
      <p class="mt-2 text-[11px] text-amber-600">
        💡 Giải pháp production: Dùng IPFS (set VITE_PINATA_JWT trong .env)
      </p>
    </details>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  copyMetadataToClipboard,
  downloadMetadataFile,
  importMetadataFromJSON,
  uploadMetadataFile,
  exportAllMetadata,
} from "../../web3/metadataSync";

const showPanel = ref(true);
const statusMessage = ref("");
const statusType = ref("info"); // 'success' | 'error' | 'info'

function showStatus(message, type = "info") {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => {
    statusMessage.value = "";
  }, 5000);
}

async function handleCopyToClipboard() {
  try {
    const metadata = exportAllMetadata();
    const count = Object.keys(metadata).length;

    if (count === 0) {
      showStatus("⚠️ Không tìm thấy metadata nào trong localStorage", "error");
      return;
    }

    const success = await copyMetadataToClipboard();
    if (success) {
      showStatus(
        `✅ Đã copy ${count} metadata entries vào clipboard!`,
        "success"
      );
    } else {
      showStatus("❌ Không thể copy vào clipboard", "error");
    }
  } catch (e) {
    console.error("[MetadataSync] Copy error:", e);
    showStatus("❌ Lỗi khi copy metadata", "error");
  }
}

function handleDownload() {
  try {
    const metadata = exportAllMetadata();
    const count = Object.keys(metadata).length;

    if (count === 0) {
      showStatus("⚠️ Không tìm thấy metadata nào trong localStorage", "error");
      return;
    }

    downloadMetadataFile();
    showStatus(`✅ Đã download ${count} metadata entries!`, "success");
  } catch (e) {
    console.error("[MetadataSync] Download error:", e);
    showStatus("❌ Lỗi khi download metadata", "error");
  }
}

async function handlePasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const count = importMetadataFromJSON(text);
    showStatus(
      `✅ Đã import ${count} metadata entries! Refresh trang (F5) để xem kết quả.`,
      "success"
    );
  } catch (e) {
    console.error("[MetadataSync] Paste error:", e);
    showStatus(
      "❌ Lỗi khi paste metadata. Đảm bảo clipboard chứa JSON hợp lệ.",
      "error"
    );
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const count = await uploadMetadataFile(file);
    showStatus(
      `✅ Đã import ${count} metadata entries từ file! Refresh trang (F5) để xem kết quả.`,
      "success"
    );
  } catch (e) {
    console.error("[MetadataSync] Upload error:", e);
    showStatus("❌ Lỗi khi upload file. Đảm bảo file JSON hợp lệ.", "error");
  }
}
</script>
