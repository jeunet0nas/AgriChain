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
import { useProductFilters } from "../composables/useProductFilters";
import { useTokenTransfer } from "../composables/useTokenTransfer";
import RoleProductTable from "../components/role/RoleProductTable.vue";
import FarmerCreateBatchForm from "../components/farmer/FarmerCreateBatchForm.vue";
import SendProductModal from "../components/shared/SendProductModal.vue";

const productsStore = useProductsStore();
const session = useSessionStore();

// Use composables for cleaner code
const { filterByStatus, filterByStatuses, recalledProductsToQuarantine } =
  useProductFilters();
const { transferToken, sendToQuarantine } = useTokenTransfer();

const roles = computed(() => session.roles);
const currentAccount = computed(() => session.currentAccount);

// Modal state
const showSendModal = ref(false);
const selectedProduct = ref(null);

// Helper constants
const LOGISTICS_ROLE = ethers.id("LOGISTICS_ROLE");

// Filtered products using composables
const farmerProducts = filterByStatuses(["HARVESTED", "INSPECTING"]);
const farmerInspectingProducts = filterByStatus("INSPECTING");
const recalledFarmerProducts = recalledProductsToQuarantine;

// Modal handlers
function openSendModal(product) {
  selectedProduct.value = product;
  showSendModal.value = true;
}

function closeSendModal() {
  showSendModal.value = false;
  selectedProduct.value = null;
}

// Handle successful transfer to logistics
async function handleSendSuccess({ product, recipientAddress }) {
  try {
    await transferToken(product, recipientAddress, "IN_TRANSIT", "LOGISTICS");
    closeSendModal();
    console.log("[FarmerView] Transfer to logistics success!");
  } catch (error) {
    console.error("[FarmerView] Transfer failed:", error);
    alert(`Lỗi: ${error.message}`);
  }
}

// Send RECALLED product to QUARANTINE_VAULT
async function sendFarmerRecalledToQuarantine(product) {
  if (!product || product.status !== "RECALLED") return;

  if (!currentAccount.value) {
    alert("Vui lòng kết nối ví MetaMask.");
    return;
  }

  try {
    await sendToQuarantine(product);
    console.log(`[FarmerView] ✅ Product ${product.id} sent to quarantine`);
  } catch (error) {
    console.error("[FarmerView] Quarantine transfer failed:", error);
    alert(`Lỗi: ${error.message || "Không thể gửi về kho cách ly"}`);
  }
}
</script>
