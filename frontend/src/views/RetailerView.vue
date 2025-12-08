<template>
  <section class="space-y-6">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-slate-900">
        Bảng điều khiển nhà bán lẻ
      </h2>
    </div>

    <!-- Lô đã giao (DELIVERED) -->
    <RoleProductTable
      :products="deliveredProducts"
      title="Lô đã giao cho nhà bán lẻ (DELIVERED)"
      subtitle="Lọc theo địa chỉ ví đang đăng nhập + status = DELIVERED"
      empty-message="Bạn chưa sở hữu lô nào ở trạng thái DELIVERED."
    >
      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
          @click="markAsRetailed(product)"
        >
          Đánh dấu đang bán
        </button>
      </template>
    </RoleProductTable>

    <!-- Lô đang bán lẻ (RETAILED) -->
    <RoleProductTable
      :products="retailedProducts"
      title="Lô đang bán lẻ (RETAILED)"
      subtitle="Lọc theo địa chỉ ví đang đăng nhập + status = RETAILED"
      empty-message="Bạn chưa sở hữu lô nào đang bán lẻ."
    >
      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
          @click="markAsConsumed(product)"
        >
          Đánh dấu đã tiêu thụ (on-chain)
        </button>
      </template>
    </RoleProductTable>

    <!-- Lô đã tiêu thụ (CONSUMED) -->
    <RoleProductTable
      :products="consumedProducts"
      title="Lô đã tiêu thụ (CONSUMED)"
      subtitle="Lọc theo địa chỉ ví đang đăng nhập + status = CONSUMED"
      empty-message="Bạn chưa sở hữu lô nào đã tiêu thụ."
    >
      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100"
          @click="archiveProduct(product)"
        >
          Lưu trữ / đốt token (on-chain)
        </button>
      </template>
    </RoleProductTable>

    <!-- Lô bị thu hồi -->
    <RoleProductTable
      :products="recalledOwnedProducts"
      title="Lô bị thu hồi liên quan đến nhà bán lẻ (RECALLED)"
      subtitle="Lọc theo địa chỉ ví đang đăng nhập + status = RECALLED"
      empty-message="Bạn chưa sở hữu lô RECALLED nào."
    >
      <template #extraColHeader> Xử lý thu hồi </template>

      <template #extraCol="{ product }">
        <span
          v-if="
            product.quarantineSent || product.currentHolderRole === 'QUARANTINE'
          "
          class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100"
        >
          Đã gửi về kho cách ly
        </span>
        <span
          v-else
          class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100"
        >
          Chưa gửi (đang giữ)
        </span>
      </template>

      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          :disabled="
            product.quarantineSent || product.currentHolderRole === 'QUARANTINE'
          "
          @click="sendToQuarantine(product)"
        >
          <span
            v-if="
              product.quarantineSent ||
              product.currentHolderRole === 'QUARANTINE'
            "
          >
            Đã gửi về kho cách ly
          </span>
          <span v-else> Gửi về kho cách ly (on-chain) </span>
        </button>
      </template>
    </RoleProductTable>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import { getSignerContract } from "../web3/contractClient";
import RoleProductTable from "../components/role/RoleProductTable.vue";

const productsStore = useProductsStore();
const sessionStore = useSessionStore();

const { products, updateStatus, addEvent, getById } = productsStore;

// 👇 SỬ: Dùng trực tiếp từ store để giữ reactivity
// ERC721 compliance: ARCHIVE_VAULT is NOT zero address
const ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa";
const QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD";

const deliveredProducts = computed(() => {
  if (!sessionStore.currentAccount) return [];
  return products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      sessionStore.currentAccount.toLowerCase();
    const isDelivered = p.status === "DELIVERED";
    return isMyProduct && isDelivered;
  });
});

const retailedProducts = computed(() => {
  if (!sessionStore.currentAccount) return [];
  return products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      sessionStore.currentAccount.toLowerCase();
    const isRetailed = p.status === "RETAILED";
    return isMyProduct && isRetailed;
  });
});

const consumedProducts = computed(() => {
  if (!sessionStore.currentAccount) return [];
  return products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      sessionStore.currentAccount.toLowerCase();
    const isConsumed = p.status === "CONSUMED";
    return isMyProduct && isConsumed;
  });
});

// Hiển thị lô RECALLED của retailer (lọc theo địa chỉ ví)
const recalledOwnedProducts = computed(() => {
  if (!sessionStore.currentAccount) return [];
  return products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      sessionStore.currentAccount.toLowerCase();
    const isRecalled = p.status === "RECALLED";
    return isMyProduct && isRecalled;
  });
});

// DELIVERED -> RETAILED (on-chain)
async function markAsRetailed(p) {
  if (!p || p.status !== "DELIVERED") return;

  if (!sessionStore.currentAccount) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    console.log(
      `[RetailerView] Calling advanceBatchRetailStatus for product ${p.id}`
    );

    const contract = await getSignerContract();
    // ERC721: No locationHash parameter
    const tx = await contract.advanceBatchRetailStatus(p.id);
    console.log(`[RetailerView] Transaction sent:`, tx.hash);

    await tx.wait();
    console.log(
      `[RetailerView] ✅ Product ${p.id} marked as RETAILED on-chain`
    );

    // Update store (blockchain event sẽ tự sync)
    updateStatus(p.id, "RETAILED", {
      actor: sessionStore.currentAccount,
      timestamp: new Date().toISOString(),
      addEvent: false, // Để blockchain event tự add
    });
  } catch (e) {
    console.error(`[RetailerView] markAsRetailed error:`, e);
    alert(`Lỗi: ${e.message || "Không thể cập nhật trạng thái"}`);
  }
}

// RETAILED -> CONSUMED (on-chain)
async function markAsConsumed(p) {
  if (!p || p.status !== "RETAILED") return;

  if (!sessionStore.currentAccount) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    console.log(
      `[RetailerView] Calling advanceBatchRetailStatus for product ${p.id}`
    );

    const contract = await getSignerContract();
    // ERC721: No locationHash parameter
    const tx = await contract.advanceBatchRetailStatus(p.id);
    console.log(`[RetailerView] Transaction sent:`, tx.hash);

    await tx.wait();
    console.log(
      `[RetailerView] ✅ Product ${p.id} marked as CONSUMED on-chain`
    );

    // Update store (blockchain event sẽ tự sync)
    updateStatus(p.id, "CONSUMED", {
      actor: sessionStore.currentAccount,
      timestamp: new Date().toISOString(),
      addEvent: false, // Để blockchain event tự add
    });
  } catch (e) {
    console.error(`[RetailerView] markAsConsumed error:`, e);
    alert(`Lỗi: ${e.message || "Không thể cập nhật trạng thái"}`);
  }
}

// CONSUMED -> ARCHIVE (đốt token on-chain)
async function archiveProduct(p) {
  if (!p || p.status !== "CONSUMED") return;

  if (!sessionStore.currentAccount) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    console.log(`[RetailerView] Archiving product ${p.id} to ARCHIVE_VAULT`);

    const contract = await getSignerContract();
    const fromAddress = sessionStore.currentAccount;

    // ERC721: Check ownership
    const owner = await contract.ownerOf(p.id);
    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      alert(`Bạn không sở hữu lô #${p.id}`);
      return;
    }

    // ERC721: Transfer to ARCHIVE_VAULT
    const tx = await contract.transferFrom(fromAddress, ARCHIVE_VAULT, p.id);

    console.log(`[RetailerView] Archive transaction sent:`, tx.hash);
    await tx.wait();
    console.log(`[RetailerView] ✅ Product ${p.id} archived successfully`);

    // Update store
    const product = getById(p.id);
    if (product) {
      product.currentHolderRole = "ARCHIVE";
      product.currentHolderAddress = ARCHIVE_VAULT;
    }
  } catch (e) {
    console.error(`[RetailerView] archiveProduct error:`, e);
    alert(`Lỗi: ${e.message || "Không thể lưu trữ sản phẩm"}`);
  }
}

// RECALLED -> QUARANTINE (gửi về kho cách ly on-chain)
async function sendToQuarantine(p) {
  if (!p || p.status !== "RECALLED") return;

  if (!sessionStore.currentAccount) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    console.log(`[RetailerView] Sending product ${p.id} to QUARANTINE_VAULT`);

    const contract = await getSignerContract();
    const fromAddress = sessionStore.currentAccount;

    // ERC721: Check ownership
    const owner = await contract.ownerOf(p.id);
    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      alert(`Bạn không sở hữu lô #${p.id}`);
      return;
    }

    // ERC721: Transfer to QUARANTINE_VAULT
    const tx = await contract.transferFrom(fromAddress, QUARANTINE_VAULT, p.id);

    console.log(`[RetailerView] Quarantine transaction sent:`, tx.hash);
    await tx.wait();
    console.log(
      `[RetailerView] ✅ Product ${p.id} sent to quarantine successfully`
    );

    // Update store
    const product = getById(p.id);
    if (product) {
      product.currentHolderRole = "QUARANTINE";
      product.currentHolderAddress = QUARANTINE_VAULT;
      product.quarantineSent = true;
    }
  } catch (e) {
    console.error(`[RetailerView] sendToQuarantine error:`, e);
    alert(`Lỗi: ${e.message || "Không thể gửi về kho cách ly"}`);
  }
}
</script>
