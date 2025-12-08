import { ethers } from "ethers";

export function toLocationHash(locationString) {
  if (!locationString || !locationString.trim()) {
    return "0x" + "0".repeat(64);
  }
  return ethers.keccak256(ethers.toUtf8Bytes(locationString.trim()));
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}
