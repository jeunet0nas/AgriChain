<template>
  <section class="space-y-6">
    <!-- Nếu không có quyền Farmer -->
    <div
      v-if="!roles.FARMER"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"
    >
      Bạn chưa có quyền truy cập vai trò <strong>Farmer</strong>. Hãy kết nối ví
      có role phù hợp hoặc nhờ Admin cấp quyền.
    </div>

    <!-- Nội dung chính cho Farmer -->
    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-2">
        <h2 class="text-4xl font-semibold tracking-tight text-slate-900">
          BẢNG ĐIỀU KHIỂN
        </h2>
      </div>

      <!-- Form tạo lô on-chain -->
      <FarmerCreateBatchForm />

      <!-- 1. Danh sách lô FARMER đang giữ -->
      <RoleProductTable
        :products="farmerProducts"
        title="Các lô do bạn đang nắm giữ"
        subtitle="Lọc theo địa chỉ ví đang đăng nhập"
        empty-message="Bạn chưa sở hữu lô sản phẩm nào."
      />

      <!-- 2. Lô đã được kiểm định (INSPECTING) - nông dân gửi cho logistics -->
      <RoleProductTable
        :products="farmerInspectingProducts"
        title="Lô đã được kiểm định, chờ gửi đi"
        subtitle="Lọc theo địa chỉ ví + status = INSPECTING"
        empty-message="Bạn chưa có lô nào ở trạng thái INSPECTING."
      >
        <template #actions="{ product }">
          <button
            type="button"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
            @click="openSendModal(product)"
          >
            Gửi cho logistics
          </button>
        </template>
      </RoleProductTable>

      <!-- 3. Lô bị thu hồi do FARMER giữ -->
      <RoleProductTable
        :products="recalledFarmerProducts"
        title="Lô bị thu hồi đang giữ"
        subtitle="Lọc theo địa chỉ ví + status = RECALLED"
        empty-message="Bạn chưa có lô RECALLED nào cần xử lý."
      >
        <template #extraColHeader> Xử lý thu hồi </template>

        <template #extraCol="{ product }">
          <span
            v-if="
              product.farmerQuarantineSent ||
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
              product.farmerQuarantineSent ||
              product.currentHolderRole === 'QUARANTINE'
            "
            @click="sendFarmerRecalledToQuarantine(product)"
          >
            <span
              v-if="
                product.farmerQuarantineSent ||
                product.currentHolderRole === 'QUARANTINE'
              "
            >
              Đã gửi về kho cách ly
            </span>
            <span v-else> Gửi về kho cách ly (on-chain) </span>
          </button>
        </template>
      </RoleProductTable>
    </div>

    <!-- Modal gửi cho logistics -->
    <SendProductModal
      :is-open="showSendModal"
      :product="selectedProduct"
      target-role="LOGISTICS"
      title="Gửi lô cho Logistics"
      description="Chuyển quyền sở hữu lô sản phẩm trên blockchain"
      address-label="Địa chỉ ví Logistics"
      success-message="Địa chỉ này đã có LOGISTICS_ROLE. Bạn có thể gửi lô này."
      hint-message="Nhập địa chỉ và nhấn 'Kiểm tra' để xác minh quyền logistics."
      @close="closeSendModal"
      @success="handleSendSuccess"
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
import FarmerCreateBatchForm from "../components/farmer/FarmerCreateBatchForm.vue";
import SendProductModal from "../components/shared/SendProductModal.vue";

const productsStore = useProductsStore();
const session = useSessionStore();

const roles = computed(() => session.roles);
const currentAccount = computed(() => session.currentAccount);

// --- state cho modal ---
const showSendModal = ref(false);
const selectedProduct = ref(null);

// Helper constants
const LOGISTICS_ROLE = ethers.id("LOGISTICS_ROLE");

// - Chỉ hiển thị products thuộc sở hữu của currentAccount
// - Bảo mật tốt hơn: user chỉ thấy products của mình
const farmerProducts = computed(() => {
  if (!currentAccount.value) {
    console.log("[FarmerView] No currentAccount, returning empty array");
    return [];
  }

  const filtered = productsStore.products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      currentAccount.value.toLowerCase();
    const isFarmerManageable =
      p.status === "HARVESTED" || p.status === "INSPECTING";

    // Debug log
    if (p.status === "HARVESTED" || p.status === "INSPECTING") {
      console.log(`[FarmerView] Product ${p.id}:`, {
        holderAddress: p.currentHolderAddress,
        currentAccount: currentAccount.value,
        isMyProduct,
        status: p.status,
      });
    }

    return isMyProduct && isFarmerManageable;
  });

  console.log(
    `[FarmerView] Filtered ${filtered.length} farmer products from ${productsStore.products.length} total`
  );
  return filtered;
});

// ✅ Lọc lô INSPECTING theo địa chỉ ví
// - Lô đã được inspector attest, chờ farmer gửi cho logistics
const farmerInspectingProducts = computed(() => {
  if (!currentAccount.value) return [];

  return productsStore.products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      currentAccount.value.toLowerCase();
    const isInspecting = p.status === "INSPECTING";

    return isMyProduct && isInspecting;
  });
});

// ✅ Lọc lô RECALLED theo địa chỉ ví
// - Admin đã thu hồi, farmer cần gửi về QUARANTINE_VAULT
const recalledFarmerProducts = computed(() => {
  if (!currentAccount.value) return [];

  return productsStore.products.filter((p) => {
    const isMyProduct =
      p.currentHolderAddress?.toLowerCase() ===
      currentAccount.value.toLowerCase();
    const isRecalled = p.status === "RECALLED";
    const notInQuarantine = p.currentHolderRole !== "QUARANTINE";

    return isMyProduct && isRecalled && notInQuarantine;
  });
});

// 👇 Modal handlers
function openSendModal(product) {
  selectedProduct.value = product;
  showSendModal.value = true;
}

function closeSendModal() {
  showSendModal.value = false;
  selectedProduct.value = null;
}

// 👇 Xử lý khi modal emit success
async function handleSendSuccess({ product, recipientAddress }) {
  try {
    // 0. Kiểm tra wallet đã kết nối chưa
    if (!currentAccount.value) {
      console.error("[FarmerView] Wallet not connected");
      alert("Vui lòng kết nối ví MetaMask trước khi thực hiện giao dịch.");
      return;
    }

    const contract = await getSignerContract();

    // 1. Đọc số lượng token farmer đang giữ
    const fromAddress = currentAccount.value;
    // ERC721: Check ownership
    const owner = await contract.ownerOf(product.id);
    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      console.error("[FarmerView] You don't own this batch");
      alert(`Bạn không sở hữu lô #${product.id}. Không thể chuyển giao.`);
      return;
    }

    // ERC721: transferFrom (no amount, no data)
    const tx = await contract.transferFrom(
      fromAddress,
      recipientAddress,
      product.id
    );

    console.log("[FarmerView] sending tx transferFrom:", tx.hash);
    await tx.wait();

    // 3. Cập nhật store (tắt auto-add event để tránh duplicate với blockchain event)
    const actor = fromAddress || "0xFARMER...DEMO";
    const timestamp = new Date().toISOString();

    productsStore.updateStatus(product.id, "IN_TRANSIT", {
      actor,
      locationHash: undefined,
      timestamp,
      currentHolderRole: "LOGISTICS",
      currentHolderAddress: recipientAddress,
      addEvent: false, // Tắt auto-add, để blockchain event tự add
    });

    // 4. Đóng modal
    closeSendModal();

    console.log("[FarmerView] Transfer to logistics success!");
  } catch (e) {
    console.error("[FarmerView] handleSendSuccess error:", e);
    // Lỗi sẽ được xử lý ở modal nếu cần
  }
}

// RECALLED (holder = FARMER) -> gửi về QUARANTINE_VAULT (on-chain)
async function sendFarmerRecalledToQuarantine(p) {
  if (!p || p.status !== "RECALLED" || p.currentHolderRole !== "FARMER") return;

  if (!currentAccount.value) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    console.log(
      `[FarmerView] Sending RECALLED product ${p.id} to QUARANTINE_VAULT`
    );

    const contract = await getSignerContract();
    const fromAddress = currentAccount.value;
    const QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD";

    // ERC721: Check ownership
    const owner = await contract.ownerOf(p.id);
    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      alert(`Bạn không sở hữu lô #${p.id}`);
      return;
    }

    // ERC721: Transfer to QUARANTINE_VAULT
    const tx = await contract.transferFrom(fromAddress, QUARANTINE_VAULT, p.id);

    console.log(`[FarmerView] Quarantine transaction sent:`, tx.hash);
    await tx.wait();
    console.log(
      `[FarmerView] ✅ Product ${p.id} sent to quarantine successfully`
    );

    // Update store
    const product = productsStore.getById(p.id);
    if (product) {
      product.currentHolderRole = "QUARANTINE";
      product.currentHolderAddress = QUARANTINE_VAULT;
      product.farmerQuarantineSent = true;
    }
  } catch (e) {
    console.error(`[FarmerView] sendFarmerRecalledToQuarantine error:`, e);
    alert(`Lỗi: ${e.message || "Không thể gửi về kho cách ly"}`);
  }
}
</script>
