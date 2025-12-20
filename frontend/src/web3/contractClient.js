import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig";

if (!CONTRACT_ADDRESS || !CONTRACT_ABI) {
  throw new Error("CONTRACT_ADDRESS hoặc CONTRACT_ABI chưa được cấu hình.");
}

let cachedProvider = null;
let cachedReadOnlyContract = null; // 👈 THÊM: Cache contract instance

function getMetaMaskProvider() {
  if (!window.ethereum) {
    console.error("[web3] MetaMask (window.ethereum) không tồn tại.");
    throw new Error("MetaMask not available");
  }
  if (!cachedProvider) {
    cachedProvider = new ethers.BrowserProvider(window.ethereum);
  }
  return cachedProvider;
}

export function getReadOnlyContract() {
  try {
    if (cachedReadOnlyContract) {
      return cachedReadOnlyContract;
    }

    const provider = getMetaMaskProvider();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    // 👇 Cache contract instance
    cachedReadOnlyContract = contract;
    console.log("[web3] Created and cached read-only contract instance");

    return contract;
  } catch (error) {
    console.error("[web3] Không tạo được read-only contract:", error);
    throw error;
  }
}

export async function getSignerContract() {
  if (!window.ethereum) {
    console.error("[web3] MetaMask (window.ethereum) không tồn tại.");
    throw new Error("MetaMask not available");
  }

  try {
    const provider = getMetaMaskProvider();
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    return contract;
  } catch (error) {
    console.error("[web3] Lỗi khi lấy signer contract:", error);
    throw error;
  }
}

export async function getOnChainProductStatus(id) {
  try {
    const contract = getReadOnlyContract();
    // ✅ ERC721: Use getBatchStatus() or batchStatus public variable
    const status = await contract.getBatchStatus(id);
    return Number(status);
  } catch (error) {
    console.error("[web3] Lỗi getBatchStatus:", error);
    throw error;
  }
}

export async function getOnChainUri(id) {
  try {
    const contract = getReadOnlyContract();
    // ✅ ERC721: Use tokenURI() instead of uri()
    const uri = await contract.tokenURI(id);
    return uri;
  } catch (error) {
    console.error("[web3] Lỗi getOnChainUri:", error);
    throw error;
  }
}

export async function checkProductExists(id) {
  try {
    const contract = getReadOnlyContract();
    // ✅ ERC721: Check if token has owner
    const owner = await contract.ownerOf(id);
    // ERC721 compliance: owner returns non-zero ARCHIVE_VAULT if archived
    return owner !== "0x000000000000000000000000000000000000aaaa";
  } catch (error) {
    console.error("[web3] Lỗi checkProductExists:", error);
    return false;
  }
}
