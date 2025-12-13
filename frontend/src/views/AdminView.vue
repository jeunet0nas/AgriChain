<template>
  <section class="space-y-6">
    <!-- Nếu không có quyền Admin -->
    <div
      v-if="!roles.ADMIN"
      class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800"
    >
      Bạn chưa có quyền truy cập vai trò <strong>Admin</strong>. Hãy kết nối ví
      có role phù hợp hoặc nhờ Admin cấp quyền.
    </div>

    <!-- Nội dung chính cho Admin -->
    <div v-else class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-900">
          Bảng điều khiển Quản trị (Admin)
        </h2>
        <p class="text-sm text-slate-600 max-w-2xl">
          Giám sát toàn bộ hệ thống, thực hiện thu hồi lô hàng khi phát hiện vấn
          đề, và quản lý phân quyền vai trò cho các địa chỉ ví.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button
          type="button"
          class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          @click="openRoleManagementModal"
        >
          🔑 Quản lý vai trò (Roles)
        </button>
      </div>

      <!-- Lô có thể thu hồi -->
      <RoleProductTable
        :products="recallableProducts"
        title="Lô có thể thu hồi"
        subtitle="Chọn lô hàng thu hồi"
        empty-message="Hiện chưa có lô nào phù hợp điều kiện thu hồi."
      >
        <template #actions="{ product }">
          <button
            type="button"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 hover:bg-red-100"
            @click="openRecallModal(product)"
          >
            Thu hồi (on-chain)
          </button>
        </template>
      </RoleProductTable>

      <!-- Lô đã thu hồi -->
      <RoleProductTable
        :products="recalledProducts"
        title="Lô đã thu hồi (RECALLED)"
        empty-message="Chưa có lô nào ở trạng thái RECALLED."
      >
        <template #extraColHeader> Người giữ hiện tại </template>

        <template #extraCol="{ product }">
          <div class="text-xs">
            <div
              v-if="product.currentHolderAddress"
              class="font-medium text-slate-700"
            >
              {{ formatAddress(product.currentHolderAddress) }}
            </div>
            <div v-if="product.currentHolderRole" class="text-slate-500 mt-0.5">
              {{ product.currentHolderRole }}
            </div>
          </div>
        </template>

        <template #actions="{ product }">
          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-60"
            :class="{
              'border-emerald-200 bg-emerald-50 text-emerald-700':
                product.currentHolderRole === 'QUARANTINE',
              'border-amber-200 bg-amber-50 text-amber-700':
                product.currentHolderRole !== 'QUARANTINE',
            }"
            disabled
          >
            <span v-if="product.currentHolderRole === 'QUARANTINE'">
              Đã gửi về kho
            </span>
            <span v-else-if="product.currentHolderRole === 'FARMER'">
              Chờ Farmer gửi về kho
            </span>
            <span v-else-if="product.currentHolderRole === 'LOGISTICS'">
              Chờ Logistics gửi về
            </span>
            <span v-else-if="product.currentHolderRole === 'RETAILER'">
              Chờ Retailer gửi về
            </span>
            <span v-else> Chờ holder gửi về kho </span>
          </button>
        </template>
      </RoleProductTable>
    </div>

    <!-- Modal thu hồi -->
    <RecallProductModal
      :is-open="showRecallModal"
      :product="selectedProduct"
      @close="closeRecallModal"
      @success="handleRecallSuccess"
    />

    <!-- Modal quản lý vai trò -->
    <RoleManagementModal
      :is-open="showRoleManagementModal"
      @close="closeRoleManagementModal"
      @success="handleRoleManagementSuccess"
    />
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import RoleProductTable from "../components/role/RoleProductTable.vue";
import RecallProductModal from "../components/admin/RecallProductModal.vue";
import RoleManagementModal from "../components/admin/RoleManagementModal.vue";

const productsStore = useProductsStore();
const sessionStore = useSessionStore();

const roles = computed(() => sessionStore.roles);

const { products, updateStatus } = productsStore;

const showRecallModal = ref(false);
const selectedProduct = ref(null);

const showRoleManagementModal = ref(false);

const recalledProducts = computed(() =>
  products.filter((p) => p.status === "RECALLED")
);

const recallableProducts = computed(() =>
  products.filter((p) => p.status !== "CONSUMED" && p.status !== "RECALLED")
);

function openRecallModal(product) {
  selectedProduct.value = product;
  showRecallModal.value = true;
}

function closeRecallModal() {
  showRecallModal.value = false;
  selectedProduct.value = null;
}

function handleRecallSuccess({ product, reasonHash }) {
  console.log(`[AdminView] Product ${product.id} recalled successfully`);
  console.log(`[AdminView] ReasonHash: ${reasonHash}`);

  // Blockchain event sẽ tự sync, chỉ update store để UI phản hồi nhanh
  updateStatus(product.id, "RECALLED", {
    actor: sessionStore.currentAccount,
    locationHash: reasonHash,
    timestamp: new Date().toISOString(),
    addEvent: false, // Blockchain event sẽ tự add
  });
}

function openRoleManagementModal() {
  showRoleManagementModal.value = true;
}

function closeRoleManagementModal() {
  showRoleManagementModal.value = false;
}

function handleRoleManagementSuccess({ action, role, address, txHash }) {
  console.log(`[AdminView] Role management success:`, {
    action,
    role,
    address,
    txHash,
  });
  // Có thể reload roles nếu cần
}

// Helper để format địa chỉ
function formatAddress(address) {
  if (!address) return "N/A";
  // ERC721 compliance: ARCHIVE_VAULT address
  if (address === "0x000000000000000000000000000000000000aaaa")
    return "ARCHIVE_VAULT";
  if (address === "0x000000000000000000000000000000000000dEaD")
    return "QUARANTINE_VAULT";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
</script>
