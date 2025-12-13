import { ref } from "vue";
import { getSignerContract } from "../web3/contractClient";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * Composable for ERC721 token transfers
 * Consolidates transfer logic used across all role views
 */
export function useTokenTransfer() {
  const productsStore = useProductsStore();
  const sessionStore = useSessionStore();

  const isTransferring = ref(false);
  const transferError = ref(null);

  /**
   * Transfer ERC721 token to another address
   * @param {Object} product - Product to transfer
   * @param {string} toAddress - Recipient address
   * @param {string} newStatus - Expected status after transfer (optional)
   * @param {string} newRole - Expected holder role after transfer (optional)
   * @returns {Promise<Object>} Transaction result
   */
  async function transferToken(
    product,
    toAddress,
    newStatus = null,
    newRole = null
  ) {
    isTransferring.value = true;
    transferError.value = null;

    try {
      const fromAddress = sessionStore.currentAccount;

      if (!fromAddress) {
        throw new Error("Wallet not connected");
      }

      const contract = await getSignerContract();

      // Verify ownership
      const owner = await contract.ownerOf(product.id);
      if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error(`You don't own batch #${product.id}`);
      }

      // Execute ERC721 transfer
      const tx = await contract.transferFrom(
        fromAddress,
        toAddress,
        product.id
      );
      console.log(`[useTokenTransfer] Transfer tx sent:`, tx.hash);

      await tx.wait();
      console.log(
        `[useTokenTransfer] Transfer confirmed for batch ${product.id}`
      );

      // Update store (blockchain event will also update)
      if (newStatus) {
        productsStore.updateStatus(product.id, newStatus, {
          actor: fromAddress,
          timestamp: new Date().toISOString(),
          currentHolderRole: newRole,
          currentHolderAddress: toAddress,
          addEvent: false, // Let blockchain event handle this
        });
      }

      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error("[useTokenTransfer] Transfer failed:", error);
      transferError.value = error.message || "Transfer failed";
      throw error;
    } finally {
      isTransferring.value = false;
    }
  }

  /**
   * Send RECALLED token to QUARANTINE_VAULT
   * @param {Object} product - Product to quarantine
   * @returns {Promise<Object>} Transaction result
   */
  async function sendToQuarantine(product) {
    const QUARANTINE_VAULT = "0x000000000000000000000000000000000000dEaD";

    if (product.status !== "RECALLED") {
      throw new Error("Product must be in RECALLED status");
    }

    if (product.currentHolderRole === "QUARANTINE") {
      throw new Error("Product already in quarantine");
    }

    const result = await transferToken(product, QUARANTINE_VAULT);

    // Update local state
    const storeProduct = productsStore.getById(product.id);
    if (storeProduct) {
      storeProduct.currentHolderRole = "QUARANTINE";
      storeProduct.currentHolderAddress = QUARANTINE_VAULT;
    }

    return result;
  }

  /**
   * Send CONSUMED token to ARCHIVE_VAULT
   * @param {Object} product - Product to archive
   * @returns {Promise<Object>} Transaction result
   */
  async function sendToArchive(product) {
    const ARCHIVE_VAULT = "0x000000000000000000000000000000000000aaaa";

    if (product.status !== "CONSUMED") {
      throw new Error("Product must be in CONSUMED status");
    }

    const result = await transferToken(product, ARCHIVE_VAULT);

    // Update local state
    const storeProduct = productsStore.getById(product.id);
    if (storeProduct) {
      storeProduct.currentHolderRole = "ARCHIVE";
      storeProduct.currentHolderAddress = ARCHIVE_VAULT;
    }

    return result;
  }

  return {
    isTransferring,
    transferError,
    transferToken,
    sendToQuarantine,
    sendToArchive,
  };
}
