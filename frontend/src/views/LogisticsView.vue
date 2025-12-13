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
      title="Lô bị thu hồi đang giữ"
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
          <span v-else> Gửi về kho cách ly </span>
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
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import { useProductFilters } from "../composables/useProductFilters";
import { useTokenTransfer } from "../composables/useTokenTransfer";
import { useQuarantineTransfer } from "../composables/useQuarantineTransfer";
import RoleProductTable from "../components/role/RoleProductTable.vue";
import SendProductModal from "../components/shared/SendProductModal.vue";

const productsStore = useProductsStore();
const sessionStore = useSessionStore();

// Use composables
const { myProducts } = useProductFilters();
const { transferToken } = useTokenTransfer();
const { sendToQuarantine } = useQuarantineTransfer();

// Modal state
const showDeliverModal = ref(false);
const selectedProduct = ref(null);

// Product filters - lọc lô do Logistics đang giữ
const transitProducts = computed(() =>
  myProducts.value.filter((p) => p.status === "IN_TRANSIT")
);

const recalledLogisticsProducts = computed(() =>
  myProducts.value.filter((p) => p.status === "RECALLED")
);

// Modal handlers
function openDeliverModal(product) {
  selectedProduct.value = product;
  showDeliverModal.value = true;
}

function closeDeliverModal() {
  showDeliverModal.value = false;
  selectedProduct.value = null;
}

// Handle transfer to retailer
async function handleDeliverSuccess({ product, recipientAddress }) {
  try {
    await transferToken(product, recipientAddress, "DELIVERED", "RETAILER");
    closeDeliverModal();
  } catch (error) {
    console.error("[LogisticsView] Transfer to retailer failed:", error);
  }
}

// Send recalled product to quarantine
async function sendLogisticsRecalledToQuarantine(product) {
  await sendToQuarantine(product, "logisticsQuarantineSent");
}
</script>
