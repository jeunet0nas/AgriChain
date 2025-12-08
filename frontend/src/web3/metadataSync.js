/**
 * 🔧 WORKAROUND: Sync metadata giữa các browsers
 *
 * Vấn đề: localStorage chỉ tồn tại trong 1 browser, không chia sẻ được
 *
 * Giải pháp tạm thời:
 * 1. Export metadata từ Farmer browser
 * 2. Import vào Inspector/Admin browsers
 *
 * Giải pháp production:
 * - Dùng IPFS cho metadata decentralized
 * - Dùng backend API cho metadata centralized
 */

/**
 * Export tất cả metadata từ localStorage
 * @returns {Object} Object chứa tất cả metadata với key là hash
 */
export function exportAllMetadata() {
  const metadata = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("metadata_")) {
      const hash = key.replace("metadata_", "");
      const value = localStorage.getItem(key);
      try {
        metadata[hash] = JSON.parse(value);
      } catch (e) {
        console.warn(`Failed to parse metadata for ${key}:`, e);
      }
    }
  }

  console.log(
    `[MetadataSync] Exported ${Object.keys(metadata).length} metadata entries`
  );
  return metadata;
}

/**
 * Import metadata vào localStorage
 * @param {Object} metadata - Object chứa metadata với key là hash
 * @returns {number} Số lượng metadata đã import
 */
export function importAllMetadata(metadata) {
  let count = 0;

  for (const [hash, data] of Object.entries(metadata)) {
    try {
      const key = `metadata_${hash}`;
      localStorage.setItem(key, JSON.stringify(data));
      count++;
    } catch (e) {
      console.warn(`Failed to import metadata for ${hash}:`, e);
    }
  }

  console.log(`[MetadataSync] Imported ${count} metadata entries`);
  return count;
}

/**
 * Copy metadata JSON vào clipboard
 */
export async function copyMetadataToClipboard() {
  const metadata = exportAllMetadata();
  const json = JSON.stringify(metadata, null, 2);

  try {
    await navigator.clipboard.writeText(json);
    console.log("[MetadataSync] ✅ Metadata copied to clipboard!");
    return true;
  } catch (e) {
    console.error("[MetadataSync] ❌ Failed to copy:", e);
    return false;
  }
}

/**
 * Import metadata từ JSON string
 * @param {string} jsonString - JSON string chứa metadata
 */
export function importMetadataFromJSON(jsonString) {
  try {
    const metadata = JSON.parse(jsonString);
    return importAllMetadata(metadata);
  } catch (e) {
    console.error("[MetadataSync] Failed to parse JSON:", e);
    throw new Error("Invalid JSON format");
  }
}

/**
 * Download metadata dưới dạng file JSON
 */
export function downloadMetadataFile() {
  const metadata = exportAllMetadata();
  const json = JSON.stringify(metadata, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `agrichain-metadata-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("[MetadataSync] ✅ Metadata downloaded as file");
}

/**
 * Upload metadata từ file JSON
 * @param {File} file - File JSON chứa metadata
 */
export function uploadMetadataFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const count = importMetadataFromJSON(e.target.result);
        resolve(count);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
