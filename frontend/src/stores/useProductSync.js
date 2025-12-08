import { ref, onMounted, onUnmounted } from "vue";
import { getReadOnlyContract } from "../web3/contractClient";
import { useProductsStore } from "../stores/useProductsStore";
import { fetchMetadataFromIPFS } from "../web3/ipfsClient";

/**
 * ✅ ERC721 Product Sync Composable - REFACTORED ARCHITECTURE
 *
 * 🏗️ SINGLE SOURCE OF TRUTH: Blockchain events only
 *
 * ARCHITECTURE PRINCIPLES:
 * 1. Product Shell Creation: addProductFromOnChain() creates products with EMPTY events array
 * 2. Event Loading: loadPastEventsFromChain() queries blockchain for ALL events with block timestamps
 * 3. Real-time Listeners: ONLY update product state (status, holder), NO event creation
 * 4. Duplicate Prevention: addEvent() in store handles all duplicate checking
 *
 * FLOW:
 * App Mount → loadProductsFromChain() → Create shells → Query past events → Populate timeline
 * User Action → Contract emits event → Listener updates state → (Event added by next query)
 * Page Refresh → Same flow, duplicate check prevents re-adding events
 *
 * EVENT SOURCES (Ordered by priority):
 * - PRIMARY: loadPastEventsFromChain() with blockchain timestamps (source of truth)
 * - SECONDARY: Real-time listeners for instant UI feedback (state only, no events)
 *
 * CRITICAL: Events are NEVER created with new Date(), always use block.timestamp from blockchain
 */

let globalListenersAttached = false;
let globalContract = null;

async function loadMetadataFromURI(uri) {
  try {
    if (uri.startsWith("ipfs://")) {
      const metadata = await fetchMetadataFromIPFS(uri);
      console.log(
        "[useProductSync] ✅ Fetched metadata from IPFS:",
        metadata.name
      );
      return metadata;
    }

    if (uri.startsWith("local://")) {
      const hash = uri.replace("local://", "");
      const metadataString = localStorage.getItem(`metadata_${hash}`);
      if (metadataString) {
        return JSON.parse(metadataString);
      }
      console.warn(
        `[useProductSync] ⚠️ Metadata NOT FOUND in localStorage for ${hash}`
      );
      return null;
    }

    if (uri.startsWith("http")) {
      const response = await fetch(uri);
      return await response.json();
    }

    return null;
  } catch (error) {
    console.warn(
      "[useProductSync] Failed to load metadata from URI:",
      uri,
      error
    );
    return null;
  }
}

export function useProductSync(options = {}) {
  const {
    viewName = "Unknown",
    onProductLoaded = null,
    onStatusUpdated = null,
  } = options;
  const productsStore = useProductsStore();
  const loadingProducts = ref(false);

  const STATUS_MAP = {
    0: "NOT_EXIST",
    1: "HARVESTED",
    2: "INSPECTING",
    3: "IN_TRANSIT",
    4: "DELIVERED",
    5: "RETAILED",
    6: "CONSUMED",
    7: "RECALLED",
  };

  function getHolderRoleFromStatus(statusNum) {
    const map = {
      1: "FARMER",
      2: "FARMER",
      3: "LOGISTICS",
      4: "RETAILER",
      5: "RETAILER",
      6: "CONSUMER",
      7: "FARMER",
    };
    return map[statusNum] || "UNKNOWN";
  }

  function determineEventType(oldStatusNum, newStatusNum) {
    if (oldStatusNum === 1 && newStatusNum === 2) return "ATTESTED";
    if (oldStatusNum === 2 && newStatusNum === 3) return "TRANSFER";
    if (oldStatusNum === 3 && newStatusNum === 4) return "TRANSFER";
    if (oldStatusNum === 4 && newStatusNum === 5) return "STATUS_UPDATED";
    if (oldStatusNum === 5 && newStatusNum === 6) return "STATUS_UPDATED";
    if (newStatusNum === 7) return "RECALL";
    return "STATUS_UPDATED";
  }

  /**
   * ✅ ERC721: Load all batches from chain
   * STEP 1: Create product shells with current state
   * STEP 2: Load ALL events from blockchain to reconstruct timeline
   */
  async function loadProductsFromChain() {
    if (!window.ethereum) {
      console.warn(`[${viewName}] MetaMask not found`);
      return;
    }

    try {
      loadingProducts.value = true;
      const contract = getReadOnlyContract();
      const tokenCounter = await contract.tokenCounter();

      console.log(
        `[${viewName}] 📦 Total batches on chain: ${tokenCounter.toString()}`
      );

      // STEP 1: Create/update product shells with current blockchain state
      for (let i = 1; i <= Number(tokenCounter); i++) {
        try {
          const owner = await contract.ownerOf(i);
          const status = await contract.getBatchStatus(i);
          const uri = await contract.tokenURI(i);

          if (Number(status) === 0) continue;

          const metadata = await loadMetadataFromURI(uri);
          const name = metadata?.name || `Lô #${i}`;
          const statusName = STATUS_MAP[Number(status)] || "NOT_EXIST";
          const holderRole = getHolderRoleFromStatus(Number(status));

          // ✅ Create or update product shell (NO events yet)
          productsStore.addProductFromOnChain({
            id: i,
            name,
            uri,
            holder: owner.toLowerCase(),
            location: metadata?.location || "",
            initSupply: 1,
            status: statusName,
            holderRole: holderRole,
            metadata: metadata,
          });

          if (onProductLoaded) {
            const product = productsStore.getById(i);
            onProductLoaded(product, { status: statusName, holderRole });
          }
        } catch (err) {
          console.warn(`[${viewName}] Error loading batch ${i}:`, err.message);
        }
      }

      // STEP 2: Load ALL events from blockchain to reconstruct complete timeline
      console.log(`[${viewName}] 🔄 Loading ALL events from blockchain...`);
      await loadPastEventsFromChain(contract, Number(tokenCounter));
      console.log(`[${viewName}] ✅ Products and events loaded successfully`);
    } catch (error) {
      console.error(`[${viewName}] Error loading batches:`, error);
    } finally {
      loadingProducts.value = false;
    }
  }

  /**
   * 🆕 Load past events from blockchain to reconstruct timeline
   * This ensures events are synced across browsers/sessions
   */
  async function loadPastEventsFromChain(contract, maxBatchId) {
    try {
      // Get all past events (last 10000 blocks or from deployment)
      const currentBlock = await contract.runner.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      console.log(
        `[${viewName}] Querying events from block ${fromBlock} to ${currentBlock}`
      );

      // Query all event types
      const [
        mintedEvents,
        inspectedEvents,
        statusEvents,
        recalledEvents,
        transferEvents,
      ] = await Promise.all([
        contract.queryFilter(
          contract.filters.BatchMinted(),
          fromBlock,
          currentBlock
        ),
        contract.queryFilter(
          contract.filters.BatchInspected(),
          fromBlock,
          currentBlock
        ),
        contract.queryFilter(
          contract.filters.StatusUpdated(),
          fromBlock,
          currentBlock
        ),
        contract.queryFilter(
          contract.filters.BatchRecalled(),
          fromBlock,
          currentBlock
        ),
        contract.queryFilter(
          contract.filters.Transfer(),
          fromBlock,
          currentBlock
        ),
      ]);

      console.log(`[${viewName}] Found events:`, {
        minted: mintedEvents.length,
        inspected: inspectedEvents.length,
        status: statusEvents.length,
        recalled: recalledEvents.length,
        transfer: transferEvents.length,
      });

      // Process BatchMinted events
      console.log(
        `[loadPastEvents] Processing ${mintedEvents.length} BatchMinted events...`
      );
      for (const event of mintedEvents) {
        const batchId = Number(event.args.batchId);
        const product = productsStore.getById(batchId);
        if (!product) continue;

        const block = await event.getBlock();
        const farmer = event.args.farmer.toLowerCase();

        // ✅ addEvent() handles duplicate check internally
        productsStore.addEvent(batchId, {
          type: "REGISTERED",
          actor: farmer,
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          statusTo: "HARVESTED",
          location: product.metadata?.location || "",
        });
      } // Process BatchInspected events
      console.log(
        `[loadPastEvents] Processing ${inspectedEvents.length} BatchInspected events...`
      );
      for (const event of inspectedEvents) {
        const batchId = Number(event.args.batchId);
        const product = productsStore.getById(batchId);
        if (!product) continue;

        const block = await event.getBlock();

        productsStore.addEvent(batchId, {
          type: "ATTESTED",
          actor: event.args.inspector.toLowerCase(),
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          statusFrom: "HARVESTED",
          statusTo: "INSPECTING",
          location: "Certificate attached via Inspector",
        });
      }

      // Process StatusUpdated events
      console.log(
        `[loadPastEvents] Processing ${statusEvents.length} StatusUpdated events...`
      );
      for (const event of statusEvents) {
        const batchId = Number(event.args.batchId);
        const product = productsStore.getById(batchId);
        if (!product) continue;

        const block = await event.getBlock();
        const oldStatusName = STATUS_MAP[Number(event.args.oldStatus)];
        const newStatusName = STATUS_MAP[Number(event.args.newStatus)];
        const eventType = determineEventType(
          Number(event.args.oldStatus),
          Number(event.args.newStatus)
        );

        productsStore.addEvent(batchId, {
          type: eventType,
          actor: event.args.updater.toLowerCase(),
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          statusFrom: oldStatusName,
          statusTo: newStatusName,
          location: `Status updated by ${event.args.updater.slice(0, 10)}...`,
        });
      }

      // Process Transfer events (ERC721)
      console.log(
        `[loadPastEvents] Processing ${transferEvents.length} Transfer events...`
      );
      for (const event of transferEvents) {
        const tokenId = Number(event.args.tokenId);
        const product = productsStore.getById(tokenId);
        if (!product) continue;

        // Skip mint transfers (from 0x0)
        if (event.args.from === "0x0000000000000000000000000000000000000000")
          continue;

        const block = await event.getBlock();

        productsStore.addEvent(tokenId, {
          type: "TRANSFER",
          actor: event.args.to.toLowerCase(),
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          location: `Transferred from ${event.args.from.slice(
            0,
            10
          )}... to ${event.args.to.slice(0, 10)}...`,
        });
      }

      // Process BatchRecalled events
      console.log(
        `[loadPastEvents] Processing ${recalledEvents.length} BatchRecalled events...`
      );
      for (const event of recalledEvents) {
        const batchId = Number(event.args.batchId);
        const product = productsStore.getById(batchId);
        if (!product) continue;

        const block = await event.getBlock();

        productsStore.addEvent(batchId, {
          type: "RECALL",
          actor: event.args.caller.toLowerCase(),
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          statusTo: "RECALLED",
          reasonHash: event.args.reasonHash,
          location: "Product recalled by admin",
        });
      }

      console.log(`[${viewName}] ✅ Past events loaded and reconstructed`);
    } catch (error) {
      console.error(`[${viewName}] Error loading past events:`, error);
    }
  }

  /**
   * ✅ ERC721: Event Listeners
   */
  function listenToContractEvents(contract) {
    console.log(`[${viewName}] 🎧 Attaching event listeners...`);

    // ✅ BatchMinted: New batch created
    contract.on("BatchMinted", async (batchId, farmer, event) => {
      console.log(`[${viewName}] 📢 BatchMinted: ${batchId} by ${farmer}`);

      try {
        const uri = await contract.tokenURI(batchId);
        const metadata = await loadMetadataFromURI(uri);
        const name = metadata?.name || `Lô #${batchId}`;

        // ✅ Only create/update product shell - NO event creation
        // Past events query will add REGISTERED event with blockchain timestamp
        productsStore.addProductFromOnChain({
          id: Number(batchId),
          name,
          uri,
          holder: farmer.toLowerCase(),
          location: metadata?.location || "",
          initSupply: 1,
          status: "HARVESTED",
          holderRole: "FARMER",
          metadata: metadata,
        });

        if (onProductLoaded) {
          const product = productsStore.getById(Number(batchId));
          onProductLoaded(product, {
            status: "HARVESTED",
            holderRole: "FARMER",
          });
        }
      } catch (error) {
        console.error(`[${viewName}] Error handling BatchMinted:`, error);
      }
    });

    // ✅ Transfer: Ownership change (drives state transitions)
    contract.on("Transfer", async (from, to, tokenId, event) => {
      console.log(
        `[${viewName}] 📢 Transfer: ${tokenId} from ${from} to ${to}`
      );

      const product = productsStore.getById(Number(tokenId));
      if (!product) {
        console.warn(`[${viewName}] Product ${tokenId} not found in store`);
        return;
      }

      try {
        // ✅ Only update product state - NO event creation
        product.currentHolderAddress = to.toLowerCase();
        const status = await contract.getBatchStatus(tokenId);
        const statusName = STATUS_MAP[Number(status)];
        const holderRole = getHolderRoleFromStatus(Number(status));

        product.status = statusName;
        product.currentHolderRole = holderRole;

        if (onStatusUpdated) {
          onStatusUpdated(product, { newStatus: statusName, holderRole });
        }
      } catch (error) {
        console.error(`[${viewName}] Error handling Transfer:`, error);
      }
    });

    // ✅ BatchInspected: Inspector attestation
    contract.on("BatchInspected", async (batchId, inspector, event) => {
      console.log(
        `[${viewName}] 📢 BatchInspected: ${batchId} by ${inspector}`
      );

      const product = productsStore.getById(Number(batchId));
      if (!product) return;

      try {
        // ✅ Only update product state - NO event creation
        product.status = "INSPECTING";
        product.currentHolderRole = "FARMER";

        if (onStatusUpdated) {
          onStatusUpdated(product, {
            newStatus: "INSPECTING",
            holderRole: "FARMER",
          });
        }
      } catch (error) {
        console.error(`[${viewName}] Error handling BatchInspected:`, error);
      }
    });

    // ✅ StatusUpdated: Generic status change
    contract.on(
      "StatusUpdated",
      async (batchId, updater, oldStatus, newStatus, event) => {
        console.log(
          `[${viewName}] 📢 StatusUpdated: ${batchId} ${oldStatus}→${newStatus} by ${updater}`
        );

        const product = productsStore.getById(Number(batchId));
        if (!product) return;

        try {
          // ✅ Only update product state - NO event creation
          const statusName = STATUS_MAP[Number(newStatus)];
          const holderRole = getHolderRoleFromStatus(Number(newStatus));

          product.status = statusName;
          product.currentHolderRole = holderRole;

          if (onStatusUpdated) {
            onStatusUpdated(product, { newStatus: statusName, holderRole });
          }
        } catch (error) {
          console.error(`[${viewName}] Error handling StatusUpdated:`, error);
        }
      }
    );

    // ✅ BatchRecalled: Admin recall
    contract.on("BatchRecalled", async (batchId, caller, reasonHash, event) => {
      console.log(
        `[${viewName}] 📢 BatchRecalled: ${batchId} by ${caller}, reason: ${reasonHash}`
      );

      const product = productsStore.getById(Number(batchId));
      if (!product) return;

      try {
        // ✅ Only update product state - NO event creation
        product.status = "RECALLED";
        product.currentHolderRole = "FARMER";

        if (onStatusUpdated) {
          onStatusUpdated(product, {
            newStatus: "RECALLED",
            holderRole: "FARMER",
          });
        }
      } catch (error) {
        console.error(`[${viewName}] Error handling BatchRecalled:`, error);
      }
    });

    // ✅ BatchArchived: Final state (to ARCHIVE_VAULT)
    contract.on(
      "BatchArchived",
      async (batchId, caller, archiveWallet, event) => {
        console.log(
          `[${viewName}] 📢 BatchArchived: ${batchId} to ${archiveWallet}`
        );

        const product = productsStore.getById(Number(batchId));
        if (!product) return;

        try {
          // ✅ Only update product state - NO event creation
          product.status = "CONSUMED";
          product.currentHolderAddress = archiveWallet.toLowerCase();
        } catch (error) {
          console.error(`[${viewName}] Error handling BatchArchived:`, error);
        }
      }
    );

    console.log(`[${viewName}] ✅ Event listeners attached`);
  }

  function attachGlobalEventListeners() {
    if (globalListenersAttached) {
      console.log(
        `[${viewName}] ⚠️ Global listeners already attached, skipping`
      );
      return;
    }

    try {
      const contract = getReadOnlyContract();
      globalContract = contract;
      listenToContractEvents(contract);
      globalListenersAttached = true;
      console.log(`[${viewName}] ✅ Global listeners attached successfully`);
    } catch (error) {
      console.error(`[${viewName}] Error attaching global listeners:`, error);
    }
  }

  function cleanup() {
    console.log(`[${viewName}] 🧹 Cleaning up event listeners...`);

    if (globalContract) {
      globalContract.removeAllListeners("BatchMinted");
      globalContract.removeAllListeners("Transfer");
      globalContract.removeAllListeners("BatchInspected");
      globalContract.removeAllListeners("StatusUpdated");
      globalContract.removeAllListeners("BatchRecalled");
      globalContract.removeAllListeners("BatchArchived");
    }

    globalListenersAttached = false;
    globalContract = null;
  }

  onMounted(() => {
    console.log(`[${viewName}] 🚀 Mounting useProductSync...`);
    attachGlobalEventListeners();
  });

  onUnmounted(() => {
    console.log(`[${viewName}] 💤 Unmounting useProductSync...`);
  });

  return {
    loadingProducts,
    loadProductsFromChain,
    cleanup,
  };
}

/**
 * 🆕 Reload events for a specific product from blockchain
 * Use after manual operations (attest, transfer, etc.) to sync timeline
 *
 * This queries recent blockchain events and adds them with proper timestamps
 */
export async function reloadProductEvents(productId) {
  try {
    const contract = getReadOnlyContract();
    const productsStore = useProductsStore();
    const product = productsStore.getById(productId);

    if (!product) {
      console.warn(`[reloadProductEvents] Product ${productId} not found`);
      return;
    }

    console.log(
      `[reloadProductEvents] 🔄 Reloading events for product ${productId}...`
    );

    // Query recent events for this product (last 1000 blocks)
    const currentBlock = await contract.runner.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);

    const [
      mintedEvents,
      inspectedEvents,
      statusEvents,
      transferEvents,
      recalledEvents,
    ] = await Promise.all([
      contract.queryFilter(contract.filters.BatchMinted(productId), fromBlock),
      contract.queryFilter(
        contract.filters.BatchInspected(productId),
        fromBlock
      ),
      contract.queryFilter(
        contract.filters.StatusUpdated(productId),
        fromBlock
      ),
      contract.queryFilter(
        contract.filters.Transfer(null, null, productId),
        fromBlock
      ),
      contract.queryFilter(
        contract.filters.BatchRecalled(productId),
        fromBlock
      ),
    ]);

    console.log(
      `[reloadProductEvents] Found ${
        mintedEvents.length +
        inspectedEvents.length +
        statusEvents.length +
        transferEvents.length +
        recalledEvents.length
      } events`
    );

    // Process all event types with blockchain timestamps
    // addEvent() will skip duplicates automatically

    for (const event of mintedEvents) {
      const block = await event.getBlock();
      productsStore.addEvent(productId, {
        type: "REGISTERED",
        actor: event.args.farmer.toLowerCase(),
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        statusTo: "HARVESTED",
        location: product.metadata?.location || "",
      });
    }

    for (const event of inspectedEvents) {
      const block = await event.getBlock();
      productsStore.addEvent(productId, {
        type: "ATTESTED",
        actor: event.args.inspector.toLowerCase(),
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        statusFrom: "HARVESTED",
        statusTo: "INSPECTING",
        location: "Certificate attached via Inspector",
      });
    }

    for (const event of statusEvents) {
      const block = await event.getBlock();
      const STATUS_MAP = {
        0: "NOT_EXIST",
        1: "HARVESTED",
        2: "INSPECTING",
        3: "IN_TRANSIT",
        4: "DELIVERED",
        5: "RETAILED",
        6: "CONSUMED",
        7: "RECALLED",
      };

      productsStore.addEvent(productId, {
        type: "STATUS_UPDATED",
        actor: event.args.updater.toLowerCase(),
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        statusFrom: STATUS_MAP[Number(event.args.oldStatus)],
        statusTo: STATUS_MAP[Number(event.args.newStatus)],
        location: `Status updated by ${event.args.updater.slice(0, 10)}...`,
      });
    }

    for (const event of transferEvents) {
      // Skip mint transfers
      if (event.args.from === "0x0000000000000000000000000000000000000000")
        continue;

      const block = await event.getBlock();
      productsStore.addEvent(productId, {
        type: "TRANSFER",
        actor: event.args.to.toLowerCase(),
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        location: `Transferred from ${event.args.from.slice(
          0,
          10
        )}... to ${event.args.to.slice(0, 10)}...`,
      });
    }

    for (const event of recalledEvents) {
      const block = await event.getBlock();
      productsStore.addEvent(productId, {
        type: "RECALL",
        actor: event.args.caller.toLowerCase(),
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        statusTo: "RECALLED",
        reasonHash: event.args.reasonHash,
        location: "Product recalled by admin",
      });
    }

    console.log(
      `[reloadProductEvents] ✅ Events reloaded for product ${productId}`
    );
  } catch (error) {
    console.error(`[reloadProductEvents] Error:`, error);
  }
}
