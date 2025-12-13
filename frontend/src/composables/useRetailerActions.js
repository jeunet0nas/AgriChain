/**
 * useRetailerActions.js
 *
 * Composable for retailer-specific product status transitions.
 * Handles: DELIVERED → RETAILED → CONSUMED → ARCHIVE workflow.
 *
 */

import { ref } from "vue";
import { ethers } from "ethers";
import { getSignerContract } from "../web3/contractClient";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";

export function useRetailerActions() {
  const productsStore = useProductsStore();
  const session = useSessionStore();

  // Action state
  const actionInProgress = ref(false);
  const actionError = ref("");
  const actionSuccess = ref("");
  const actioningId = ref(null);

  // ARCHIVE_VAULT address (0x...aaaa) - must match contract constant
  const ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa";

  /**
   * Mark product as RETAILED (transition from DELIVERED)
   *
   * @param {Object} product - Product to mark as retailed
   * @returns {Promise<boolean>} Success status
   */
  async function markAsRetailed(product) {
    if (!product) {
      console.error("[useRetailerActions] No product provided");
      return false;
    }

    actionError.value = "";
    actionSuccess.value = "";
    actioningId.value = product.id;

    console.log("[useRetailerActions] Marking as RETAILED:", {
      productId: product.id,
      productName: product.name,
      currentStatus: product.status,
    });

    try {
      actionInProgress.value = true;

      // Validate status
      if (product.status !== "DELIVERED") {
        throw new Error("Chỉ có thể đánh dấu lô DELIVERED là đang bán");
      }

      // Validate role
      if (!session.roles.RETAILER) {
        throw new Error("Bạn không có quyền RETAILER");
      }

      console.log(
        "[useRetailerActions] 🚀 Calling advanceBatchRetailStatus..."
      );

      const contract = await getSignerContract();
      const tx = await contract.advanceBatchRetailStatus(product.id);

      actionSuccess.value = "Đang chờ transaction được xác nhận...";
      console.log("[useRetailerActions] Transaction sent:", tx.hash);

      await tx.wait();

      console.log("[useRetailerActions] ✅ Transaction confirmed");

      // Update local store - event listener will handle
      const actor = session.currentAccount || "0xRETAILER";
      const timestamp = new Date().toISOString();

      productsStore.updateStatus(product.id, "RETAILED", {
        actor,
        timestamp,
        currentHolderRole: product.currentHolderRole,
        currentHolderAddress: product.currentHolderAddress,
        addEvent: false,
      });

      actionSuccess.value = `Đã đánh dấu "${product.name}" là đang bán lẻ.`;

      // Auto-clear success after 3s
      setTimeout(() => {
        actionSuccess.value = "";
      }, 3000);

      return true;
    } catch (error) {
      console.error("[useRetailerActions] Mark RETAILED failed:", error);

      let errorMsg = "Không thể đánh dấu đang bán";
      if (error.message.includes("user rejected")) {
        errorMsg = "Bạn đã hủy giao dịch";
      } else if (error.message.includes("insufficient funds")) {
        errorMsg = "Không đủ gas fee";
      } else if (error.message) {
        errorMsg = error.message;
      }

      actionError.value = errorMsg;

      setTimeout(() => {
        actionError.value = "";
      }, 5000);

      return false;
    } finally {
      actionInProgress.value = false;
      actioningId.value = null;
    }
  }

  /**
   * Mark product as CONSUMED (transition from RETAILED)
   *
   * @param {Object} product - Product to mark as consumed
   * @returns {Promise<boolean>} Success status
   */
  async function markAsConsumed(product) {
    if (!product) {
      console.error("[useRetailerActions] No product provided");
      return false;
    }

    actionError.value = "";
    actionSuccess.value = "";
    actioningId.value = product.id;

    console.log("[useRetailerActions] Marking as CONSUMED:", {
      productId: product.id,
      productName: product.name,
      currentStatus: product.status,
    });

    try {
      actionInProgress.value = true;

      // Validate status
      if (product.status !== "RETAILED") {
        throw new Error("Chỉ có thể đánh dấu lô RETAILED là đã tiêu thụ");
      }

      // Validate role
      if (!session.roles.RETAILER) {
        throw new Error("Bạn không có quyền RETAILER");
      }

      console.log(
        "[useRetailerActions] 🚀 Calling advanceBatchRetailStatus..."
      );

      const contract = await getSignerContract();
      const tx = await contract.advanceBatchRetailStatus(product.id);

      actionSuccess.value = "Đang chờ transaction được xác nhận...";
      console.log("[useRetailerActions] Transaction sent:", tx.hash);

      await tx.wait();

      console.log("[useRetailerActions] ✅ Transaction confirmed");

      // Update local store
      const actor = session.currentAccount || "0xRETAILER";
      const timestamp = new Date().toISOString();

      productsStore.updateStatus(product.id, "CONSUMED", {
        actor,
        timestamp,
        currentHolderRole: product.currentHolderRole,
        currentHolderAddress: product.currentHolderAddress,
        addEvent: false,
      });

      actionSuccess.value = `Đã đánh dấu "${product.name}" là đã tiêu thụ.`;

      setTimeout(() => {
        actionSuccess.value = "";
      }, 3000);

      return true;
    } catch (error) {
      console.error("[useRetailerActions] Mark CONSUMED failed:", error);

      let errorMsg = "Không thể đánh dấu đã tiêu thụ";
      if (error.message.includes("user rejected")) {
        errorMsg = "Bạn đã hủy giao dịch";
      } else if (error.message.includes("insufficient funds")) {
        errorMsg = "Không đủ gas fee";
      } else if (error.message) {
        errorMsg = error.message;
      }

      actionError.value = errorMsg;

      setTimeout(() => {
        actionError.value = "";
      }, 5000);

      return false;
    } finally {
      actionInProgress.value = false;
      actioningId.value = null;
    }
  }

  /**
   * Archive product (send to ARCHIVE_VAULT)
   * Final step: Transfer token to 0x0...000 address
   *
   * @param {Object} product - Product to archive
   * @returns {Promise<boolean>} Success status
   */
  async function archiveProduct(product) {
    if (!product) {
      console.error("[useRetailerActions] No product provided");
      return false;
    }

    actionError.value = "";
    actionSuccess.value = "";
    actioningId.value = product.id;

    console.log("[useRetailerActions] Archiving product:", {
      productId: product.id,
      productName: product.name,
      currentStatus: product.status,
    });

    try {
      actionInProgress.value = true;

      // Validate status
      if (product.status !== "CONSUMED") {
        throw new Error("Chỉ có thể lưu trữ lô CONSUMED");
      }

      // Validate role
      if (!session.roles.RETAILER) {
        throw new Error("Bạn không có quyền RETAILER");
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
        throw new Error("Bạn không phải chủ sở hữu hiện tại");
      }

      console.log(
        "[useRetailerActions] 🚀 Sending ERC721 transfer to ARCHIVE_VAULT..."
      );

      const contract = await getSignerContract();

      // Execute ERC721 transfer to ARCHIVE_VAULT (burns token)
      const tx = await contract.transferFrom(
        currentAccount,
        ARCHIVE_VAULT,
        product.id
      );

      actionSuccess.value = "Đang chờ transaction được xác nhận...";
      console.log("[useRetailerActions] Transaction sent:", tx.hash);

      await tx.wait();

      console.log("[useRetailerActions] ✅ Transaction confirmed");

      // Update local store - event listener will handle status update
      const productInStore = productsStore.getById(product.id);
      if (productInStore) {
        productInStore.archived = true;
        console.log("[useRetailerActions] 📝 Marked product as archived:", {
          productId: product.id,
          archived: true,
        });
      }

      actionSuccess.value = `Đã lưu trữ lô "${product.name}" thành công.`;

      setTimeout(() => {
        actionSuccess.value = "";
      }, 3000);

      return true;
    } catch (error) {
      console.error("[useRetailerActions] Archive failed:", error);

      let errorMsg = "Không thể lưu trữ lô";
      if (error.message.includes("user rejected")) {
        errorMsg = "Bạn đã hủy giao dịch";
      } else if (error.message.includes("insufficient funds")) {
        errorMsg = "Không đủ gas fee";
      } else if (error.message) {
        errorMsg = error.message;
      }

      actionError.value = errorMsg;

      setTimeout(() => {
        actionError.value = "";
      }, 5000);

      return false;
    } finally {
      actionInProgress.value = false;
      actioningId.value = null;
    }
  }

  /**
   * Check if product can be marked as retailed
   *
   * @param {Object} product - Product to check
   * @returns {Object} { canMark: boolean, reason: string }
   */
  function canMarkAsRetailed(product) {
    if (!product) return { canMark: false, reason: "No product" };
    if (product.status !== "DELIVERED")
      return { canMark: false, reason: "Not DELIVERED" };
    if (!session.roles.RETAILER)
      return { canMark: false, reason: "No RETAILER role" };
    return { canMark: true, reason: "" };
  }

  /**
   * Check if product can be marked as consumed
   *
   * @param {Object} product - Product to check
   * @returns {Object} { canMark: boolean, reason: string }
   */
  function canMarkAsConsumed(product) {
    if (!product) return { canMark: false, reason: "No product" };
    if (product.status !== "RETAILED")
      return { canMark: false, reason: "Not RETAILED" };
    if (!session.roles.RETAILER)
      return { canMark: false, reason: "No RETAILER role" };
    return { canMark: true, reason: "" };
  }

  /**
   * Check if product can be archived
   *
   * @param {Object} product - Product to check
   * @returns {Object} { canArchive: boolean, reason: string }
   */
  function canArchiveProduct(product) {
    if (!product) return { canArchive: false, reason: "No product" };
    if (product.status !== "CONSUMED")
      return { canArchive: false, reason: "Not CONSUMED" };
    if (!session.roles.RETAILER)
      return { canArchive: false, reason: "No RETAILER role" };

    const currentAccount = session.currentAccount;
    if (!currentAccount) return { canArchive: false, reason: "No account" };

    if (
      product.currentHolderAddress?.toLowerCase() !==
      currentAccount.toLowerCase()
    ) {
      return { canArchive: false, reason: "Not current holder" };
    }

    return { canArchive: true, reason: "" };
  }

  return {
    // State
    actionInProgress,
    actionError,
    actionSuccess,
    actioningId,

    // Constants
    ARCHIVE_VAULT,

    // Methods
    markAsRetailed,
    markAsConsumed,
    archiveProduct,

    // Validation helpers
    canMarkAsRetailed,
    canMarkAsConsumed,
    canArchiveProduct,
  };
}
