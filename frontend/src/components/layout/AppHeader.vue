<template>
  <header class="border-b border-slate-200 bg-white/90 backdrop-blur">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <!-- Logo + tên app -->
      <div class="flex items-center gap-2">
        <div
          class="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm"
        >
          <span class="text-sm font-bold text-white">AG</span>
        </div>
        <div>
          <h1 class="text-sm font-semibold tracking-wide text-slate-900">
            AgriChain Tracker
          </h1>
          <p class="text-xs text-slate-500">
            Truy xuất nguồn gốc nông sản trên blockchain
          </p>
        </div>
      </div>

      <!-- Phần phải: nav + session -->
      <div class="flex items-center gap-6">
        <!-- Nav đơn giản theo role -->
        <nav class="hidden md:flex items-center gap-3 text-xs text-slate-700">
          <RouterLink to="/" class="hover:underline"> Trang chủ </RouterLink>
          <RouterLink
            v-if="roles.FARMER"
            :to="{ name: 'farmer' }"
            class="hover:underline"
          >
            Farmer
          </RouterLink>
          <RouterLink
            v-if="roles.INSPECTOR"
            :to="{ name: 'inspector' }"
            class="hover:underline"
          >
            Inspector
          </RouterLink>
          <RouterLink
            v-if="roles.LOGISTICS"
            :to="{ name: 'logistics' }"
            class="hover:underline"
          >
            Logistics
          </RouterLink>
          <RouterLink
            v-if="roles.RETAILER"
            :to="{ name: 'retailer' }"
            class="hover:underline"
          >
            Retailer
          </RouterLink>
          <RouterLink
            v-if="roles.ADMIN"
            :to="{ name: 'admin' }"
            class="hover:underline"
          >
            Admin
          </RouterLink>
        </nav>

        <!-- Session + nút connect -->
        <div class="flex items-center gap-3">
          <!-- Info role / account (ẩn bớt trên màn nhỏ) -->
          <div class="hidden sm:flex flex-col items-end text-xs">
            <p class="text-slate-500 flex items-center gap-1">
              <span
                class="inline-flex h-2 w-2 rounded-full"
                :class="isConnected ? 'bg-emerald-500' : 'bg-slate-300'"
              />
              <span>
                {{ isConnected ? "Đã kết nối MetaMask" : "Chưa kết nối ví" }}
              </span>
            </p>
            <p class="text-slate-700 font-medium">
              {{ currentRoleLabel }}
            </p>
            <p
              v-if="currentAccount"
              class="font-mono text-[10px] text-slate-500"
            >
              {{ shortAddress(currentAccount) }}
            </p>
          </div>

          <!-- Nút connect + logout -->
          <div class="flex flex-col items-end gap-1">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-emerald-500/80 bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition disabled:opacity-60"
                :disabled="loadingWallet"
                @click="onConnect"
              >
                <span class="h-2 w-2 rounded-full bg-white/80" />
                <span>
                  {{
                    loadingWallet
                      ? "Đang kết nối..."
                      : isConnected
                      ? "Kết nối lại MetaMask"
                      : "Kết nối MetaMask"
                  }}
                </span>
              </button>

              <!-- Nút logout chỉ hiện khi đã kết nối -->
              <button
                v-if="isConnected"
                type="button"
                class="text-[11px] text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
                @click="onLogout"
              >
                Đăng xuất
              </button>
            </div>

            <p
              v-if="walletError"
              class="text-[10px] text-red-500 max-w-xs text-right"
            >
              {{ walletError }}
            </p>

            <!-- Warning: không có role -->
            <p
              v-if="isConnected && !hasAnyRole"
              class="text-[10px] text-amber-600 max-w-xs text-right font-medium"
            >
              Tài khoản hiện tại không có quyền để thao tác trên hệ thống
            </p>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useSessionStore } from "../../stores/useSessionStore";
import router from "../../router";

const session = useSessionStore();
const isConnected = computed(() => session.isConnected);
const currentAccount = computed(() => session.currentAccount);
const roles = computed(() => session.roles);
const loadingWallet = computed(() => session.loadingWallet);
const walletError = computed(() => session.walletError);
const hasAnyRole = computed(() => session.hasAnyRole);

// Hiển thị role label
const currentRoleLabel = computed(() => {
  if (!isConnected.value) return "Chưa kết nối";

  const roleLabels = [];
  if (roles.value.ADMIN) roleLabels.push("Admin");
  if (roles.value.FARMER) roleLabels.push("Farmer");
  if (roles.value.INSPECTOR) roleLabels.push("Inspector");
  if (roles.value.LOGISTICS) roleLabels.push("Logistics");
  if (roles.value.RETAILER) roleLabels.push("Retailer");

  if (roleLabels.length === 0) return "Không có quyền";
  if (roleLabels.length === 1) return roleLabels[0];
  return roleLabels.join(", ");
});

function onConnect() {
  session.connectWallet();
}

function onLogout() {
  session.logout();
  router.push({ name: "home" });
}

function shortAddress(addr) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
</script>
