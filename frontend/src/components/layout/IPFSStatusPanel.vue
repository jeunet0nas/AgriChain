<template>
  <div
    class="rounded-xl border-2 bg-white p-4 space-y-3"
    :class="{
      'border-emerald-300 bg-emerald-50': isConnected,
      'border-blue-300 bg-blue-50': !isConnected && !tested,
      'border-red-300 bg-red-50': tested && !isConnected,
    }"
  >
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h3
          class="text-sm font-semibold flex items-center gap-2"
          :class="{
            'text-emerald-900': isConnected,
            'text-blue-900': !isConnected && !tested,
            'text-red-900': tested && !isConnected,
          }"
        >
          <span v-if="isConnected">✅</span>
          <span v-else-if="!tested">🔗</span>
          <span v-else>❌</span>
          Pinata IPFS Status
        </h3>
        <p
          class="text-xs"
          :class="{
            'text-emerald-700': isConnected,
            'text-blue-700': !isConnected && !tested,
            'text-red-700': tested && !isConnected,
          }"
        >
          <span v-if="isConnected">
            IPFS đã được cấu hình. Metadata sẽ được lưu trữ phân tán trên IPFS.
          </span>
          <span v-else-if="!tested">
            Click "Test Connection" để kiểm tra cấu hình Pinata.
          </span>
          <span v-else>
            Không thể kết nối Pinata. Metadata sẽ fallback về localStorage.
          </span>
        </p>
      </div>
      <button
        type="button"
        class="text-slate-600 hover:text-slate-800"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60"
        :class="{
          'border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50':
            isConnected,
          'border border-blue-300 bg-white text-blue-800 hover:bg-blue-50':
            !isConnected && !tested,
          'border border-red-300 bg-white text-red-800 hover:bg-red-50':
            tested && !isConnected,
        }"
        :disabled="testing"
        @click="handleTestConnection"
      >
        {{ testing ? "Testing..." : "Test Connection" }}
      </button>

      <a
        href="https://app.pinata.cloud/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-blue-600 hover:underline"
      >
        Quản lý Pinata →
      </a>
    </div>

    <details class="text-xs text-slate-600" v-if="!isConnected">
      <summary class="cursor-pointer font-medium hover:text-slate-900">
        📝 Cấu hình Pinata
      </summary>
      <ol class="mt-2 space-y-1 list-decimal list-inside text-[11px]">
        <li>
          Truy cập
          <a
            href="https://app.pinata.cloud/"
            target="_blank"
            class="text-blue-600 hover:underline"
            >Pinata Cloud</a
          >
          và đăng nhập
        </li>
        <li>Vào <strong>API Keys</strong> → <strong>New Key</strong></li>
        <li>
          Chọn permissions: <code>pinFileToIPFS</code>,
          <code>pinJSONToIPFS</code>
        </li>
        <li>Copy <strong>JWT Token</strong></li>
        <li>
          Tạo file <code>.env</code> trong thư mục frontend:
          <pre
            class="mt-1 rounded bg-slate-100 p-2 font-mono text-[10px] overflow-x-auto"
          >
VITE_PINATA_JWT=your_jwt_token_here
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud</pre
          >
        </li>
        <li>Restart dev server: <code>npm run dev</code></li>
      </ol>
    </details>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { testPinataConnection, isIPFSConfigured } from "../../web3/ipfsClient";

defineEmits(["close"]);

const testing = ref(false);
const tested = ref(false);
const isConnected = ref(false);

async function handleTestConnection() {
  testing.value = true;
  tested.value = false;

  try {
    const result = await testPinataConnection();
    isConnected.value = result;
    tested.value = true;
  } catch (error) {
    console.error("Test connection error:", error);
    isConnected.value = false;
    tested.value = true;
  } finally {
    testing.value = false;
  }
}

// Auto-test on mount if configured
onMounted(async () => {
  if (isIPFSConfigured()) {
    await handleTestConnection();
  }
});
</script>
