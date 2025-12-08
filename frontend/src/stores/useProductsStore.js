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

    // 👇 Thêm sản phẩm từ on-chain (CHỈ tạo shell, KHÔNG tạo events)
    // Events sẽ được add bởi loadPastEventsFromChain() từ blockchain
    addProductFromOnChain(payload) {
      const id = Number(payload.id);
      let product = this.getById(id);

      if (product) {
        console.log(
          `[ProductsStore] ⏭️ Product ${id} đã tồn tại, chỉ cập nhật metadata`,
          `Events: ${product.events.length}`
        );
        // ✅ CHỈ cập nhật metadata, KHÔNG động chạm events
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

      // ✅ Tạo product shell KHÔNG có events - events sẽ được add từ blockchain
      console.log(
        `[ProductsStore] 🆕 Creating NEW product ${id} (NO initial events - will be loaded from blockchain)`
      );
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
        events: [], // ✅ Start with EMPTY events array
      };

      this.products.push(product);
      return product;
    },

    // 👇 Cập nhật trạng thái với validation
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

    // 👇 Thêm event với duplicate check
    addEvent(id, event) {
      const product = this.getById(id);
      if (!product) {
        console.warn(`[ProductsStore] Product ${id} không tồn tại`);
        return null;
      }
      if (!Array.isArray(product.events)) {
        product.events = [];
      }

      // 🔄 Enhanced duplicate check with multiple criteria
      const eventTimestamp = new Date(event.timestamp).getTime();
      const isDuplicate = product.events.some((existingEvent) => {
        // ✅ Criterion 1: Type match (with special cases)
        const isSameType =
          existingEvent.type === event.type ||
          (["REGISTERED", "REGISTERED_ONCHAIN"].includes(existingEvent.type) &&
            ["REGISTERED", "REGISTERED_ONCHAIN"].includes(event.type));

        if (!isSameType) return false;

        // ✅ Criterion 2: Actor match (required)
        if (existingEvent.actor !== event.actor) return false;

        // ✅ Criterion 3: Timestamp similarity (within 10 seconds for blockchain delays)
        const existingTimestamp = new Date(existingEvent.timestamp).getTime();
        const timeDiff = Math.abs(existingTimestamp - eventTimestamp);

        if (timeDiff > 10000) return false; // More than 10 seconds apart = different events

        // ✅ Criterion 4: For STATUS_UPDATED/TRANSFER events, check transitions
        if (["STATUS_UPDATED", "TRANSFER", "ATTESTED"].includes(event.type)) {
          // Must have same statusFrom AND statusTo
          if (existingEvent.statusFrom !== event.statusFrom) return false;
          if (existingEvent.statusTo !== event.statusTo) return false;
        }

        // All criteria matched = duplicate!
        return true;
      });

      if (isDuplicate) {
        console.log(`[ProductsStore] ⛔ Duplicate event blocked:`, {
          productId: id,
          type: event.type,
          actor: event.actor?.slice(0, 10),
          timestamp: event.timestamp,
          reason: "Same type + actor + timestamp + transition",
        });
        return null;
      }

      product.events.push(event);
      console.log(`[ProductsStore] ✅ Event added:`, {
        productId: id,
        type: event.type,
        actor: event.actor?.slice(0, 10),
        totalEvents: product.events.length,
      });
      return event;
    },

    // 👇 Thêm sản phẩm thủ công (fake data cho demo)
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
