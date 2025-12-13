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
      title="Lô đã giao cho nhà bán lẻ"
      subtitle="Đã nhận được"
      empty-message="Bạn chưa sở hữu lô nào ở trạng thái DELIVERED."
    >
      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
          @click="handleMarkAsRetailed(product)"
        >
          Đánh dấu đang bán
        </button>
      </template>
    </RoleProductTable>

    <!-- Lô đang bán lẻ (RETAILED) -->
    <RoleProductTable
      :products="retailedProducts"
      title="Lô đang bán lẻ"
      subtitle="Đang bán"
      empty-message="Bạn chưa sở hữu lô nào đang bán lẻ."
    >
      <template #actions="{ product }">
        <button
          type="button"
          class="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
          @click="handleMarkAsConsumed(product)"
        >
          Đánh dấu đã tiêu thụ (on-chain)
        </button>
      </template>
    </RoleProductTable>

    <!-- Lô đã tiêu thụ (CONSUMED) -->
    <RoleProductTable
      :products="consumedProducts"
      title="Lô đã tiêu thụ"
      subtitle="Đã tiêu thụ"
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
      title="Lô bị thu hồi"
      subtitle="Đang bị thu hồi, chờ gửi đi"
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
          @click="sendRetailerToQuarantine(product)"
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
import { useProductFilters } from "../composables/useProductFilters";
import { useRetailerActions } from "../composables/useRetailerActions";
import { useQuarantineTransfer } from "../composables/useQuarantineTransfer";
import RoleProductTable from "../components/role/RoleProductTable.vue";

const productsStore = useProductsStore();
const sessionStore = useSessionStore();

// Use composables
const { myProducts } = useProductFilters();
const {
  markAsRetailed,
  markAsConsumed,
  archiveProduct: archiveProductAction,
} = useRetailerActions();
const { sendToQuarantine } = useQuarantineTransfer();

// Product filters - lọc lô do Retailer đang giữ
const deliveredProducts = computed(() =>
  myProducts.value.filter((p) => p.status === "DELIVERED")
);

const retailedProducts = computed(() =>
  myProducts.value.filter((p) => p.status === "RETAILED")
);

const consumedProducts = computed(() =>
  myProducts.value.filter((p) => p.status === "CONSUMED")
);

const recalledOwnedProducts = computed(() =>
  myProducts.value.filter((p) => p.status === "RECALLED")
);

// Action handlers
async function handleMarkAsRetailed(product) {
  await markAsRetailed(product);
}

async function handleMarkAsConsumed(product) {
  await markAsConsumed(product);
}

async function archiveProduct(product) {
  await archiveProductAction(product);
}

async function sendRetailerToQuarantine(product) {
  await sendToQuarantine(product, "quarantineSent");
}
</script>
