/**
 * useInspectorAttest.js
 *
 * Composable for Inspector attestation workflow with PDF certificate upload.
 * Handles complete attest process: PDF upload → metadata update → on-chain attest.
 *
 * Extracted from: InspectorView.vue (250+ lines)
 */

import { ref } from "vue";
import { getSignerContract } from "../web3/contractClient";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";
import { reloadProductEvents } from "../stores/useProductSync";
import { hashAddress } from "../utils/helpers";
import {
  uploadMetadataToIPFS,
  uploadPDFToIPFS,
  fetchMetadataFromIPFS,
} from "../web3/ipfsClient";

export function useInspectorAttest() {
  const productsStore = useProductsStore();
  const session = useSessionStore();

  // Modal state
  const showAttestModal = ref(false);
  const selectedProduct = ref(null);
  const submitting = ref(false);
  const modalAttestError = ref("");
  const modalAttestSuccess = ref("");

  // PDF upload state
  const pdfFileInput = ref(null);
  const selectedPDF = ref(null);
  const pdfError = ref("");
  const uploadingPDF = ref(false);
  const pdfUploadProgress = ref(0);

  /**
   * Open attest modal for a product
   *
   * @param {Object} product - Product to attest
   */
  function openAttestModal(product) {
    selectedProduct.value = product;
    showAttestModal.value = true;
    clearPDF();
    modalAttestError.value = "";
    modalAttestSuccess.value = "";

    console.log("[useInspectorAttest] Opened modal for product:", {
      id: product.id,
      name: product.name,
      status: product.status,
    });
  }

  /**
   * Close attest modal
   */
  function closeAttestModal() {
    showAttestModal.value = false;
    selectedProduct.value = null;
    clearPDF();
    modalAttestError.value = "";
    modalAttestSuccess.value = "";

    console.log("[useInspectorAttest] Closed modal");
  }

  /**
   * Handle PDF file selection
   *
   * @param {Event} event - File input change event
   */
  function handlePDFSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    pdfError.value = "";

    console.log("[useInspectorAttest] PDF selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type
    if (file.type !== "application/pdf") {
      pdfError.value = "Chỉ chấp nhận file PDF";
      console.error("[useInspectorAttest] Invalid file type:", file.type);
      return;
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      pdfError.value = `Kích thước file vượt quá ${MAX_SIZE / 1024 / 1024}MB`;
      console.error("[useInspectorAttest] File too large:", file.size);
      return;
    }

    selectedPDF.value = file;
  }

  /**
   * Clear selected PDF
   */
  function clearPDF() {
    selectedPDF.value = null;
    pdfError.value = "";
    pdfUploadProgress.value = 0;

    if (pdfFileInput.value) {
      pdfFileInput.value.value = "";
    }
  }

  /**
   * Format file size for display
   *
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /**
   * Main attest function with PDF upload
   * Complete workflow: Upload PDF → Update metadata → Mark inspected on-chain
   *
   * @returns {Promise<boolean>} Success status
   */
  async function handleAttestWithPDF() {
    modalAttestError.value = "";
    modalAttestSuccess.value = "";

    if (!selectedProduct.value || !selectedPDF.value) {
      modalAttestError.value = "Vui lòng chọn PDF certificate";
      return false;
    }

    if (!session.roles.INSPECTOR) {
      modalAttestError.value = "Bạn không có quyền Inspector.";
      return false;
    }

    console.log("[useInspectorAttest] 🚀 Starting attest process:", {
      productId: selectedProduct.value.id,
      productName: selectedProduct.value.name,
      pdfName: selectedPDF.value.name,
      pdfSize: selectedPDF.value.size,
    });

    try {
      submitting.value = true;

      // STEP 1: Upload PDF to IPFS
      modalAttestSuccess.value = "Đang upload certificate lên IPFS...";
      uploadingPDF.value = true;
      pdfUploadProgress.value = 0;

      const certificateCID = await uploadPDFToIPFS(
        selectedPDF.value,
        (percent) => {
          pdfUploadProgress.value = percent;
        }
      );

      console.log(
        `[useInspectorAttest] ✅ Certificate uploaded: ${certificateCID}`
      );
      uploadingPDF.value = false;

      // STEP 2: Fetch current metadata and update with certificate
      modalAttestSuccess.value = "Đang cập nhật metadata...";

      console.log("[useInspectorAttest] 📋 Current product state:", {
        id: selectedProduct.value.id,
        oldURI: selectedProduct.value.uri,
        hasMetadata: !!selectedProduct.value.metadata,
      });

      let currentMetadata = selectedProduct.value.metadata;
      if (
        !currentMetadata &&
        selectedProduct.value.uri?.startsWith("ipfs://")
      ) {
        console.log(
          "[useInspectorAttest] Fetching current metadata from:",
          selectedProduct.value.uri
        );
        currentMetadata = await fetchMetadataFromIPFS(
          selectedProduct.value.uri
        );
        console.log("[useInspectorAttest] ✅ Current metadata fetched");
      }

      // Create new metadata with certificate info
      const updatedMetadata = {
        ...currentMetadata,
        certificate: certificateCID,
        certificateName: selectedPDF.value.name,
        certificateSize: selectedPDF.value.size,
        attestedBy: hashAddress(session.currentAccount), // Hash for privacy
        attestedAt: new Date().toISOString(),
      };

      console.log(
        "[useInspectorAttest] 📦 New metadata created:",
        updatedMetadata
      );

      // Upload new metadata to IPFS
      const newMetadataURI = await uploadMetadataToIPFS(updatedMetadata);
      console.log(
        `[useInspectorAttest] ✅ New metadata uploaded: ${newMetadataURI}`
      );
      console.log(
        `[useInspectorAttest] 🔄 URI change: ${selectedProduct.value.uri} → ${newMetadataURI}`
      );

      // STEP 3: Call smart contract
      modalAttestSuccess.value = "Đang gửi transaction attest...";

      const contract = await getSignerContract();

      // 3a. Update batch URI on-chain
      console.log("[useInspectorAttest] 📝 Updating batch URI...");
      const txUpdateURI = await contract.updateBatchURI(
        selectedProduct.value.id,
        newMetadataURI
      );
      modalAttestSuccess.value = "Đang cập nhật metadata on-chain...";
      await txUpdateURI.wait();
      console.log("[useInspectorAttest] ✅ Batch URI updated on-chain");

      // 3b. Mark batch inspected (changes status to INSPECTING)
      modalAttestSuccess.value = "Đang gửi transaction attest...";
      const tx = await contract.markBatchInspected(selectedProduct.value.id);

      modalAttestSuccess.value = "Đang chờ transaction được xác nhận...";
      await tx.wait();

      console.log("[useInspectorAttest] ✅ Batch marked inspected on-chain");

      // STEP 4: Update local store
      const actor = session.currentAccount || "0xINSPECTOR";
      const timestamp = new Date().toISOString();

      console.log("[useInspectorAttest] 📝 Updating local store...");
      productsStore.updateStatus(selectedProduct.value.id, "INSPECTING", {
        actor,
        timestamp,
        currentHolderRole: selectedProduct.value.currentHolderRole,
        currentHolderAddress: selectedProduct.value.currentHolderAddress,
        addEvent: false, // Event listener will handle
      });

      // Update metadata in product
      const product = productsStore.getById(selectedProduct.value.id);
      if (product) {
        const oldURI = product.uri;
        product.uri = newMetadataURI;
        product.metadata = updatedMetadata;
        console.log("[useInspectorAttest] ✅ Local product updated:", {
          id: product.id,
          oldURI,
          newURI: product.uri,
          hasCertificate: !!product.metadata?.certificate,
          certificateCID: product.metadata?.certificate,
        });
      } else {
        console.error(
          "[useInspectorAttest] ⚠️ Could not find product in store!"
        );
      }

      modalAttestSuccess.value = `Kiểm định thành công! Chứng chỉ đã được lưu trên blockchain.`;

      console.log("[useInspectorAttest] 🎉 Attest complete:", {
        productId: selectedProduct.value.id,
        certificateCID,
        newMetadataURI,
      });

      // Force reload events for timeline
      console.log("[useInspectorAttest] 🔄 Reloading events...");
      await reloadProductEvents(selectedProduct.value.id);

      // Auto-close modal after 2s
      setTimeout(() => {
        closeAttestModal();
      }, 2000);

      return true;
    } catch (error) {
      console.error("[useInspectorAttest] Attest failed:", error);

      let errorMsg = "Lỗi: ";
      if (error.message.includes("user rejected")) {
        errorMsg += "Bạn đã hủy giao dịch";
      } else if (error.message.includes("insufficient funds")) {
        errorMsg += "Không đủ gas fee";
      } else {
        errorMsg += error.message;
      }

      modalAttestError.value = errorMsg;
      uploadingPDF.value = false;

      return false;
    } finally {
      submitting.value = false;
    }
  }

  return {
    // Modal state
    showAttestModal,
    selectedProduct,
    submitting,
    modalAttestError,
    modalAttestSuccess,

    // PDF state
    pdfFileInput,
    selectedPDF,
    pdfError,
    uploadingPDF,
    pdfUploadProgress,

    // Methods
    openAttestModal,
    closeAttestModal,
    handlePDFSelect,
    clearPDF,
    formatFileSize,
    handleAttestWithPDF,
  };
}
