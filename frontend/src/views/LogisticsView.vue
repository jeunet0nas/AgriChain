<template>
  <section class="space-y-6">
    <div class="space-y-2">
      <h2 class="text-2xl font-semibold tracking-tight text-slate-900">
        BẢNG ĐIỀU KHIỂN
      </h2>
    </div>

    <!-- Lô đang vận chuyển (IN_TRANSIT) -->
    <RoleProductTable
      :products="transitProducts"
      title="Lô đang vận chuyển (IN_TRANSIT)"
      subtitle="Lọc theo địa chỉ ví đang đăng nhập + status = IN_TRANSIT"
      empty-message="Bạn chưa sở hữu lô nào đang vận chuyển."
    >
      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
          @click="openDeliverModal(product)"
        >
          Giao cho nhà bán lẻ
        </button>
      </template>
    </RoleProductTable>

    <!-- Lô bị thu hồi do LOGISTICS giữ -->
    <RoleProductTable
      :products="recalledLogisticsProducts"
      title="Lô bị thu hồi đang do đơn vị vận chuyển giữ (RECALLED)"
      subtitle="Lọc theo địa chỉ ví đang đăng nhập + status = RECALLED"
      empty-message="Bạn chưa sở hữu lô RECALLED nào."
    >
      <template #extraColHeader> Xử lý thu hồi </template>

      <template #extraCol="{ product }">
        <span
          v-if="
            product.logisticsQuarantineSent ||
            product.currentHolderRole === 'QUARANTINE'
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
            product.logisticsQuarantineSent ||
            product.currentHolderRole === 'QUARANTINE'
          "
          @click="sendLogisticsRecalledToQuarantine(product)"
        >
          <span
            v-if="
              product.logisticsQuarantineSent ||
              product.currentHolderRole === 'QUARANTINE'
            "
          >
            Đã gửi về kho cách ly
          </span>
          <span v-else> Gửi về kho cách ly (demo) </span>
        </button>
      </template>
    </RoleProductTable>

    <!-- Modal gửi cho retailer -->
    <SendProductModal
      :is-open="showDeliverModal"
      :product="selectedProduct"
      target-role="RETAILER"
      title="Giao lô cho nhà bán lẻ"
      description="Chuyển quyền sở hữu lô sản phẩm từ logistics sang retailer trên blockchain"
      address-label="Địa chỉ ví Retailer"
      success-message="Địa chỉ này đã có RETAILER_ROLE. Bạn có thể giao lô này."
      hint-message="Nhập địa chỉ và nhấn 'Kiểm tra' để xác minh quyền retailer."
      @close="closeDeliverModal"
      @success="handleDeliverSuccess"
    />
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { ethers } from "ethers";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import { getSignerContract } from "../web3/contractClient";
import RoleProductTable from "../components/role/RoleProductTable.vue";
import SendProductModal from "../components/shared/SendProductModal.vue";

const productsStore = useProductsStore();
const sessionStore = useSessionStore();

const { products, updateStatus, getById, addEvent } = productsStore;
// 👇 SỬA: Không destructure currentAccount, dùng trực tiếp từ store để giữ reactivity

// --- state cho modal ---
const showDeliverModal = ref(false);
const selectedProduct = ref(null);

// Các lô IN_TRANSIT do LOGISTICS đang giữ (lọc theo địa chỉ ví)
const transitProducts = computed(() => {
  if (!sessionStore.currentAccount) return [];
  return products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      sessionStore.currentAccount.toLowerCase();
    const isTransit = p.status === "IN_TRANSIT";
    return isMyProduct && isTransit;
  });
});

// Các lô RECALLED do LOGISTICS giữ (lọc theo địa chỉ ví)
const recalledLogisticsProducts = computed(() => {
  if (!sessionStore.currentAccount) return [];
  return products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      sessionStore.currentAccount.toLowerCase();
    const isRecalled = p.status === "RECALLED";
    return isMyProduct && isRecalled;
  });
});

// 👇 Modal handlers
function openDeliverModal(product) {
  selectedProduct.value = product;
  showDeliverModal.value = true;
}

function closeDeliverModal() {
  showDeliverModal.value = false;
  selectedProduct.value = null;
}

// 👇 Xử lý khi modal emit success - gửi lô cho retailer
async function handleDeliverSuccess({ product, recipientAddress }) {
  try {
    // 0. Kiểm tra wallet đã kết nối chưa
    if (!sessionStore.currentAccount) {
      console.error("[LogisticsView] Wallet not connected");
      alert("Vui lòng kết nối ví MetaMask trước khi thực hiện giao dịch.");
      return;
    }

    const contract = await getSignerContract();

    // 1. ERC721: Check ownership
    const fromAddress = sessionStore.currentAccount;
    const owner = await contract.ownerOf(product.id);

    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      console.error("[LogisticsView] You don't own this batch");
      alert(`Bạn không sở hữu lô #${product.id}. Không thể chuyển giao.`);
      return;
    }

    // 2. ERC721: transferFrom (no amount, no data)
    const tx = await contract.transferFrom(
      fromAddress,
      recipientAddress,
      product.id
    );
    console.log("[LogisticsView] sending tx transferFrom:", tx.hash);
    await tx.wait();

    // 3. Cập nhật store (tắt auto-add event để tránh duplicate với blockchain event)
    const actor = fromAddress || "0xLOGI...DEMO";
    const timestamp = new Date().toISOString();

    updateStatus(product.id, "DELIVERED", {
      actor,
      locationHash: undefined,
      timestamp,
      currentHolderRole: "RETAILER",
      currentHolderAddress: recipientAddress,
      addEvent: false, // Tắt auto-add, để blockchain event tự add
    });

    // 4. Đóng modal
    closeDeliverModal();

    console.log("[LogisticsView] Transfer to retailer success!");
  } catch (e) {
    console.error("[LogisticsView] handleDeliverSuccess error:", e);
    // Lỗi sẽ được xử lý ở modal nếu cần
  }
}

// IN_TRANSIT (holder = LOGISTICS) -> DELIVERED (holder = RETAILER) - LEGACY DEMO FUNCTION
// Giữ lại để tương thích với code cũ, nhưng nên dùng modal thay thế
function deliverToRetailer(p) {
  if (!p || p.status !== "IN_TRANSIT" || p.currentHolderRole !== "LOGISTICS")
    return;

  const actor = sessionStore.currentAccount || "0xLOGI...DEMO";
  const locationHash = "0xloc_delivered_demo";
  const timestamp = new Date().toISOString();

  updateStatus(p.id, "DELIVERED", {
    actor,
    locationHash,
    timestamp,
    currentHolderRole: "RETAILER",
    currentHolderAddress: "0xRETAILER...DEMO",
  });
}

// RECALLED (holder = LOGISTICS) -> gửi về QUARANTINE_VAULT (on-chain)
async function sendLogisticsRecalledToQuarantine(p) {
  if (!p || p.status !== "RECALLED" || p.currentHolderRole !== "LOGISTICS")
    return;

  if (!sessionStore.currentAccount) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    console.log(
      `[LogisticsView] Sending RECALLED product ${p.id} to QUARANTINE_VAULT`
    );

    const contract = await getSignerContract();
    const fromAddress = sessionStore.currentAccount;
    const QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD";

    // ERC721: Check ownership
    const owner = await contract.ownerOf(p.id);

    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      alert(`Bạn không sở hữu lô #${p.id}`);
      return;
    }

    // ERC721: Transfer to QUARANTINE_VAULT (no amount, no data)
    const tx = await contract.transferFrom(fromAddress, QUARANTINE_VAULT, p.id);

    console.log(`[LogisticsView] Quarantine transaction sent:`, tx.hash);
    await tx.wait();
    console.log(
      `[LogisticsView] ✅ Product ${p.id} sent to quarantine successfully`
    );

    // Update store
    const product = getById(p.id);
    if (product) {
      product.currentHolderRole = "QUARANTINE";
      product.currentHolderAddress = QUARANTINE_VAULT;
      product.logisticsQuarantineSent = true;
    }
  } catch (e) {
    console.error(
      `[LogisticsView] sendLogisticsRecalledToQuarantine error:`,
      e
    );
    alert(`Lỗi: ${e.message || "Không thể gửi về kho cách ly"}`);
  }
}
</script>
