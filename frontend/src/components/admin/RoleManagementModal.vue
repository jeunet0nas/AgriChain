<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
        @click.self="$emit('close')"
      >
        <div
          class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          @click.stop
        >
          <!-- Header -->
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">
                Quản lý vai trò (Role)
              </h3>
              <p class="mt-1 text-xs text-slate-600">
                Cấp hoặc thu hồi quyền cho địa chỉ ví trên blockchain
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

          <!-- Action selector -->
          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-slate-700">
              Hành động
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                :class="{
                  'border-emerald-500 bg-emerald-50 text-emerald-700':
                    action === 'grant',
                  'border-slate-200 bg-white text-slate-700 hover:bg-slate-50':
                    action !== 'grant',
                }"
                @click="action = 'grant'"
              >
                ✅ Cấp quyền
              </button>
              <button
                type="button"
                class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                :class="{
                  'border-red-500 bg-red-50 text-red-700': action === 'revoke',
                  'border-slate-200 bg-white text-slate-700 hover:bg-slate-50':
                    action !== 'revoke',
                }"
                @click="action = 'revoke'"
              >
                ❌ Thu hồi quyền
              </button>
            </div>
          </div>

          <!-- Address input -->
          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-slate-700">
              Địa chỉ ví <span class="text-red-500">*</span>
            </label>
            <input
              v-model="address"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="0x..."
            />
            <p class="mt-1 text-xs text-slate-500">
              Nhập địa chỉ Ethereum (42 ký tự bắt đầu bằng 0x)
            </p>
          </div>

          <!-- Role selector -->
          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-slate-700">
              Vai trò (Role) <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="roleOption in roleOptions"
                :key="roleOption.value"
                type="button"
                class="rounded-lg border px-3 py-2 text-left text-xs transition-colors"
                :class="{
                  'border-blue-500 bg-blue-50':
                    selectedRole === roleOption.value,
                  'border-slate-200 bg-white hover:bg-slate-50':
                    selectedRole !== roleOption.value,
                }"
                @click="selectedRole = roleOption.value"
              >
                <div class="font-medium" :class="roleOption.color">
                  {{ roleOption.label }}
                </div>
                <div class="mt-0.5 text-slate-500">
                  {{ roleOption.description }}
                </div>
              </button>
            </div>
            <p class="mt-2 text-xs text-amber-600">
              ⚠️ Lưu ý: Mỗi địa chỉ chỉ nên có 1 vai trò để tránh xung đột
              nghiệp vụ.
            </p>
          </div>

          <!-- Current roles display -->
          <div
            v-if="currentRoles.length > 0"
            class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3"
          >
            <div class="mb-1 text-xs font-medium text-blue-900">
              Vai trò hiện tại của địa chỉ này:
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="role in currentRoles"
                :key="role"
                class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800"
              >
                {{ getRoleLabel(role) }}
              </span>
            </div>
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
              Đóng
            </button>
            <button
              v-if="!isValidAddress"
              type="button"
              class="flex-1 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!address || isProcessing"
              @click="checkCurrentRoles"
            >
              <span v-if="isProcessing">Đang kiểm tra...</span>
              <span v-else>Kiểm tra vai trò</span>
            </button>
            <button
              v-else
              type="button"
              class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              :class="{
                'border-emerald-600 bg-emerald-600 hover:bg-emerald-700':
                  action === 'grant',
                'border-red-600 bg-red-600 hover:bg-red-700':
                  action === 'revoke',
              }"
              :disabled="isProcessing || !selectedRole"
              @click="handleSubmit"
            >
              <span v-if="isProcessing">Đang xử lý...</span>
              <span v-else-if="action === 'grant'">Xác nhận cấp quyền</span>
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
import {
  getSignerContract,
  getReadOnlyContract,
} from "../../web3/contractClient";
import { useSessionStore } from "../../stores/useSessionStore";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close", "success"]);

const sessionStore = useSessionStore();

const action = ref("grant"); // 'grant' or 'revoke'
const address = ref("");
const selectedRole = ref("");
const currentRoles = ref([]);
const isValidAddress = ref(false);
const isProcessing = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const roleOptions = [
  {
    value: "FARMER",
    label: "FARMER",
    description: "Nông dân",
    color: "text-emerald-700",
  },
  {
    value: "INSPECTOR",
    label: "INSPECTOR",
    description: "Kiểm định viên",
    color: "text-blue-700",
  },
  {
    value: "LOGISTICS",
    label: "LOGISTICS",
    description: "Vận chuyển",
    color: "text-purple-700",
  },
  {
    value: "RETAILER",
    label: "RETAILER",
    description: "Nhà bán lẻ",
    color: "text-orange-700",
  },
];

// Reset form khi modal đóng/mở
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      action.value = "grant";
      address.value = "";
      selectedRole.value = "";
      currentRoles.value = [];
      isValidAddress.value = false;
      errorMessage.value = "";
      successMessage.value = "";
      isProcessing.value = false;
    }
  }
);

function getRoleLabel(roleKey) {
  const role = roleOptions.find((r) => r.value === roleKey);
  return role ? role.label : roleKey;
}

async function checkCurrentRoles() {
  if (!address.value) {
    errorMessage.value = "Vui lòng nhập địa chỉ ví.";
    return;
  }

  // Validate address format
  if (!ethers.isAddress(address.value)) {
    errorMessage.value =
      "Địa chỉ ví không hợp lệ. Phải là địa chỉ Ethereum (0x...).";
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";
  isProcessing.value = true;

  try {
    console.log(
      `[RoleManagement] Checking roles for address: ${address.value}`
    );

    const contract = getReadOnlyContract();

    // Get role hashes
    const FARMER_ROLE = await contract.get_FARMER_ROLE();
    const INSPECTOR_ROLE = await contract.get_INSPECTOR_ROLE();
    const LOGISTICS_ROLE = await contract.get_LOGISTICS_ROLE();
    const RETAILER_ROLE = await contract.get_RETAILER_ROLE();

    const roles = [];

    // Check each role
    if (await contract.hasRole(FARMER_ROLE, address.value)) {
      roles.push("FARMER");
    }
    if (await contract.hasRole(INSPECTOR_ROLE, address.value)) {
      roles.push("INSPECTOR");
    }
    if (await contract.hasRole(LOGISTICS_ROLE, address.value)) {
      roles.push("LOGISTICS");
    }
    if (await contract.hasRole(RETAILER_ROLE, address.value)) {
      roles.push("RETAILER");
    }

    currentRoles.value = roles;
    isValidAddress.value = true;

    console.log(`[RoleManagement] Current roles:`, roles);

    if (roles.length === 0) {
      successMessage.value = "Địa chỉ này chưa có vai trò nào.";
    } else {
      successMessage.value = `Địa chỉ có ${roles.length} vai trò.`;
    }
  } catch (e) {
    console.error(`[RoleManagement] checkCurrentRoles error:`, e);
    errorMessage.value = `Lỗi: ${e.message || "Không thể kiểm tra vai trò"}`;
  } finally {
    isProcessing.value = false;
  }
}

async function handleSubmit() {
  if (!selectedRole.value) {
    errorMessage.value = "Vui lòng chọn vai trò.";
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
    console.log(
      `[RoleManagement] ${action.value} ${selectedRole.value} for ${address.value}`
    );

    const contract = await getSignerContract();

    // Get role hash
    let roleHash;
    switch (selectedRole.value) {
      case "FARMER":
        roleHash = await contract.get_FARMER_ROLE();
        break;
      case "INSPECTOR":
        roleHash = await contract.get_INSPECTOR_ROLE();
        break;
      case "LOGISTICS":
        roleHash = await contract.get_LOGISTICS_ROLE();
        break;
      case "RETAILER":
        roleHash = await contract.get_RETAILER_ROLE();
        break;
      default:
        throw new Error("Invalid role");
    }

    console.log(`[RoleManagement] Role hash:`, roleHash);

    // Call contract
    let tx;
    if (action.value === "grant") {
      tx = await contract.grantRole(roleHash, address.value);
    } else {
      tx = await contract.revokeRole(roleHash, address.value);
    }

    console.log(`[RoleManagement] Transaction sent:`, tx.hash);
    successMessage.value = "Đang chờ xác nhận giao dịch...";

    await tx.wait();
    console.log(`[RoleManagement] ✅ Transaction confirmed`);

    successMessage.value =
      action.value === "grant"
        ? `Đã cấp quyền ${selectedRole.value} thành công!`
        : `Đã thu hồi quyền ${selectedRole.value} thành công!`;

    // Emit success event
    emit("success", {
      action: action.value,
      role: selectedRole.value,
      address: address.value,
      txHash: tx.hash,
    });

    // Reset và refresh roles sau 1.5s
    setTimeout(() => {
      isValidAddress.value = false;
      currentRoles.value = [];
      checkCurrentRoles();
    }, 1500);
  } catch (e) {
    console.error(`[RoleManagement] handleSubmit error:`, e);

    if (e.code === "ACTION_REJECTED") {
      errorMessage.value = "Giao dịch bị từ chối bởi người dùng.";
    } else if (e.message?.includes("Missing required role")) {
      errorMessage.value =
        "Bạn không có quyền ADMIN để thực hiện thao tác này.";
    } else {
      errorMessage.value = `Lỗi: ${
        e.message || "Không thể thực hiện thao tác"
      }`;
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
