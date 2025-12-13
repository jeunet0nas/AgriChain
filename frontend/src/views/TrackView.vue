<template>
  <div>
    <section v-if="product" class="space-y-6">
      <!-- Product Header -->
      <ProductHeader
        :product="product"
        :search-error="searchError"
        @search="onSearchAnother"
      />

      <!-- Resources Card -->
      <ProductResourcesCard
        :product="product"
        @view-image="viewImage"
        @view-certificate="viewCertificate"
      />

      <!-- Timeline -->
      <ProductTimeline :events="sortedEvents" />
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

    <!-- Resource Modal for Image -->
    <ResourceModal
      :show="showImageModal"
      type="image"
      :product="selectedImageProduct"
      :url="modalImageURL"
      :loading="loadingImage"
      :error="imageLoadError"
      @close="closeImageModal"
      @download="downloadImage"
      @retry="loadImageForModal(selectedImageProduct)"
    />

    <!-- Resource Modal for Certificate -->
    <ResourceModal
      :show="showCertificateModal"
      type="certificate"
      :product="selectedCertificateProduct"
      :url="modalCertificateURL"
      :loading="loadingCertificate"
      :error="certificateLoadError"
      @close="closeCertificateModal"
      @download="downloadCertificate"
      @retry="loadCertificateForModal(selectedCertificateProduct)"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useProductsStore } from "../stores/useProductsStore";
import ProductHeader from "../components/track/ProductHeader.vue";
import ProductResourcesCard from "../components/track/ProductResourcesCard.vue";
import ProductTimeline from "../components/track/ProductTimeline.vue";
import ResourceModal from "../components/track/ResourceModal.vue";
import { useIPFSResource } from "../composables/useIPFSResource";

const route = useRoute();
const router = useRouter();
const { getById, exists } = useProductsStore();

// IPFS resource handlers
const {
  // Image modal
  showImageModal,
  selectedImageProduct,
  imageURL: modalImageURL,
  loadingImage,
  imageError: imageLoadError,
  viewImage,
  closeImageModal,
  downloadImage,
  loadImage: loadImageForModal,

  // Certificate modal
  showCertificateModal,
  selectedCertificateProduct,
  certificateURL: modalCertificateURL,
  loadingCertificate,
  certificateError: certificateLoadError,
  viewCertificate,
  closeCertificateModal,
  downloadCertificate,
  loadCertificate: loadCertificateForModal,
} = useIPFSResource();

const idParam = computed(() => Number(route.params.id));

const product = computed(() => {
  const id = idParam.value;
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return getById(id);
});

// Search functionality
const searchError = ref("");

watch(
  () => route.params.id,
  () => {
    searchError.value = "";
  }
);

function onSearchAnother(idNum) {
  searchError.value = "";

  const parsedId = Number(idNum);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    searchError.value = "ID phải là số nguyên dương.";
    return;
  }

  if (!exists(parsedId)) {
    searchError.value = `Không tìm thấy lô hàng với mã ${parsedId} trên blockchain.`;
    return;
  }

  router.push({ name: "track", params: { id: parsedId } });
}

// Sort events for timeline
const sortedEvents = computed(() => {
  if (!product.value?.events) return [];
  return [...product.value.events].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
});
</script>
