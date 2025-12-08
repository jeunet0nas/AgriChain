/**
 * IPFS Client sử dụng Pinata API
 *
 * Pinata API Documentation: https://docs.pinata.cloud/
 */

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const IPFS_GATEWAY =
  import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud";

/**
 * Upload metadata JSON lên IPFS thông qua Pinata
 * @param {Object} metadata - Metadata object
 * @param {string} metadata.name - Tên sản phẩm
 * @param {string} metadata.description - Mô tả
 * @param {number} metadata.supply - Số lượng
 * @param {string} metadata.location - Vị trí
 * @returns {Promise<string>} URI dạng ipfs://CID
 */
export async function uploadMetadataToIPFS(metadata) {
  if (!PINATA_JWT) {
    console.error("[IPFS] Pinata JWT not configured!");
    throw new Error(
      "Pinata JWT is required. Please set VITE_PINATA_JWT in .env file"
    );
  }

  try {
    console.log("[IPFS] Uploading metadata to Pinata:", metadata);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name}-${Date.now()}`,
          },
          pinataOptions: {
            cidVersion: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[IPFS] Pinata API error:", error);
      throw new Error(
        `Pinata API error: ${error.error?.reason || response.statusText}`
      );
    }

    const result = await response.json();
    const ipfsHash = result.IpfsHash;

    console.log("[IPFS] ✅ Upload successful! CID:", ipfsHash);
    console.log(`[IPFS] View at: ${IPFS_GATEWAY}/ipfs/${ipfsHash}`);

    return `ipfs://${ipfsHash}`;
  } catch (error) {
    console.error("[IPFS] Upload failed:", error);
    throw error;
  }
}

/**
 * Fetch metadata từ IPFS
 * @param {string} uri - URI dạng ipfs://CID
 * @returns {Promise<Object>} Metadata object
 */
export async function fetchMetadataFromIPFS(uri) {
  if (!uri || !uri.startsWith("ipfs://")) {
    throw new Error("Invalid IPFS URI");
  }

  try {
    const cid = uri.replace("ipfs://", "");
    const url = `${IPFS_GATEWAY}/ipfs/${cid}`;

    console.log("[IPFS] Fetching metadata from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const metadata = await response.json();
    console.log("[IPFS] ✅ Fetched metadata:", metadata);

    return metadata;
  } catch (error) {
    console.error("[IPFS] Fetch failed:", error);
    throw error;
  }
}

/**
 * Test Pinata connection
 * @returns {Promise<boolean>}
 */
export async function testPinataConnection() {
  if (!PINATA_JWT) {
    console.error("[IPFS] Pinata JWT not configured!");
    return false;
  }

  try {
    const response = await fetch(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log("[IPFS] ✅ Pinata connection successful:", result);
      return true;
    } else {
      console.error("[IPFS] ❌ Pinata authentication failed");
      return false;
    }
  } catch (error) {
    console.error("[IPFS] ❌ Pinata connection error:", error);
    return false;
  }
}

/**
 * Check if IPFS/Pinata is configured
 * @returns {boolean}
 */
export function isIPFSConfigured() {
  return !!PINATA_JWT;
}

/**
 * Upload image file lên IPFS thông qua Pinata
 * @param {File} file - File object từ input[type="file"]
 * @param {Function} onProgress - Callback nhận progress (0-100)
 * @returns {Promise<string>} CID của ảnh (không có prefix ipfs://)
 */
export async function uploadImageToIPFS(file, onProgress = null) {
  if (!PINATA_JWT) {
    console.error("[IPFS] Pinata JWT not configured!");
    throw new Error(
      "Pinata JWT is required. Please set VITE_PINATA_JWT in .env file"
    );
  }

  // Validate file type
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP, GIF");
  }

  // Validate file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    throw new Error(
      `Kích thước file vượt quá ${Math.round(MAX_SIZE / 1024 / 1024)}MB`
    );
  }

  try {
    console.log("[IPFS] Uploading image to Pinata:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: `product-image-${Date.now()}-${file.name}`,
      })
    );
    formData.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 1,
      })
    );

    // Upload với XMLHttpRequest để track progress
    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error("Invalid response from Pinata"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(
              new Error(
                `Pinata error: ${error.error?.reason || xhr.statusText}`
              )
            );
          } catch (e) {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was cancelled"));
      });

      xhr.open("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS");
      xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);
      xhr.send(formData);
    });

    const ipfsHash = result.IpfsHash;

    console.log("[IPFS] ✅ Image upload successful! CID:", ipfsHash);
    console.log(`[IPFS] View at: ${IPFS_GATEWAY}/ipfs/${ipfsHash}`);

    return ipfsHash; // Return CID only (without ipfs:// prefix)
  } catch (error) {
    console.error("[IPFS] Image upload failed:", error);
    throw error;
  }
}

/**
 * Fetch image từ IPFS với fallback gateways
 * @param {string} cid - IPFS CID (có hoặc không có ipfs:// prefix)
 * @returns {Promise<Blob>} Image blob
 */
export async function fetchImageFromIPFS(cid) {
  // Remove ipfs:// prefix if exists
  const cleanCID = cid.replace("ipfs://", "");

  const FALLBACK_GATEWAYS = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
  ];

  console.log("[IPFS] Fetching image from IPFS:", cleanCID);

  for (const gateway of FALLBACK_GATEWAYS) {
    try {
      const url = gateway + cleanCID;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        console.log("[IPFS] ✅ Image fetched successfully from:", gateway);
        return blob;
      }
    } catch (error) {
      console.warn(`[IPFS] Gateway ${gateway} failed:`, error.message);
      // Continue to next gateway
    }
  }

  throw new Error("All IPFS gateways failed to fetch image");
}

/**
 * Upload PDF file lên IPFS thông qua Pinata
 * @param {File} file - File object từ input[type="file"]
 * @param {Function} onProgress - Callback nhận progress (0-100)
 * @returns {Promise<string>} CID của PDF (không có prefix ipfs://)
 */
export async function uploadPDFToIPFS(file, onProgress = null) {
  if (!PINATA_JWT) {
    console.error("[IPFS] Pinata JWT not configured!");
    throw new Error(
      "Pinata JWT is required. Please set VITE_PINATA_JWT in .env file"
    );
  }

  // Validate file type
  if (file.type !== "application/pdf") {
    throw new Error("Chỉ chấp nhận file PDF");
  }

  // Validate file size (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error(
      `Kích thước file vượt quá ${Math.round(MAX_SIZE / 1024 / 1024)}MB`
    );
  }

  try {
    console.log("[IPFS] Uploading PDF to Pinata:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: `certificate-${Date.now()}-${file.name}`,
      })
    );
    formData.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 1,
      })
    );

    // Upload với XMLHttpRequest để track progress
    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error("Invalid response from Pinata"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(
              new Error(
                `Pinata error: ${error.error?.reason || xhr.statusText}`
              )
            );
          } catch (e) {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was cancelled"));
      });

      xhr.open("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS");
      xhr.setRequestHeader("Authorization", `Bearer ${PINATA_JWT}`);
      xhr.send(formData);
    });

    const ipfsHash = result.IpfsHash;

    console.log("[IPFS] ✅ PDF upload successful! CID:", ipfsHash);
    console.log(`[IPFS] View at: ${IPFS_GATEWAY}/ipfs/${ipfsHash}`);

    return ipfsHash; // Return CID only (without ipfs:// prefix)
  } catch (error) {
    console.error("[IPFS] PDF upload failed:", error);
    throw error;
  }
}

/**
 * Fetch PDF từ IPFS với fallback gateways
 * @param {string} cid - IPFS CID (có hoặc không có ipfs:// prefix)
 * @returns {Promise<Blob>} PDF blob
 */
export async function fetchPDFFromIPFS(cid) {
  // Remove ipfs:// prefix if exists
  const cleanCID = cid.replace("ipfs://", "");

  const FALLBACK_GATEWAYS = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
  ];

  console.log("[IPFS] Fetching PDF from IPFS:", cleanCID);

  for (const gateway of FALLBACK_GATEWAYS) {
    try {
      const url = gateway + cleanCID;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for PDF

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        console.log("[IPFS] ✅ PDF fetched successfully from:", gateway);
        return blob;
      }
    } catch (error) {
      console.warn(`[IPFS] Gateway ${gateway} failed:`, error.message);
      // Continue to next gateway
    }
  }

  throw new Error("All IPFS gateways failed to fetch PDF");
}
