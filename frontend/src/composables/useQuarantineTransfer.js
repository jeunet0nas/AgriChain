/**
 * useQuarantineTransfer.js
 *
 * Composable for handling recalled product transfers to QUARANTINE_VAULT.
 * Eliminates duplicate quarantine logic across Farmer, Logistics, Retailer views.
 *
 * Pattern extracted from:
 * - FarmerView: sendFarmerRecalledToQuarantine()
 * - LogisticsView: sendLogisticsRecalledToQuarantine()
 * - RetailerView: sendToQuarantine()
 */

import { ref } from "vue";
import { ethers } from "ethers";
import { getSignerContract } from "../web3/contractClient";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";

export function useQuarantineTransfer() {
  const productsStore = useProductsStore();
  const session = useSessionStore();

  // Transfer state
  const transferring = ref(false);
  const transferError = ref("");
  const transferSuccess = ref("");
  const transferringId = ref(null);

  // QUARANTINE_VAULT address (0x...dEaD)
  const QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD";

  /**
   * Send recalled product to quarantine vault
   *
   * @param {Object} product - Product to send to quarantine
   * @param {String} roleKey - Role key for tracking (e.g., 'farmerQuarantineSent')
   * @returns {Promise<boolean>} - Success status
   */
  async function sendToQuarantine(product, roleKey = "quarantineSent") {
    if (!product) {
      console.error("[useQuarantineTransfer] No product provided");
      return false;
    }

    transferError.value = "";
    transferSuccess.value = "";
    transferringId.value = product.id;

    console.log("[useQuarantineTransfer] Sending to quarantine:", {
      productId: product.id,
      productName: product.name,
      currentStatus: product.status,
      currentHolder: product.currentHolderAddress,
      roleKey,
    });

    try {
      transferring.value = true;

      // Validate product status
      if (product.status !== "RECALLED") {
        throw new Error("Chỉ có thể gửi lô RECALLED về kho cách ly");
      }

      // Validate ownership
      const currentAccount = session.currentAccount;
      if (!currentAccount) {
        throw new Error("Vui lòng kết nối ví");
      }

      if (
        product.currentHolderAddress?.toLowerCase() !==
        currentAccount.toLowerCase()
      ) {
        throw new Error("Bạn không phải chủ sở hữu hiện tại của lô này");
      }

      // Validate not already sent
      if (product.currentHolderRole === "QUARANTINE") {
        throw new Error("Lô này đã ở kho cách ly");
      }

      console.log(
        "[useQuarantineTransfer] 🚀 Sending ERC721 transfer to QUARANTINE_VAULT..."
      );

      // Get signer contract
      const contract = await getSignerContract();

      // Execute ERC721 transfer to QUARANTINE_VAULT
      const tx = await contract.transferFrom(
        currentAccount,
        QUARANTINE_VAULT,
        product.id
      );

      transferSuccess.value = "Đang chờ transaction được xác nhận...";
      console.log("[useQuarantineTransfer] Transaction sent:", tx.hash);

      await tx.wait();

      console.log("[useQuarantineTransfer] ✅ Transaction confirmed");

      // Update local store - event listener will handle status update
      // Mark as sent to quarantine for UI display
      const productInStore = productsStore.getById(product.id);
      if (productInStore) {
        productInStore[roleKey] = true;
        console.log("[useQuarantineTransfer] 📝 Marked product as sent:", {
          productId: product.id,
          roleKey,
          value: true,
        });
      }

      transferSuccess.value = `Đã gửi lô "${product.name}" về kho cách ly thành công.`;

      // Auto-clear success message after 3s
      setTimeout(() => {
        transferSuccess.value = "";
      }, 3000);

      return true;
    } catch (error) {
      console.error("[useQuarantineTransfer] Failed:", error);

      // Parse error message
      let errorMsg = "Không thể gửi về kho cách ly";

      if (error.message.includes("user rejected")) {
        errorMsg = "Bạn đã hủy giao dịch";
      } else if (error.message.includes("insufficient funds")) {
        errorMsg = "Không đủ gas fee để thực hiện giao dịch";
      } else if (error.message) {
        errorMsg = error.message;
      }

      transferError.value = errorMsg;

      // Auto-clear error after 5s
      setTimeout(() => {
        transferError.value = "";
      }, 5000);

      return false;
    } finally {
      transferring.value = false;
      transferringId.value = null;
    }
  }

  /**
   * Check if product can be sent to quarantine
   *
   * @param {Object} product - Product to check
   * @returns {Object} - { canSend: boolean, reason: string }
   */
  function canSendToQuarantine(product) {
    if (!product) {
      return { canSend: false, reason: "No product" };
    }

    if (product.status !== "RECALLED") {
      return { canSend: false, reason: "Product not recalled" };
    }

    if (product.currentHolderRole === "QUARANTINE") {
      return { canSend: false, reason: "Already in quarantine" };
    }

    const currentAccount = session.currentAccount;
    if (!currentAccount) {
      return { canSend: false, reason: "No account connected" };
    }

    if (
      product.currentHolderAddress?.toLowerCase() !==
      currentAccount.toLowerCase()
    ) {
      return { canSend: false, reason: "Not current holder" };
    }

    return { canSend: true, reason: "" };
  }

  /**
   * Check if product is already sent to quarantine
   *
   * @param {Object} product - Product to check
   * @param {String} roleKey - Role key to check (e.g., 'farmerQuarantineSent')
   * @returns {boolean}
   */
  function isQuarantineSent(product, roleKey = "quarantineSent") {
    if (!product) return false;
    return (
      product[roleKey] === true || product.currentHolderRole === "QUARANTINE"
    );
  }

  return {
    // State
    transferring,
    transferError,
    transferSuccess,
    transferringId,

    // Constants
    QUARANTINE_VAULT,

    // Methods
    sendToQuarantine,
    canSendToQuarantine,
    isQuarantineSent,
  };
}
