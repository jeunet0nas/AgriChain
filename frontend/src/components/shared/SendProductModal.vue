<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <!-- Modal -->
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 relative"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">
              {{ title }}
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              {{ description }}
            </p>
          </div>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600 transition"
            @click="closeModal"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Product Info -->
        <div
          class="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1"
        >
          <p class="text-xs text-slate-500">Lô sản phẩm</p>
          <p class="text-sm font-semibold text-slate-900">
            {{ product?.name || "Không có tên" }}
          </p>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100"
            >
              ID #{{ product?.id }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100"
            >
              {{ product?.status }}
            </span>
          </div>
        </div>

        <!-- Input địa chỉ đích -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-slate-700">
            {{ addressLabel }}
          </label>
          <div class="flex gap-2">
            <input
              v-model="recipientAddress"
              type="text"
              placeholder="0x... (42 ký tự)"
              class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              :disabled="checking || sending"
            />
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              :disabled="checking || sending || !recipientAddress.trim()"
              @click="checkRole"
            >
              <span v-if="checking">Đang kiểm tra...</span>
              <span v-else>Kiểm tra</span>
            </button>
          </div>

          <!-- Status messages -->
          <p v-if="errorMessage" class="text-xs text-red-500">
            {{ errorMessage }}
          </p>
          <p v-else-if="roleChecked" class="text-xs text-emerald-600">
            ✓ {{ successMessage }}
          </p>
          <p v-else class="text-xs text-slate-400">
            {{ hintMessage }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-2">
          <button
            type="button"
            class="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            :disabled="sending"
            @click="closeModal"
          >
            Hủy
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            :disabled="!roleChecked || sending"
            @click="confirmSend"
          >
            <span v-if="sending">Đang gửi giao dịch...</span>
            <span v-else>Xác nhận gửi (on-chain)</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { ethers } from "ethers";
import { getSignerContract } from "../../web3/contractClient";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  product: {
    type: Object,
    default: null,
  },
  // 👇 Props tùy chỉnh cho từng role
  targetRole: {
    type: String,
    required: true,
    validator: (value) => ["LOGISTICS", "RETAILER"].includes(value),
  },
  title: {
    type: String,
    default: "Gửi lô sản phẩm",
  },
  description: {
    type: String,
    default: "Chuyển quyền sở hữu lô sản phẩm trên blockchain",
  },
  addressLabel: {
    type: String,
    default: null,
  },
  successMessage: {
    type: String,
    default: null,
  },
  hintMessage: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["close", "success"]);

// State
const recipientAddress = ref("");
const checking = ref(false);
const sending = ref(false);
const roleChecked = ref(false);
const errorMessage = ref("");

// Computed role constant
const ROLE_HASH = computed(() => {
  if (props.targetRole === "LOGISTICS") {
    return ethers.id("LOGISTICS_ROLE");
  } else if (props.targetRole === "RETAILER") {
    return ethers.id("RETAILER_ROLE");
  }
  return null;
});

// Computed messages với defaults
const computedAddressLabel = computed(
  () => props.addressLabel || `Địa chỉ ví ${props.targetRole}`
);

const computedSuccessMessage = computed(
  () =>
    props.successMessage ||
    `Địa chỉ này đã có ${props.targetRole}_ROLE. Bạn có thể gửi lô này.`
);

const computedHintMessage = computed(
  () =>
    props.hintMessage ||
    `Nhập địa chỉ và nhấn "Kiểm tra" để xác minh quyền ${props.targetRole.toLowerCase()}.`
);

// Helper
function isValidAddress(addr) {
  return (
    typeof addr === "string" && addr.startsWith("0x") && addr.length === 42
  );
}

// Reset khi modal đóng/mở
watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      recipientAddress.value = "";
      roleChecked.value = false;
      errorMessage.value = "";
      checking.value = false;
      sending.value = false;
    }
  }
);

// Kiểm tra role
async function checkRole() {
  errorMessage.value = "";
  roleChecked.value = false;

  const addr = recipientAddress.value.trim();
  if (!isValidAddress(addr)) {
    errorMessage.value =
      "Địa chỉ không hợp lệ. Vui lòng nhập dạng 0x... (42 ký tự).";
    return;
  }

  try {
    checking.value = true;
    const contract = await getSignerContract();
    const hasRole = await contract.hasRole(ROLE_HASH.value, addr);

    if (!hasRole) {
      errorMessage.value = `Địa chỉ này chưa được cấp ${props.targetRole}_ROLE trên smart contract.`;
      roleChecked.value = false;
    } else {
      roleChecked.value = true;
    }
  } catch (e) {
    console.error("[SendProductModal] checkRole error:", e);
    errorMessage.value = "Không thể kiểm tra role. Vui lòng thử lại.";
    roleChecked.value = false;
  } finally {
    checking.value = false;
  }
}

// Xác nhận gửi
async function confirmSend() {
  if (!props.product || !roleChecked.value) return;

  errorMessage.value = "";

  try {
    sending.value = true;

    const addr = recipientAddress.value.trim();

    // Emit success với địa chỉ người nhận để parent xử lý
    emit("success", {
      product: props.product,
      recipientAddress: addr,
      targetRole: props.targetRole,
    });
  } catch (e) {
    console.error("[SendProductModal] confirmSend error:", e);
    errorMessage.value = "Đã xảy ra lỗi. Vui lòng thử lại.";
  } finally {
    sending.value = false;
  }
}

// Đóng modal
function closeModal() {
  if (!sending.value) {
    emit("close");
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
