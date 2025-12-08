import { defineStore } from "pinia";
import { ethers } from "ethers"; // 👈 Thêm import ethers
import { getSignerContract, getReadOnlyContract } from "../web3/contractClient";
import { CONTRACT_ADDRESS } from "../web3/contractConfig";

export const useSessionStore = defineStore("session", {
  state: () => ({
    currentAccount: null,
    isConnected: false,
    loadingWallet: false,
    walletError: "",
    roles: {
      FARMER: false,
      INSPECTOR: false,
      LOGISTICS: false,
      RETAILER: false,
      ADMIN: false,
    },
  }),

  getters: {
    hasAnyRole(state) {
      return Object.values(state.roles).some((v) => v);
    },
    currentRoleLabel(state) {
      const r = state.roles;
      const active = [];
      if (r.ADMIN) active.push("Quản trị");
      if (r.FARMER) active.push("Nông dân");
      if (r.INSPECTOR) active.push("Kiểm định");
      if (r.LOGISTICS) active.push("Vận chuyển");
      if (r.RETAILER) active.push("Bán lẻ");
      if (active.length === 0) return "Guest";
      return active.join(" | ");
    },
  },

  actions: {
    resetSession() {
      this.currentAccount = null;
      this.isConnected = false;
      this.walletError = "";
      this.roles = {
        FARMER: false,
        INSPECTOR: false,
        LOGISTICS: false,
        RETAILER: false,
        ADMIN: false,
      };
    },

    async loadRolesForAccount(address) {
      if (!address) return;

      if (!window.ethereum) {
        this.walletError = "Vui lòng cài đặt MetaMask để sử dụng.";
        return;
      }

      try {
        const contract = getReadOnlyContract();

        // 👇 Kiểm tra contract có tồn tại không
        const provider = contract.runner;
        const code = await provider.getCode(CONTRACT_ADDRESS);

        if (code === "0x") {
          this.walletError =
            "Contract chưa được deploy hoặc bạn đang kết nối sai mạng.";
          console.error(
            "[session] Contract không tồn tại tại:",
            CONTRACT_ADDRESS
          );
          return;
        }

        console.log("[session] Contract deployed, code length:", code.length);

        // 👇 Tính hash trực tiếp thay vì gọi getter
        const farmerRole = ethers.id("FARMER_ROLE");
        const inspectorRole = ethers.id("INSPECTOR_ROLE");
        const logisticsRole = ethers.id("LOGISTICS_ROLE");
        const retailerRole = ethers.id("RETAILER_ROLE");
        const adminRole = ethers.id("ADMIN_ROLE");

        const [isFarmer, isInspector, isLogistics, isRetailer, isAdmin] =
          await Promise.all([
            contract.hasRole(farmerRole, address),
            contract.hasRole(inspectorRole, address),
            contract.hasRole(logisticsRole, address),
            contract.hasRole(retailerRole, address),
            contract.hasRole(adminRole, address),
          ]);

        this.roles = {
          FARMER: isFarmer,
          INSPECTOR: isInspector,
          LOGISTICS: isLogistics,
          RETAILER: isRetailer,
          ADMIN: isAdmin,
        };

        console.log("[session] Roles loaded:", this.roles);
      } catch (error) {
        console.error("[session] loadRolesForAccount error:", error);
        this.walletError = "Không đọc được role từ smart contract.";
      }
    },

    async connectWallet() {
      this.walletError = "";
      this.loadingWallet = true;

      try {
        const contract = await getSignerContract();
        const signer = contract.runner;
        const address = await signer.getAddress();

        this.currentAccount = address;
        this.isConnected = true;
        await this.loadRolesForAccount(address);
      } catch (error) {
        console.error("[session] connectWallet error:", error);
        this.walletError = "Không thể kết nối MetaMask hoặc user đã từ chối.";
        this.resetSession();
      } finally {
        this.loadingWallet = false;
      }
    },

    logout() {
      this.resetSession();
      this.walletError = "";
    },
  },
});
