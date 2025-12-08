<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <!-- 👇 THÊM: Panel kiểm tra IPFS status -->
      <IPFSStatusPanel v-if="showIPFSPanel" @close="showIPFSPanel = false" />

      <!-- 👇 Panel sync metadata giữa các browsers (chỉ hiện nếu dùng localStorage) -->
      <MetadataSyncPanel v-if="showMetadataPanel" />

      <!-- 👇 Loading state cho global sync -->
      <div
        v-if="loadingProducts"
        class="flex flex-col items-center justify-center gap-3 py-16"
      >
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"
        ></div>
        <p class="text-sm text-slate-600">
          Đang đồng bộ sản phẩm từ blockchain...
        </p>
      </div>

      <!-- 👇 Chỉ render RouterView khi đã load xong -->
      <RouterView v-else />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/layout/AppHeader.vue";
import MetadataSyncPanel from "./components/layout/MetadataSyncPanel.vue";
import IPFSStatusPanel from "./components/layout/IPFSStatusPanel.vue";
import { useProductSync } from "./stores/useProductSync";
import { isIPFSConfigured } from "./web3/ipfsClient";

// 👇 Get sync functions from composable
const { loadingProducts, loadProductsFromChain } = useProductSync({
  viewName: "Global",
});

const showIPFSPanel = ref(true);
const showMetadataPanel = ref(false);

onMounted(async () => {
  showMetadataPanel.value = !isIPFSConfigured();

  // 🔄 Load all existing batches from blockchain on app mount
  console.log("[App] 🚀 Loading existing batches from blockchain...");
  await loadProductsFromChain();
  console.log("[App] ✅ Batches loaded successfully");
});
</script>
