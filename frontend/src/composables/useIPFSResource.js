import { ref } from "vue";
import {
  fetchMetadataFromIPFS,
  fetchImageFromIPFS,
  fetchPDFFromIPFS,
} from "../web3/ipfsClient";

/**
 * Composable for loading and managing IPFS resources (images, PDFs, etc.)
 * Handles modal state, loading, errors, and download functionality
 */
export function useIPFSResource() {
  // Image modal state
  const showImageModal = ref(false);
  const selectedImageProduct = ref(null);
  const imageURL = ref(null);
  const loadingImage = ref(false);
  const imageError = ref("");

  // Certificate/PDF modal state
  const showCertificateModal = ref(false);
  const selectedCertificateProduct = ref(null);
  const certificateURL = ref(null);
  const loadingCertificate = ref(false);
  const certificateError = ref("");

  /**
   * Load image from IPFS
   */
  async function loadImage(product) {
    loadingImage.value = true;
    imageError.value = "";
    imageURL.value = null;

    try {
      // Fetch metadata if not available
      if (!product.metadata && product.uri?.startsWith("ipfs://")) {
        product.metadata = await fetchMetadataFromIPFS(product.uri);
      }

      const imageCID = product.metadata?.image;
      if (!imageCID) {
        throw new Error("Sản phẩm không có ảnh");
      }

      const blob = await fetchImageFromIPFS(imageCID);
      imageURL.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error("[useIPFSResource] Image load failed:", error);
      imageError.value = `Không thể tải ảnh: ${error.message}`;
    } finally {
      loadingImage.value = false;
    }
  }

  /**
   * Open image modal and load image
   */
  async function viewImage(product) {
    selectedImageProduct.value = product;
    showImageModal.value = true;
    await loadImage(product);
  }

  /**
   * Close image modal and cleanup
   */
  function closeImageModal() {
    showImageModal.value = false;
    if (imageURL.value) {
      URL.revokeObjectURL(imageURL.value);
    }
    imageURL.value = null;
    selectedImageProduct.value = null;
    imageError.value = "";
  }

  /**
   * Download image file
   */
  async function downloadImage() {
    if (!imageURL.value || !selectedImageProduct.value) return;

    try {
      const response = await fetch(imageURL.value);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `product-${selectedImageProduct.value.id}.${
        selectedImageProduct.value.metadata?.imageMimeType?.split("/")[1] ||
        "jpg"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[useIPFSResource] Download failed:", error);
      alert("Không thể tải ảnh về. Vui lòng thử lại.");
    }
  }

  /**
   * Load certificate/PDF from IPFS
   */
  async function loadCertificate(product) {
    loadingCertificate.value = true;
    certificateError.value = "";
    certificateURL.value = null;

    try {
      // Fetch metadata if not available
      if (!product.metadata && product.uri?.startsWith("ipfs://")) {
        product.metadata = await fetchMetadataFromIPFS(product.uri);
      }

      const certificateCID = product.metadata?.certificate;
      if (!certificateCID) {
        throw new Error("Sản phẩm chưa có chứng chỉ");
      }

      const blob = await fetchPDFFromIPFS(certificateCID);
      certificateURL.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error("[useIPFSResource] Certificate load failed:", error);
      certificateError.value = `Không thể tải chứng chỉ: ${error.message}`;
    } finally {
      loadingCertificate.value = false;
    }
  }

  /**
   * Open certificate modal and load PDF
   */
  async function viewCertificate(product) {
    selectedCertificateProduct.value = product;
    showCertificateModal.value = true;
    await loadCertificate(product);
  }

  /**
   * Close certificate modal and cleanup
   */
  function closeCertificateModal() {
    showCertificateModal.value = false;
    if (certificateURL.value) {
      URL.revokeObjectURL(certificateURL.value);
    }
    certificateURL.value = null;
    selectedCertificateProduct.value = null;
    certificateError.value = "";
  }

  /**
   * Download certificate/PDF file
   */
  async function downloadCertificate() {
    if (!certificateURL.value || !selectedCertificateProduct.value) return;

    try {
      const response = await fetch(certificateURL.value);
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
    } catch (error) {
      console.error("[useIPFSResource] Download failed:", error);
      alert("Không thể tải chứng chỉ về. Vui lòng thử lại.");
    }
  }

  /**
   * Check if product has image
   */
  function hasImage(product) {
    return !!(product.metadata?.image || product.uri?.startsWith("ipfs://"));
  }

  /**
   * Check if product has certificate
   */
  function hasCertificate(product) {
    if (product.metadata?.certificate) return true;

    const hasInspectedStatus = [
      "INSPECTING",
      "IN_TRANSIT",
      "DELIVERED",
      "RETAILED",
      "CONSUMED",
    ].includes(product.status);

    return hasInspectedStatus && product.uri?.startsWith("ipfs://");
  }

  /**
   * Format file size for display
   */
  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return {
    // Image modal
    showImageModal,
    selectedImageProduct,
    imageURL,
    loadingImage,
    imageError,
    viewImage,
    closeImageModal,
    downloadImage,
    loadImage,

    // Certificate modal
    showCertificateModal,
    selectedCertificateProduct,
    certificateURL,
    loadingCertificate,
    certificateError,
    viewCertificate,
    closeCertificateModal,
    downloadCertificate,
    loadCertificate,

    // Utilities
    hasImage,
    hasCertificate,
    formatFileSize,
  };
}
