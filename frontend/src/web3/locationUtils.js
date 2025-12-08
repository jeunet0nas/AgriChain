import { ethers } from "ethers";

export function toLocationHash(locationString) {
  if (!locationString || !locationString.trim()) {
    return "0x" + "0".repeat(64);
  }
  return ethers.keccak256(ethers.toUtf8Bytes(locationString.trim()));
}
