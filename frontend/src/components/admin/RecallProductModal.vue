<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
        @click.self="$emit('close')"
      >
        <div
          class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          @click.stop
        >
          <!-- Header -->
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">
                Thu hồi sản phẩm
              </h3>
              <p class="mt-1 text-xs text-slate-600">
                Đánh dấu lô này là RECALLED trên blockchain
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              @click="$emit('close')"
            >
              <svg
                class="h-5 w-5"
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

          <!-- Product info -->
          <div
            v-if="product"
            class="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <div class="text-xs text-slate-600">Lô sản phẩm</div>
            <div class="mt-1 font-medium text-slate-900">
              {{ product.name }} (ID: {{ product.id }})
            </div>
            <div class="mt-1 text-xs text-slate-500">
              Trạng thái hiện tại: <strong>{{ product.status }}</strong>
            </div>
          </div>

          <!-- Reason input -->
          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-slate-700">
              Lý do thu hồi <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="reason"
              rows="3"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              placeholder="Ví dụ: Phát hiện dư lượng hóa chất vượt ngưỡng cho phép"
            />
            <p class="mt-1 text-xs text-slate-500">
              Lý do này sẽ được mã hóa thành reasonHash và ghi trên blockchain.
            </p>
          </div>

          <!-- Error message -->
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            {{ errorMessage }}
          </div>

          <!-- Success message -->
          <div
            v-if="successMessage"
            class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"
          >
            {{ successMessage }}
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isProcessing"
              @click="$emit('close')"
            >
              Hủy
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isProcessing || !reason.trim()"
              @click="handleRecall"
            >
              <span v-if="isProcessing">Đang xử lý...</span>
              <span v-else>Xác nhận thu hồi</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
import { ethers } from "ethers";
import { getSignerContract } from "../../web3/contractClient";
import { useSessionStore } from "../../stores/useSessionStore";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  product: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "success"]);

const sessionStore = useSessionStore();

const reason = ref("");
const isProcessing = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Reset form khi modal đóng/mở
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      reason.value = "";
      errorMessage.value = "";
      successMessage.value = "";
      isProcessing.value = false;
    }
  }
);

async function handleRecall() {
  if (!props.product) return;
  if (!reason.value.trim()) {
    errorMessage.value = "Vui lòng nhập lý do thu hồi.";
    return;
  }

  if (!sessionStore.currentAccount) {
    errorMessage.value = "Vui lòng kết nối ví MetaMask.";
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";
  isProcessing.value = true;

  try {
    console.log(`[RecallModal] Recalling product ${props.product.id}`);

    const contract = await getSignerContract();

    // Convert reason to bytes32 hash
    const reasonHash = ethers.keccak256(
      ethers.toUtf8Bytes(reason.value.trim())
    );

    console.log(`[RecallModal] Reason: "${reason.value}"`);
    console.log(`[RecallModal] ReasonHash: ${reasonHash}`);

    // ERC721: Call markBatchRecalled on-chain
    const tx = await contract.markBatchRecalled(props.product.id, reasonHash);
    console.log(`[RecallModal] Transaction sent:`, tx.hash);

    successMessage.value = "Đang chờ xác nhận giao dịch...";

    await tx.wait();
    console.log(
      `[RecallModal] ✅ Product ${props.product.id} recalled successfully`
    );

    successMessage.value = "Thu hồi thành công!";

    // Emit success event
    emit("success", {
      product: props.product,
      reason: reason.value,
      reasonHash,
      txHash: tx.hash,
    });

    // Đóng modal sau 1.5s
    setTimeout(() => {
      emit("close");
    }, 1500);
  } catch (e) {
    console.error(`[RecallModal] handleRecall error:`, e);

    if (e.code === "ACTION_REJECTED") {
      errorMessage.value = "Giao dịch bị từ chối bởi người dùng.";
    } else if (e.message?.includes("Already recalled")) {
      errorMessage.value = "Lô này đã được thu hồi trước đó.";
    } else if (e.message?.includes("Can not recall consumed token")) {
      errorMessage.value = "Không thể thu hồi lô đã tiêu thụ (CONSUMED).";
    } else {
      errorMessage.value = `Lỗi: ${e.message || "Không thể thu hồi sản phẩm"}`;
    }
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .rounded-2xl,
.modal-leave-active .rounded-2xl {
  transition: transform 0.2s ease;
}

.modal-enter-from .rounded-2xl,
.modal-leave-to .rounded-2xl {
  transform: scale(0.95);
}
</style>
