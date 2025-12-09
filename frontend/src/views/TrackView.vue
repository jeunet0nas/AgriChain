<template>
  <div>
    <section v-if="product" class="space-y-6">
      <!-- Top bar: thông tin + ô tra cứu ID khác -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="space-y-3 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-slate-500">Product ID</span>
            <span
              class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-900"
            >
              #{{ product.id }}
            </span>
          </div>

          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-900 mb-1">
              {{ product.name }}
            </h2>
            <p
              v-if="product.description"
              class="text-sm text-slate-600 max-w-2xl"
            >
              {{ product.description }}
            </p>
          </div>

          <!-- Status & Holder Info Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Status Card -->
            <div
              class="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3"
            >
              <p class="text-xs font-medium text-slate-500 mb-2">
                Trạng thái hiện tại
              </p>
              <ProductStatusBadge :status="product.status" class="text-sm" />
            </div>

            <!-- Holder Card -->
            <div
              class="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-3"
            >
              <p class="text-xs font-medium text-slate-500 mb-2">
                Đang giữ bởi
              </p>
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'flex items-center justify-center rounded-lg p-1.5',
                    getRoleColor(product.currentHolderRole),
                  ]"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-slate-900">
                    {{ getRoleLabel(product.currentHolderRole) }}
                  </p>
                  <p class="font-mono text-[10px] text-slate-600 truncate">
                    {{
                      formatAddress(
                        product.currentHolderAddress || "Chưa xác định"
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Details Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Product Type -->
            <div
              v-if="product.metadata?.productType"
              class="flex items-start gap-2 text-xs text-slate-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200"
            >
              <svg
                class="h-4 w-4 text-emerald-500 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <div>
                <span class="font-medium">Loại:</span>
                <span class="ml-1">{{
                  formatProductType(product.metadata.productType)
                }}</span>
              </div>
            </div>

            <!-- Harvest Date -->
            <div
              v-if="product.metadata?.harvestDate"
              class="flex items-start gap-2 text-xs text-slate-600 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200"
            >
              <svg
                class="h-4 w-4 text-blue-500 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <span class="font-medium">Thu hoạch:</span>
                <span class="ml-1">{{
                  formatDate(product.metadata.harvestDate)
                }}</span>
              </div>
            </div>

            <!-- Farm Name -->
            <div
              v-if="product.metadata?.farmName"
              class="flex items-start gap-2 text-xs text-slate-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200"
            >
              <svg
                class="h-4 w-4 text-amber-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <div>
                <span class="font-medium">Nông trại:</span>
                <span class="ml-1">{{ product.metadata.farmName }}</span>
              </div>
            </div>

            <!-- Address -->
            <div
              v-if="product.metadata?.address"
              class="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
            >
              <svg
                class="h-4 w-4 text-slate-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <span class="font-medium">Địa chỉ:</span>
                <span class="ml-1">{{ product.metadata.address }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ô tra cứu ID khác -->
        <div
          class="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <p class="text-[11px] font-medium text-slate-700 mb-2">
            Tra cứu lô khác
          </p>
          <form
            @submit.prevent="onSearchAnother"
            class="flex items-center gap-2"
          >
            <input
              v-model="searchId"
              type="text"
              placeholder="Nhập ID khác..."
              class="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              class="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800 active:bg-slate-900 transition"
            >
              Tra cứu
            </button>
          </form>
          <p v-if="searchError" class="mt-1 text-[11px] text-red-500">
            {{ searchError }}
          </p>
        </div>
      </div>

      <!-- Tài nguyên đính kèm -->
      <div
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-slate-900">
            Tài nguyên đính kèm
          </h3>
          <span class="text-[10px] text-slate-500 truncate">
            URI metadata:
            <span class="font-mono text-emerald-700">{{ product.uri }}</span>
          </span>
        </div>

        <!-- Cards for Image & Certificate -->
        <div
          v-if="hasImage(product) || hasCertificate(product)"
          class="grid gap-4 sm:grid-cols-2"
        >
          <!-- Image Card -->
          <div
            v-if="hasImage(product)"
            class="rounded-xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white p-4 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-3">
              <div class="shrink-0 rounded-lg bg-blue-100 p-3 text-blue-600">
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">
                  Ảnh sản phẩm
                </h4>
                <p class="text-xs text-slate-600 mb-3">
                  Ảnh chụp lô hàng lúc thu hoạch
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
                  @click="viewImage(product)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>Xem ảnh</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Certificate Card -->
          <div
            v-if="hasCertificate(product)"
            class="rounded-xl border-2 border-red-200 bg-linear-to-br from-red-50 to-white p-4 hover:shadow-md transition-all"
          >
            <div class="flex items-start gap-3">
              <div class="shrink-0 rounded-lg bg-red-100 p-3 text-red-600">
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-slate-900 mb-1">
                  Chứng chỉ kiểm định
                </h4>
                <p class="text-xs text-slate-600 mb-3">
                  Certificate từ Inspector (PDF)
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 active:bg-red-800 transition shadow-sm"
                  @click="viewCertificate(product)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>Xem PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl"
        >
          <svg
            class="mx-auto h-10 w-10 text-slate-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p class="text-xs text-slate-500">Chưa có tài nguyên đính kèm</p>
        </div>
      </div>

      <!-- Timeline sự kiện -->
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-3">
          Lịch sử trạng thái
        </h3>

        <!-- Empty state -->
        <div
          v-if="!product.events || product.events.length === 0"
          class="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl"
        >
          <svg
            class="mx-auto h-10 w-10 text-slate-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-xs text-slate-500">Chưa có lịch sử sự kiện</p>
        </div>

        <!-- Timeline -->
        <ol v-else class="relative border-l border-slate-200 space-y-4 pl-4">
          <li v-for="(ev, idx) in sortedEvents" :key="idx" class="relative">
            <!-- Event icon based on type -->
            <span
              :class="[
                'absolute -left-[9px] mt-1 h-3 w-3 rounded-full ring-4 ring-white',
                getEventColor(ev.type),
              ]"
            />

            <div
              class="flex flex-col gap-1.5 bg-slate-50 rounded-lg p-3 border border-slate-100"
            >
              <!-- Header: Event type + Timestamp -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'text-xs font-semibold',
                      getEventTextColor(ev.type),
                    ]"
                  >
                    {{ humanEventLabel(ev.type) }}
                  </span>
                  <!-- Status badge if available -->
                  <span
                    v-if="ev.statusTo"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700"
                  >
                    {{ statusLabel(ev.statusTo) }}
                  </span>
                </div>
                <p
                  class="text-[10px] text-slate-500 font-mono whitespace-nowrap"
                >
                  {{ formatTimestamp(ev.timestamp) }}
                </p>
              </div>

              <!-- Actor -->
              <div class="flex items-center gap-1.5 text-[11px] text-slate-600">
                <svg
                  class="h-3 w-3 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span class="font-medium">Thực hiện bởi:</span>
                <span class="font-mono text-slate-900 break-all">
                  {{ formatAddress(ev.actor) }}
                </span>
              </div>

              <!-- Status transition -->
              <div
                v-if="ev.statusFrom || ev.statusTo"
                class="flex items-center gap-1.5 text-[11px] text-slate-600"
              >
                <svg
                  class="h-3 w-3 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span class="font-medium">Trạng thái:</span>
                <span v-if="ev.statusFrom" class="text-slate-500">
                  {{ statusLabel(ev.statusFrom) }}
                </span>
                <span v-if="ev.statusFrom && ev.statusTo" class="text-slate-400"
                  >→</span
                >
                <span v-if="ev.statusTo" class="font-semibold text-slate-900">
                  {{ statusLabel(ev.statusTo) }}
                </span>
              </div>

              <!-- Location/Details -->
              <div
                v-if="ev.location"
                class="flex items-start gap-1.5 text-[11px] text-slate-600"
              >
                <svg
                  class="h-3 w-3 text-slate-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="flex-1">{{ ev.location }}</span>
              </div>

              <!-- Reason Hash (for recalls) -->
              <div
                v-if="ev.reasonHash"
                class="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 rounded px-2 py-1"
              >
                <svg
                  class="h-3 w-3 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div class="flex-1">
                  <span class="font-medium">Lý do thu hồi:</span>
                  <span class="font-mono text-[10px] block mt-0.5 break-all">{{
                    ev.reasonHash
                  }}</span>
                </div>
              </div>

              <!-- Location Hash (technical details) -->
              <div
                v-if="
                  ev.locationHash && ev.locationHash !== '0x' + '0'.repeat(64)
                "
                class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono border-t border-slate-200 pt-1.5 mt-1"
              >
                <svg
                  class="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                <span class="opacity-70">hash:</span>
                <span class="break-all"
                  >{{ ev.locationHash.slice(0, 20) }}...</span
                >
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section
      v-else
      class="flex flex-col items-center justify-center py-16 gap-4"
    >
      <p class="text-sm text-slate-700">
        Không tìm thấy lô hàng với ID này trên blockchain.
      </p>
      <RouterLink
        to="/"
        class="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
      >
        Quay lại trang tra cứu
      </RouterLink>
    </section>

    <!-- 📷 Image Modal -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="closeImageModal"
    >
      <div
        class="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50"
        >
          <div>
            <h3 class="text-sm font-semibold text-slate-900">
              Ảnh sản phẩm #{{ selectedProduct?.id }}
            </h3>
            <p class="text-xs text-slate-600">
              {{ selectedProduct?.name }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            @click="closeImageModal"
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

        <!-- Body -->
        <div class="p-4 bg-slate-100 flex items-center justify-center">
          <div v-if="loadingImage" class="text-center py-16">
            <div
              class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
            />
            <p class="mt-3 text-sm text-slate-600">Đang tải ảnh từ IPFS...</p>
          </div>

          <div
            v-else-if="imageLoadError"
            class="text-center py-16 max-w-md mx-auto"
          >
            <svg
              class="mx-auto h-12 w-12 text-red-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-red-600 mb-3">{{ imageLoadError }}</p>
            <button
              type="button"
              class="text-xs text-blue-600 hover:underline"
              @click="loadImageForModal(selectedProduct)"
            >
              Thử lại
            </button>
          </div>

          <img
            v-else-if="modalImageURL"
            :src="modalImageURL"
            :alt="selectedProduct?.name"
            class="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain"
          />
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50"
        >
          <div class="text-xs text-slate-600">
            <p v-if="selectedProduct?.metadata?.imageSize">
              Kích thước:
              {{ formatFileSize(selectedProduct.metadata.imageSize) }}
            </p>
            <p
              v-if="selectedProduct?.metadata?.imageMimeType"
              class="text-slate-500"
            >
              Định dạng: {{ selectedProduct.metadata.imageMimeType }}
            </p>
          </div>
          <button
            v-if="modalImageURL"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            @click="downloadImage"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Tải về ảnh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 📄 Certificate Modal -->
    <div
      v-if="showCertificateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="closeCertificateModal"
    >
      <div
        class="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50"
        >
          <div>
            <h3 class="text-sm font-semibold text-slate-900">
              Chứng chỉ kiểm định #{{ selectedCertificateProduct?.id }}
            </h3>
            <p class="text-xs text-slate-600">
              {{ selectedCertificateProduct?.name }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            @click="closeCertificateModal"
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

        <!-- Body -->
        <div class="flex-1 bg-slate-100 overflow-hidden">
          <div
            v-if="loadingCertificate"
            class="flex items-center justify-center h-full"
          >
            <div class="text-center py-16">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"
              />
              <p class="mt-3 text-sm text-slate-600">
                Đang tải certificate từ IPFS...
              </p>
            </div>
          </div>

          <div
            v-else-if="certificateLoadError"
            class="flex flex-col items-center justify-center h-full"
          >
            <svg
              class="h-12 w-12 text-red-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-red-600 mb-3">{{ certificateLoadError }}</p>
            <button
              type="button"
              class="text-xs text-blue-600 hover:underline"
              @click="loadCertificateForModal(selectedCertificateProduct)"
            >
              Thử lại
            </button>
          </div>

          <embed
            v-else-if="modalCertificateURL"
            :src="modalCertificateURL"
            type="application/pdf"
            class="w-full h-[70vh]"
          />
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50"
        >
          <div class="text-xs text-slate-600">
            <p v-if="selectedCertificateProduct?.metadata?.certificateName">
              File: {{ selectedCertificateProduct.metadata.certificateName }}
            </p>
            <p
              v-if="selectedCertificateProduct?.metadata?.certificateSize"
              class="text-slate-500"
            >
              Kích thước:
              {{
                formatFileSize(
                  selectedCertificateProduct.metadata.certificateSize
                )
              }}
            </p>
            <p
              v-if="selectedCertificateProduct?.metadata?.attestedBy"
              class="text-slate-500"
            >
              Attested by:
              {{
                selectedCertificateProduct.metadata.attestedBy.slice(0, 10)
              }}...
            </p>
          </div>
          <button
            v-if="modalCertificateURL"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            @click="downloadCertificate"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Tải về PDF</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useProductsStore } from "../stores/useProductsStore";
import ProductStatusBadge from "../components/track/ProductStatusBadge.vue";
import { formatTimestamp } from "../utils/helpers";
import {
  fetchMetadataFromIPFS,
  fetchImageFromIPFS,
  fetchPDFFromIPFS,
} from "../web3/ipfsClient";

const route = useRoute();
const router = useRouter();
const { getById, exists } = useProductsStore();

const idParam = computed(() => Number(route.params.id));

const product = computed(() => {
  const id = idParam.value;
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return getById(id);
});

// Ô tra cứu ID khác
const searchId = ref("");
const searchError = ref("");

// Khi đổi route, reset ô nhập
watch(
  () => route.params.id,
  () => {
    searchId.value = "";
    searchError.value = "";
  }
);

function onSearchAnother() {
  searchError.value = "";

  const idNum = Number(searchId.value);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    searchError.value = "ID phải là số nguyên dương.";
    return;
  }

  if (!exists(idNum)) {
    searchError.value = `Không tìm thấy ID ${idNum} trên blockchain.`;
    return;
  }

  router.push({ name: "track", params: { id: idNum } });
}

// 📷 Modal state for image
const showImageModal = ref(false);
const selectedProduct = ref(null);
const modalImageURL = ref(null);
const loadingImage = ref(false);
const imageLoadError = ref("");

// 📄 Modal state for certificate
const showCertificateModal = ref(false);
const selectedCertificateProduct = ref(null);
const modalCertificateURL = ref(null);
const loadingCertificate = ref(false);
const certificateLoadError = ref("");

// 📷 Check if product has image
function hasImage(product) {
  if (product.metadata?.image) {
    return true;
  }
  if (product.uri?.startsWith("ipfs://")) {
    return true;
  }
  return false;
}

// 📄 Check if product has certificate
function hasCertificate(product) {
  if (product.metadata?.certificate) {
    return true;
  }
  if (
    product.uri?.startsWith("ipfs://") &&
    ["INSPECTING", "IN_TRANSIT", "DELIVERED", "RETAILED", "CONSUMED"].includes(
      product.status
    )
  ) {
    return true;
  }
  return false;
}

// 📷 Format file size
function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// 📷 View image - Open modal and load image
async function viewImage(product) {
  selectedProduct.value = product;
  showImageModal.value = true;
  await loadImageForModal(product);
}

// 📷 Load image from IPFS
async function loadImageForModal(product) {
  loadingImage.value = true;
  imageLoadError.value = "";
  modalImageURL.value = null;

  try {
    console.log("[TrackView] 🔍 Loading image for product:", {
      id: product.id,
      name: product.name,
      uri: product.uri,
      hasMetadata: !!product.metadata,
    });

    // Fetch metadata if not available
    if (!product.metadata) {
      console.log("[TrackView] Fetching metadata from:", product.uri);
      product.metadata = await fetchMetadataFromIPFS(product.uri);
      console.log("[TrackView] ✅ Metadata fetched:", product.metadata);
    }

    const imageCID = product.metadata?.image;
    console.log("[TrackView] 📷 Image CID:", imageCID);

    if (!imageCID) {
      throw new Error("Sản phẩm không có ảnh");
    }

    // Fetch image blob from IPFS
    const blob = await fetchImageFromIPFS(imageCID);
    console.log("[TrackView] ✅ Image blob loaded:", {
      size: blob.size,
      type: blob.type,
    });

    modalImageURL.value = URL.createObjectURL(blob);
    console.log("[TrackView] ✅ Image loaded successfully");
  } catch (error) {
    console.error("[TrackView] Failed to load image:", error);
    imageLoadError.value = `Không thể tải ảnh: ${error.message}`;
  } finally {
    loadingImage.value = false;
  }
}

// 📷 Download image
async function downloadImage() {
  if (!modalImageURL.value || !selectedProduct.value) return;

  try {
    const response = await fetch(modalImageURL.value);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `product-${selectedProduct.value.id}.${
      selectedProduct.value.metadata?.imageMimeType?.split("/")[1] || "jpg"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("[TrackView] ✅ Image downloaded");
  } catch (error) {
    console.error("[TrackView] Download failed:", error);
    alert("Không thể tải ảnh về. Vui lòng thử lại.");
  }
}

// 📷 Close image modal
function closeImageModal() {
  showImageModal.value = false;
  if (modalImageURL.value) {
    URL.revokeObjectURL(modalImageURL.value);
  }
  modalImageURL.value = null;
  selectedProduct.value = null;
  imageLoadError.value = "";
}

// 📄 View certificate - Open modal and load PDF
async function viewCertificate(product) {
  selectedCertificateProduct.value = product;
  showCertificateModal.value = true;
  await loadCertificateForModal(product);
}

// 📄 Load certificate from IPFS
async function loadCertificateForModal(product) {
  loadingCertificate.value = true;
  certificateLoadError.value = "";
  modalCertificateURL.value = null;

  try {
    console.log("[TrackView] 🔍 Loading certificate for product:", {
      id: product.id,
      name: product.name,
      hasCertificate: !!product.metadata?.certificate,
    });

    // Fetch metadata if not available
    if (!product.metadata) {
      console.log("[TrackView] Fetching metadata...");
      product.metadata = await fetchMetadataFromIPFS(product.uri);
    }

    const certificateCID = product.metadata?.certificate;
    if (!certificateCID) {
      throw new Error("Sản phẩm chưa có certificate");
    }

    console.log("[TrackView] Loading certificate from IPFS:", certificateCID);

    // Fetch PDF blob from IPFS
    const blob = await fetchPDFFromIPFS(certificateCID);
    modalCertificateURL.value = URL.createObjectURL(blob);

    console.log("[TrackView] ✅ Certificate loaded successfully");
  } catch (error) {
    console.error("[TrackView] Failed to load certificate:", error);
    certificateLoadError.value = `Không thể tải certificate: ${error.message}`;
  } finally {
    loadingCertificate.value = false;
  }
}

// 📄 Download certificate
async function downloadCertificate() {
  if (!modalCertificateURL.value || !selectedCertificateProduct.value) return;

  try {
    const response = await fetch(modalCertificateURL.value);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      selectedCertificateProduct.value.metadata?.certificateName ||
      `certificate-${selectedCertificateProduct.value.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("[TrackView] ✅ Certificate downloaded");
  } catch (error) {
    console.error("[TrackView] Certificate download failed:", error);
    alert("Không thể tải certificate về. Vui lòng thử lại.");
  }
}

// 📄 Close certificate modal
function closeCertificateModal() {
  showCertificateModal.value = false;
  if (modalCertificateURL.value) {
    URL.revokeObjectURL(modalCertificateURL.value);
  }
  modalCertificateURL.value = null;
  selectedCertificateProduct.value = null;
  certificateLoadError.value = "";
}

const statusLabelMap = {
  HARVESTED: "Đã thu hoạch",
  INSPECTING: "Đang kiểm định",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã giao cho bán lẻ",
  RETAILED: "Đang bán lẻ",
  CONSUMED: "Đã tiêu thụ",
  RECALLED: "Đã thu hồi",
};

function statusLabel(s) {
  return statusLabelMap[s] || s;
}

// Sort events by timestamp (newest first for timeline display)
// Filter out NOT_EXIST → HARVESTED transition (initial mint event is already shown as REGISTERED)
const sortedEvents = computed(() => {
  if (!product.value?.events) return [];

  return [...product.value.events]
    .filter((event) => {
      // Skip events that transition FROM NOT_EXIST (redundant with REGISTERED event)
      if (event.statusFrom === "NOT_EXIST") return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = parseTimestamp(a.timestamp);
      const timeB = parseTimestamp(b.timestamp);
      return timeB - timeA; // Newest first
    });
});

// Parse timestamp - handle both ISO string and milliseconds
function parseTimestamp(timestamp) {
  if (typeof timestamp === "number") {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp).getTime();
  }
  return 0;
}

// Format address for display
function formatAddress(address) {
  if (!address) return "Unknown";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format product type for display
function formatProductType(type) {
  const typeMap = {
    fruit: "Trái cây",
    vegetable: "Rau củ",
    grain: "Ngũ cốc",
    seafood: "Thủy sản",
    meat: "Thịt gia súc/gia cầm",
    other: "Khác",
  };
  return typeMap[type] || type;
}

// Format date for display (DD/MM/YYYY)
function formatDate(dateString) {
  if (!dateString) return "Chưa xác định";
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

// Get event color based on type
function getEventColor(type) {
  const colorMap = {
    REGISTERED: "bg-emerald-500",
    REGISTERED_ONCHAIN: "bg-emerald-500",
    ATTESTED: "bg-blue-500",
    ATTEST: "bg-blue-500",
    TRANSFER: "bg-purple-500",
    STATUS_UPDATED: "bg-amber-500",
    RECALL: "bg-red-500",
    ARCHIVE: "bg-slate-500",
  };
  return colorMap[type] || "bg-slate-400";
}

// Get event text color
function getEventTextColor(type) {
  const colorMap = {
    REGISTERED: "text-emerald-700",
    REGISTERED_ONCHAIN: "text-emerald-700",
    ATTESTED: "text-blue-700",
    ATTEST: "text-blue-700",
    TRANSFER: "text-purple-700",
    STATUS_UPDATED: "text-amber-700",
    RECALL: "text-red-700",
    ARCHIVE: "text-slate-700",
  };
  return colorMap[type] || "text-slate-700";
}

// Get role label
function getRoleLabel(role) {
  const labelMap = {
    FARMER: "Nông dân",
    INSPECTOR: "Kiểm định viên",
    LOGISTICS: "Đơn vị vận chuyển",
    RETAILER: "Nhà bán lẻ",
    CONSUMER: "Người tiêu dùng",
    QUARANTINE: "Kho cách ly",
    ARCHIVE: "Kho lưu trữ",
  };
  return labelMap[role] || role;
}

// Get role color classes
function getRoleColor(role) {
  const colorMap = {
    FARMER: "bg-emerald-100 text-emerald-700",
    INSPECTOR: "bg-blue-100 text-blue-700",
    LOGISTICS: "bg-purple-100 text-purple-700",
    RETAILER: "bg-amber-100 text-amber-700",
    CONSUMER: "bg-slate-100 text-slate-700",
    QUARANTINE: "bg-red-100 text-red-700",
    ARCHIVE: "bg-slate-100 text-slate-700",
  };
  return colorMap[role] || "bg-slate-100 text-slate-700";
}

function humanEventLabel(type) {
  switch (type) {
    case "REGISTERED_ONCHAIN":
      return "🌱 Đăng ký lô hàng";
    case "REGISTERED":
      return "🌱 Đăng ký lô hàng";
    case "ATTESTED":
      return "🔍 Kiểm định chất lượng";
    case "ATTEST":
      return "🔍 Kiểm định chất lượng";
    case "TRANSFER":
      return "🚚 Chuyển giao";
    case "STATUS_UPDATED":
      return "📝 Cập nhật trạng thái";
    case "RECALL":
      return "⚠️ Thu hồi sản phẩm";
    case "ARCHIVE":
      return "📦 Lưu trữ";
    default:
      return type;
  }
}
</script>
