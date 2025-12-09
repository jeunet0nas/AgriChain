import { computed } from "vue";
import { useProductsStore } from "../stores/useProductsStore";
import { useSessionStore } from "../stores/useSessionStore";

/**
 * Composable for filtering products by role and status
 * Reduces duplication across FarmerView, LogisticsView, RetailerView
 */
export function useProductFilters() {
  const productsStore = useProductsStore();
  const sessionStore = useSessionStore();

  const currentAccount = computed(() => sessionStore.currentAccount);

  /**
   * Filter products owned by current account
   */
  const myProducts = computed(() => {
    if (!currentAccount.value) return [];

    return productsStore.products.filter(
      (p) =>
        p.currentHolderAddress?.toLowerCase() ===
        currentAccount.value.toLowerCase()
    );
  });

  /**
   * Filter products by status (owned by current account)
   */
  function filterByStatus(status) {
    return computed(() => {
      if (!currentAccount.value) return [];

      return productsStore.products.filter(
        (p) =>
          p.currentHolderAddress?.toLowerCase() ===
            currentAccount.value.toLowerCase() && p.status === status
      );
    });
  }

  /**
   * Filter products by multiple statuses
   */
  function filterByStatuses(statuses) {
    return computed(() => {
      if (!currentAccount.value) return [];

      return productsStore.products.filter(
        (p) =>
          p.currentHolderAddress?.toLowerCase() ===
            currentAccount.value.toLowerCase() && statuses.includes(p.status)
      );
    });
  }

  /**
   * Filter RECALLED products not yet in quarantine
   */
  const recalledProductsToQuarantine = computed(() => {
    if (!currentAccount.value) return [];

    return productsStore.products.filter(
      (p) =>
        p.currentHolderAddress?.toLowerCase() ===
          currentAccount.value.toLowerCase() &&
        p.status === "RECALLED" &&
        p.currentHolderRole !== "QUARANTINE"
    );
  });

  return {
    currentAccount,
    myProducts,
    filterByStatus,
    filterByStatuses,
    recalledProductsToQuarantine,
  };
}
