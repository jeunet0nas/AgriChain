<template>
  <section class="space-y-8">
    <!-- Hero -->
    <div class="space-y-3">
      <h2 class="text-2xl font-semibold tracking-tight text-slate-900">
        Tra cứu nguồn gốc nông sản
      </h2>
      <p class="text-sm text-slate-600 max-w-xl">
        Nhập mã lô / ID sản phẩm được in trên bao bì để xem thông tin nguồn gốc,
        trạng thái vận hành và tài nguyên chứng nhận được lưu trữ trên IPFS.
      </p>
    </div>

    <!-- Card tra cứu -->
    <div
      class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
    >
      <form
        @submit.prevent="onSearch"
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div class="flex-1">
          <label
            class="block text-xs font-medium text-slate-600 mb-1"
            for="tracking-id"
          >
            Mã lô / Product ID
          </label>
          <input
            id="tracking-id"
            v-model="inputId"
            type="text"
            placeholder="Ví dụ: 1, 2, 1001..."
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition"
        >
          Tra cứu
        </button>
      </form>

      <p v-if="errorMessage" class="text-xs text-red-500">
        {{ errorMessage }}
      </p>
    </div>

    <!-- Thông tin thêm -->
    <div class="grid gap-4 sm:grid-cols-3 text-xs">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-1 text-sm">
          Người tiêu dùng
        </h3>
        <p class="text-slate-600">
          Chỉ cần nhập mã lô để xem nguồn gốc, trạng thái và chứng nhận của sản
          phẩm bạn đang sử dụng.
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-1 text-sm">
          Chuỗi cung ứng
        </h3>
        <p class="text-slate-600">
          Nông dân, kiểm định, logistics, nhà bán lẻ đăng nhập bằng MetaMask để
          cập nhật trạng thái.
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="font-semibold text-slate-800 mb-1 text-sm">
          Blockchain & IPFS
        </h3>
        <p class="text-slate-600">
          Thông tin trạng thái lưu trên blockchain, tài nguyên chứng nhận lưu
          trên IPFS và được liên kết qua metadata.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useProductsStore } from "../stores/useProductsStore";

const router = useRouter();
const { exists } = useProductsStore();
const inputId = ref("");
const errorMessage = ref("");

function onSearch() {
  errorMessage.value = "";

  const idNum = Number(inputId.value);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    errorMessage.value = "Vui lòng nhập ID là số nguyên dương.";
    return;
  }

  // Dùng store để kiểm tra tồn tại
  if (!exists(idNum)) {
    errorMessage.value = `Không tìm thấy lô hàng với ID ${idNum} trên hệ thống!`;
    return;
  }

  router.push({ name: "track", params: { id: idNum } });
}
</script>
