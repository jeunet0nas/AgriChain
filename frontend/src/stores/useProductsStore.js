import { defineStore } from "pinia";

const VALID_STATUSES = [
  "NOT_EXIST",
  "HARVESTED",
  "INSPECTING",
  "IN_TRANSIT",
  "DELIVERED",
  "RETAILED",
  "CONSUMED",
  "RECALLED",
];

export const useProductsStore = defineStore("products", {
  state: () => ({
    products: [],
  }),

  getters: {
    getById: (state) => (id) => {
      return state.products.find((p) => p.id === id);
    },
    exists: (state) => (id) => {
      return !!state.products.find((p) => p.id === id);
    },
  },

  actions: {
    // 👇 Thêm validation cho status
    isValidStatus(status) {
      return VALID_STATUSES.includes(status);
    },

    // Add product from blockchain (creates shell with empty events)
    // Events populated by loadPastEventsFromChain() with blockchain timestamps
    addProductFromOnChain(payload) {
      const id = Number(payload.id);
      let product = this.getById(id);

      if (product) {
        // Update metadata only, preserve events
        product.name = payload.name || product.name;
        product.status = payload.status || product.status;
        product.currentHolderRole =
          payload.holderRole || product.currentHolderRole;
        product.currentHolderAddress =
          payload.holder || product.currentHolderAddress;
        product.uri = payload.uri || product.uri;
        product.location = payload.location || product.location;
        product.initialSupply = payload.initSupply ?? product.initialSupply;
        if (payload.metadata) product.metadata = payload.metadata;

        return product;
      }

      // Create product shell with empty events array
      product = {
        id,
        name: payload.name,
        description: "",
        status: payload.status || "HARVESTED",
        currentHolderRole: payload.holderRole || "FARMER",
        currentHolderAddress: payload.holder || "0xFARMER...ONCHAIN",
        uri: payload.uri || "ipfs://fake-meta",
        location: payload.location || "",
        initialSupply: payload.initSupply ?? null,
        ipfsResources: [],
        metadata: payload.metadata || null,
        events: [], // Events loaded from blockchain
      };

      this.products.push(product);
      return product;
    },

    // Update status with validation
    updateStatus(id, newStatus, options = {}) {
      const product = this.getById(id);
      if (!product) {
        console.warn(`[ProductsStore] Product ${id} không tồn tại`);
        return null;
      }

      if (!this.isValidStatus(newStatus)) {
        console.error(
          `[ProductsStore] Status không hợp lệ: ${newStatus}. Phải là một trong: ${VALID_STATUSES.join(
            ", "
          )}`
        );
        return null;
      }

      const oldStatus = product.status;
      product.status = newStatus;

      if (options.currentHolderRole) {
        product.currentHolderRole = options.currentHolderRole;
      }
      if (options.currentHolderAddress) {
        product.currentHolderAddress = options.currentHolderAddress;
      }

      // Tự động thêm event nếu không bị tắt
      if (options.addEvent !== false) {
        this.addEvent(id, {
          type: "STATUS_UPDATED",
          actor: options.actor || "0xSYSTEM...FAKE",
          timestamp: options.timestamp || new Date().toISOString(),
          statusFrom: oldStatus,
          statusTo: newStatus,
          locationHash: options.locationHash,
        });
      }

      return product;
    },

    // Add event with duplicate prevention (multi-criteria check)
    addEvent(id, event) {
      const product = this.getById(id);
      if (!product) {
        console.warn(`[ProductsStore] Product ${id} không tồn tại`);
        return null;
      }
      if (!Array.isArray(product.events)) {
        product.events = [];
      }

      // Multi-criteria duplicate check
      const eventTimestamp = new Date(event.timestamp).getTime();
      const isDuplicate = product.events.some((existingEvent) => {
        // Criterion 1: Type match (with special cases)
        const isSameType =
          existingEvent.type === event.type ||
          (["REGISTERED", "REGISTERED_ONCHAIN"].includes(existingEvent.type) &&
            ["REGISTERED", "REGISTERED_ONCHAIN"].includes(event.type));

        if (!isSameType) return false;

        // Criterion 2: Actor match
        if (existingEvent.actor !== event.actor) return false;

        // Criterion 3: Timestamp similarity (within 10 seconds)
        const existingTimestamp = new Date(existingEvent.timestamp).getTime();
        const timeDiff = Math.abs(existingTimestamp - eventTimestamp);

        if (timeDiff > 10000) return false;

        // Criterion 4: For status events, check transitions
        if (["STATUS_UPDATED", "TRANSFER", "ATTESTED"].includes(event.type)) {
          // Must have same statusFrom AND statusTo
          if (existingEvent.statusFrom !== event.statusFrom) return false;
          if (existingEvent.statusTo !== event.statusTo) return false;
        }

        return true; // All criteria matched
      });

      if (isDuplicate) {
        console.log(
          `[Store] Duplicate blocked: ${event.type} for product ${id}`
        );
        return null;
      }

      product.events.push(event);
      return event;
    },

    // Add product manually (for testing/demo)
    addProduct(productInput) {
      const nextId =
        this.products.length > 0
          ? Math.max(...this.products.map((p) => p.id)) + 1
          : 1;

      const newProduct = {
        id: nextId,
        name: productInput.name,
        description: productInput.description || "",
        status: productInput.status || "HARVESTED",
        currentHolderRole: productInput.currentHolderRole || "FARMER",
        currentHolderAddress:
          productInput.currentHolderAddress || "0xFARMER...FAKE",
        uri: productInput.uri || "ipfs://fake-meta",
        ipfsResources: productInput.ipfsResources || [],
        events: productInput.events || [],
      };

      this.products.push(newProduct);
      return newProduct;
    },
  },
});
