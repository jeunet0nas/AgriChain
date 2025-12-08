# AgriChain: AI Coding Assistant Instructions

## Project Overview

AgriChain is a blockchain-based agricultural supply chain tracking system with role-based access control. The system consists of:

- **Smart contract**: Vyper ERC721 contract (`AgriChain/contracts/AgriChain.vy`) enforcing a state machine for product batches
- **Frontend**: Vue 3 + Vite SPA with ethers.js Web3 integration and Pinata IPFS storage

## Architecture Fundamentals

### State Machine & Role Flow

The contract enforces a strict lifecycle with 8 states that batches progress through:

```
NOT_EXIST → HARVESTED → INSPECTING → IN_TRANSIT → DELIVERED → RETAILED → CONSUMED
                                    ↘ RECALLED (quarantine vault)
```

**Critical rules encoded in `_agri_transfer()` and `_recipient_allowed_for_status()`:**

- HARVESTED: Cannot transfer (farmer holds until inspection)
- INSPECTING→IN_TRANSIT: Only LOGISTICS_ROLE can receive, must be from farmer wallet
- IN_TRANSIT→DELIVERED: Only RETAILER_ROLE can receive, must be from logistics wallet
- RECALLED: Can only transfer to `QUARANTINE_VAULT` (0x...dEaD)
- CONSUMED: Can only transfer to `ARCHIVE_VAULT` (0x...0000)

### Smart Contract Key Concepts

- **ERC721 NFT**: Each batch is a unique token (tokenId), not fungible. Frontend cũ dùng ERC1155 - phải migrate!
- **Minting**: `mintBatch(_uri)` tạo batch mới, return batchId. Không có parameter `initialSupply` hoặc `locationHash`
- **Role-based functions**: Use `_checkRole()` internally; roles are keccak256 hashes (FARMER_ROLE, INSPECTOR_ROLE, etc.)
- **Status transitions**:
  - HARVESTED→INSPECTING: `markBatchInspected(_batchId)` (Inspector only)
  - INSPECTING→IN_TRANSIT: `transferFrom()` to Logistics wallet (triggers auto transition)
  - IN_TRANSIT→DELIVERED: `transferFrom()` to Retailer wallet (triggers auto transition)
  - DELIVERED→RETAILED→CONSUMED: `advanceBatchRetailStatus(_batchId)` (Retailer only)
  - Any→RECALLED: `markBatchRecalled(_batchId, _reasonHash)` (Admin only)
- **Special vaults**: ARCHIVE_VAULT (0x0...000) and QUARANTINE_VAULT (0x0...dEaD) for terminal states

### Frontend Architecture

#### Data Flow Pattern

```
Vue Components → Pinia Stores → Web3 Client → Contract/IPFS
                ↓
         Event Listeners (useProductSync.js)
```

**Never** bypass stores - all contract interactions go through:

1. `contractClient.js` (read-only/signer contract instances)
2. `useProductsStore.js` (state management)
3. `useProductSync.js` (blockchain event sync)

#### IPFS Integration (Critical)

Two modes based on env configuration:

- **Production**: Pinata IPFS (`VITE_PINATA_JWT` set) - cross-browser metadata
- **Development**: localStorage (`local://hash`) - single-browser only

**When adding metadata features:**

- Always check `isIPFSConfigured()` from `ipfsClient.js`
- Use `uploadMetadataToIPFS(metadata)` → returns `ipfs://CID`
- Never assume localStorage works across browsers (see `metadataSync.js` workarounds)

## Development Workflows

### Running the Application

```powershell
# Frontend (from frontend/ directory)
npm install
npm run dev  # http://localhost:5173

# Configure Pinata IPFS (REQUIRED for metadata)
# 1. Get JWT from https://app.pinata.cloud/
# 2. Create frontend/.env:
#    VITE_PINATA_JWT=eyJhbGciOi...
#    VITE_IPFS_GATEWAY=https://gateway.pinata.cloud
#    VITE_CONTRACT_ADDRESS=0x...
```

### Contract Development

- Framework: **Ape** (ape-config.yaml)
- No scripts/tests currently - manually deploy with Ape CLI
- When modifying contract: Update `CONTRACT_ABI` in `frontend/src/web3/contractConfig.js`

### Debugging Web3 Issues

```javascript
// Check contract connection
const contract = getReadOnlyContract();
console.log(await contract.tokenCounter()); // Should return current batch count

// Check batch status
const status = await contract.batchStatus(batchId); // 0-7
const owner = await contract.ownerOf(batchId); // Current holder address

// Check role assignment
const FARMER_ROLE = await contract.get_FARMER_ROLE();
const hasRole = await contract.hasRole(FARMER_ROLE, address);

// Get batch URI (IPFS metadata)
const uri = await contract.tokenURI(batchId);

// Monitor events live
// See useProductSync.js attachGlobalEventListeners() for pattern
```

## Project-Specific Conventions

### Status vs Role Naming

- Contract uses numbers: `0-7` for states
- Frontend uses strings: `"HARVESTED"`, `"INSPECTING"`, etc.
- Mapping in `STATUS_MAP` (useProductSync.js:92)

### View Components Pattern

Each role has a dedicated view (`FarmerView.vue`, `InspectorView.vue`, etc.) that:

1. Filters products by `currentHolderRole` matching their role
2. Uses `RoleProductTable.vue` for consistent table rendering
3. Provides role-specific actions via `#actions` slot

Example from `FarmerView.vue`:

```vue
<RoleProductTable :products="farmerProducts" title="Các lô do bạn đang nắm giữ">
  <template #actions="{ product }">
    <button @click="sendToLogistics(product)">Gửi</button>
  </template>
</RoleProductTable>
```

### Error Handling Patterns

- Contract reverts: Catch in try/catch, extract error message from ethers
- IPFS failures: Fallback to localStorage mode (see `ipfsClient.js:25`)
- MetaMask disconnects: Check `session.isConnected` in components

### State Management Rules

**Always** use Pinia store methods, never mutate `products` array directly:

```javascript
// ✅ Correct
productsStore.updateStatus(id, "INSPECTING", { actor: address });

// ❌ Wrong
productsStore.products.find((p) => p.id === id).status = "INSPECTING";
```

## Critical Integration Points

### Contract Events → Frontend Sync

`useProductSync.js` listens to:

- `BatchMinted(batchId, farmer)` → creates product in store
- `StatusUpdated(batchId, updater, oldStatus, newStatus)` → updates status + adds event to timeline
- `BatchInspected(batchId, inspector)` → marks inspection complete
- `BatchRecalled(batchId, caller, reasonHash)` → handles recalls
- `BatchArchived(batchId, caller, archiveWallet)` → final state
- `Transfer(_from, _to, tokenId)` → ERC721 ownership changes (drives state transitions)

**Singleton pattern**: Only attach listeners once globally (see `globalListenersAttached` flag)

⚠️ **CRITICAL**: Frontend cũ dùng events từ ERC1155 (`ProductRegistered`, `ProductAttested`) - phải migrate sang ERC721 events!

### Location Data Storage

⚠️ **CHANGED**: Smart contract mới KHÔNG nhận `locationHash` parameter. Location data phải lưu trong IPFS metadata:

```javascript
// ❌ OLD - locationHash as contract parameter
const locationHash = toLocationHash("Farm coordinates: 10.762622, 106.682370");
await contract.registerProductType(uri, initialSupply, locationHash);

// ✅ NEW - location in IPFS metadata
const metadata = {
  name: "Lúa ST25",
  description: "Mô tả",
  location: "Farm coordinates: 10.762622, 106.682370", // Store here
  image: "ipfs://...",
};
const uri = await uploadMetadataToIPFS(metadata);
await contract.mintBatch(uri); // Only URI parameter
```

`locationUtils.js` vẫn có thể dùng cho hashing nội bộ, nhưng không gửi lên contract.

### Cross-Browser Metadata Sharing

If IPFS not configured, users must manually export/import via `MetadataSyncPanel.vue`:

- Export: `exportAllMetadata()` → JSON download
- Import: `importMetadataFromJSON()` → load into localStorage

## Migration: ERC1155 → ERC721

### Breaking Changes

Frontend cũ được viết cho ERC1155 contract, smart contract mới là ERC721. Phải sửa:

#### 1. Function Names Changed

```javascript
// ❌ OLD (ERC1155)
await contract.registerProductType(uri, initialSupply, locationHash);
await contract.attestProduct(id, locationHash);
await contract.progressRetailStatus(id, locationHash);
await contract.mandateRecall(id, reasonHash);
await contract.getProductStatus(id);

// ✅ NEW (ERC721)
await contract.mintBatch(uri); // No initialSupply, no locationHash
await contract.markBatchInspected(batchId);
await contract.advanceBatchRetailStatus(batchId);
await contract.markBatchRecalled(batchId, reasonHash);
await contract.batchStatus(batchId); // Not a function, it's a public variable
await contract.getBatchStatus(batchId); // Use this instead
```

#### 2. Events Changed

```javascript
// ❌ OLD Events
ProductRegistered(productId, farmer, initialSupply, locationHash);
ProductAttested(productId, inspector, locationHash);
StatusUpdated(productId, updater, oldStatus, newStatus, locationHash);
ProductRecalled(productId, caller, reasonHash);

// ✅ NEW Events
BatchMinted(batchId, farmer);
BatchInspected(batchId, inspector);
StatusUpdated(batchId, updater, oldStatus, newStatus); // No locationHash
BatchRecalled(batchId, caller, reasonHash);
Transfer(_from, _to, tokenId); // ERC721 standard
```

#### 3. Key Differences

- **No initialSupply**: ERC721 = 1 token per batch, không có quantity
- **No locationHash in events**: Location data phải lưu trong IPFS metadata
- **Transfer-based flow**: State transitions happen via ERC721 `transferFrom()`, không phải function calls
- **tokenURI vs uri()**: ERC721 dùng `tokenURI(tokenId)`, ERC1155 dùng `uri(id)`

#### 4. Files Need Update

- `contractConfig.js`: Update CONTRACT_ABI from new contract
- `contractClient.js`: Change `getProductStatus()` to `getBatchStatus()`
- `useProductSync.js`: Update event listeners (ProductRegistered → BatchMinted, etc.)
- `FarmerCreateBatchForm.vue`: Change `registerProductType()` to `mintBatch()`
- All components: Remove references to `initialSupply`, `locationHash` parameters

## Common Gotchas

1. **ABI mismatch**: `contractConfig.js` has OLD ERC1155 ABI, contract is ERC721. Functions will fail with "method not found"
2. **Function name errors**: Frontend calls `registerProductType()`, contract has `mintBatch()`. Update all references
3. **Event listener crashes**: Frontend listens for `ProductRegistered`, contract emits `BatchMinted`. Update `useProductSync.js`
4. **Role checks fail**: Ensure address has role via `grantRole()` by ADMIN before calling restricted functions
5. **Transfer reverts**: Check status allows transfer (see state machine rules above)
6. **Events not syncing**: Verify MetaMask is on correct network, check browser console for listener errors
7. **Missing metadata**: IPFS gateway slow/down → set `VITE_IPFS_GATEWAY` to alternative (Cloudflare, IPFS.io)
8. **Router navigation**: Role guards currently commented out (`router/index.js:58`) - implement if needed
9. **getBatchStatus() not function**: `batchStatus` is public variable, use `contract.batchStatus(id)` or getter `contract.getBatchStatus(id)`

## Key Files Reference

- Contract logic: `AgriChain/contracts/AgriChain.vy`
- Web3 connection: `frontend/src/web3/contractClient.js`
- State management: `frontend/src/stores/useProductsStore.js`
- Event sync: `frontend/src/stores/useProductSync.js`
- IPFS setup: `frontend/IPFS_SETUP_GUIDE.md`
