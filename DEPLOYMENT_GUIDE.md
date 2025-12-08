# 🚀 AgriChain ERC721 - Deployment & Testing Guide

## 📋 Prerequisites

### 1. Install Dependencies

```bash
# Backend (AgriChain directory)
cd AgriChain
pip install eth-ape ape-vyper

# Frontend
cd frontend
npm install
```

### 2. Setup Local Blockchain

```bash
# Option A: Ape's built-in node (in AgriChain directory)
ape networks list  # Verify ethereum:local:test network available

# Option B: Hardhat/Ganache
npx hardhat node  # Port 8545
# OR
ganache-cli -p 8545
```

---

## 🔧 Deployment Steps

### Step 1: Create Admin Account

```bash
cd AgriChain

# Import admin account (first time only)
ape accounts import admin_1
# Enter private key when prompted
# Set passphrase: IS355
```

### Step 2: Deploy Contract

```bash
# Deploy to local network
ape run scripts/deploy.py --network ethereum:local:test

# Expected output:
# ============================================================
# AgriChain ERC721 Deployment Script
# ============================================================
# ✅ Loaded admin account: 0x...
# 📦 Deploying AgriChain ERC721 contract...
# ✅ DEPLOYMENT SUCCESSFUL
# 📍 Contract Address: 0x...
# 💡 Update frontend .env with:
#    VITE_CONTRACT_ADDRESS=0x...
# ============================================================
```

### Step 3: Copy Contract Address

After deployment, copy the contract address from output and update frontend `.env`:

```bash
cd ../frontend

# Update .env file
# VITE_CONTRACT_ADDRESS=0x... (paste deployed address here)
```

---

## 🎨 Frontend Setup

### 1. Configure Environment

Edit `frontend/.env`:

```env
# Local blockchain RPC
VITE_RPC_URL=http://127.0.0.1:8545

# Contract address from deployment
VITE_CONTRACT_ADDRESS=0x4ECF02152B5fec103ceCB9CD397e1F08d80ea385

# Chain ID (local network)
VITE_CHAIN_ID=1337

# Optional: IPFS for metadata storage
# VITE_PINATA_JWT=your_pinata_jwt_here
# VITE_IPFS_GATEWAY=https://gateway.pinata.cloud
```

### 2. Start Frontend

```bash
cd frontend
npm run dev

# Opens at http://localhost:5173
```

---

## 🔐 MetaMask Configuration

### 1. Add Local Network

- Network Name: `AgriChain Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `1337`
- Currency Symbol: `ETH`

### 2. Import Test Accounts

Import one of these accounts based on your role:

**Farmer Account:**

- Address: `0x4253975Fd3f7acDDa95E73C6D5ce257322070b98`
- Private Key: (use your test account key)

**Inspector Account:**

- Address: `0x28c92AF6F35c19cDf729CaB77A24f24D3DadB89C`
- Private Key: (use your test account key)

**Logistics Account:**

- Address: `0x02972D92efB79e3c7BDa58cBAAC316493F328D5a`
- Private Key: (use your test account key)

**Retailer Account:**

- Address: `0xa96ff1610e474ca054ba849c902141eba191d8ec`
- Private Key: (use your test account key)

> ⚠️ **Note:** These addresses are configured in `scripts/deploy.py`. Update them with your actual MetaMask addresses if needed.

---

## ✅ Testing Workflow

### 1. Farmer Flow (Create Batch)

1. Connect MetaMask with Farmer account
2. Navigate to "Farmer" view
3. Click "Create New Batch"
4. Fill in batch details:
   - Name: "Lúa ST25"
   - Description: "Lúa chất lượng cao"
   - Location: "Farm coordinates: 10.762622, 106.682370"
5. Submit transaction
6. Verify batch appears in "My Batches" table

### 2. Inspector Flow (Inspect Batch)

1. Switch to Inspector account in MetaMask
2. Navigate to "Inspector" view
3. Find batch in "Batches Awaiting Inspection"
4. Click "Mark Inspected"
5. Status changes to INSPECTING

### 3. Logistics Flow (Transport)

1. Switch to Logistics account
2. Navigate to "Logistics" view
3. Batch appears after inspection
4. Click "Receive from Farmer" (transferFrom)
5. Status changes to IN_TRANSIT

### 4. Retailer Flow (Retail Process)

1. Switch to Retailer account
2. Navigate to "Retailer" view
3. Click "Receive from Logistics"
4. Status changes to DELIVERED
5. Click "Advance to RETAILED"
6. Click "Advance to CONSUMED"
7. Transfer to ARCHIVE_VAULT (0x...aaaa)

### 5. Admin Flow (Recall)

1. Switch to Admin account (deployer account)
2. Navigate to "Admin" view
3. Find batch to recall
4. Click "Recall Batch"
5. Enter reason hash
6. Status changes to RECALLED
7. Transfer to QUARANTINE_VAULT (0x...dEaD)

---

## 🧪 Verify Contract Functions

### Using Ape Console

```bash
cd AgriChain
ape console --network ethereum:local:test

# Load contract
contract = project.AgriChain.at("0x...")  # deployed address

# Check token counter
contract.tokenCounter()  # Should be 0 initially

# Verify roles
farmer_role = contract.get_FARMER_ROLE()
contract.hasRole(farmer_role, "0x4253975...")  # Should be True

# Check vaults
contract.get_ARCHIVE_VAULT()  # 0x000000000000000000000000000000000000aaaa
contract.get_QUARANTINE_VAULT()  # 0x000000000000000000000000000000000000dEaD
```

### Using Frontend Console

Open browser console (F12) and test:

```javascript
// Check contract connection
const contract = getReadOnlyContract();
console.log(await contract.tokenCounter());

// Check roles
const FARMER_ROLE = await contract.get_FARMER_ROLE();
console.log(await contract.hasRole(FARMER_ROLE, "0x4253975..."));

// Get batch info (after creating)
const batchId = 1;
console.log(await contract.getBatchStatus(batchId));
console.log(await contract.ownerOf(batchId));
console.log(await contract.tokenURI(batchId));
```

---

## 🐛 Troubleshooting

### Contract Deployment Fails

```bash
# Check if local network is running
curl http://127.0.0.1:8545

# Verify admin account exists
ape accounts list

# Check account balance
ape console --network ethereum:local:test
>>> accounts.load("admin_1").balance
```

### Frontend Cannot Connect

1. Verify `VITE_CONTRACT_ADDRESS` in `.env` matches deployed address
2. Check MetaMask network matches `VITE_CHAIN_ID`
3. Verify RPC URL is correct (`http://127.0.0.1:8545`)
4. Clear browser cache and restart frontend

### Transaction Reverts

Common errors:

- `"Missing required role"` → Account doesn't have role, check `hasRole()`
- `"Not current holder"` → Wrong account trying to advance retail status
- `"Cannot transfer in HARVESTED state"` → Must inspect batch first
- `"Recipient must be logistics"` → Wrong recipient for INSPECTING→IN_TRANSIT
- `"Recipient must be retailer"` → Wrong recipient for IN_TRANSIT→DELIVERED

### Events Not Syncing

1. Check browser console for errors
2. Verify `useProductSync.js` is attached
3. Refresh page to re-attach event listeners
4. Check if MetaMask is on correct network

---

## 📊 Deployment Checklist

- [ ] Local blockchain running (port 8545)
- [ ] Admin account created and funded
- [ ] Contract deployed successfully
- [ ] 4 roles granted (Farmer, Inspector, Logistics, Retailer)
- [ ] Frontend `.env` updated with contract address
- [ ] MetaMask connected to local network (Chain ID 1337)
- [ ] Test account imported to MetaMask
- [ ] Frontend running (http://localhost:5173)
- [ ] Can create batch (Farmer flow)
- [ ] Can inspect batch (Inspector flow)
- [ ] Can transfer through supply chain
- [ ] Events sync correctly in UI

---

## 📝 Important Constants

### Special Addresses

- **ARCHIVE_VAULT**: `0x000000000000000000000000000000000000aaaa`
- **QUARANTINE_VAULT**: `0x000000000000000000000000000000000000dEaD`

### Status Values

- `NOT_EXIST`: 0
- `HARVESTED`: 1
- `INSPECTING`: 2
- `IN_TRANSIT`: 3
- `DELIVERED`: 4
- `RETAILED`: 5
- `CONSUMED`: 6
- `RECALLED`: 7

### Role Hashes (keccak256)

Retrieved via contract getters:

- `FARMER_ROLE`: `contract.get_FARMER_ROLE()`
- `INSPECTOR_ROLE`: `contract.get_INSPECTOR_ROLE()`
- `LOGISTICS_ROLE`: `contract.get_LOGISTICS_ROLE()`
- `RETAILER_ROLE`: `contract.get_RETAILER_ROLE()`
- `ADMIN_ROLE`: `contract.get_ADMIN_ROLE()`

---

## 🎯 Next Steps After Testing

1. **Deploy to Testnet** (Sepolia/Goerli):

   ```bash
   ape run scripts/deploy.py --network ethereum:sepolia:infura
   ```

2. **Verify Contract on Etherscan**:

   - Use Vyper 0.4.3 compiler
   - Upload `AgriChain.vy` source

3. **Configure Frontend for Testnet**:

   ```env
   VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   VITE_CONTRACT_ADDRESS=0x...
   VITE_CHAIN_ID=11155111
   ```

4. **Enable IPFS for Production**:
   - Get Pinata JWT from https://app.pinata.cloud/
   - Update `VITE_PINATA_JWT` in `.env`
   - Test metadata upload/retrieval

---

## 📚 Additional Resources

- **Smart Contract**: `AgriChain/contracts/AgriChain.vy`
- **Tests**: `AgriChain/tests/` (72 tests, run with `ape test`)
- **Frontend Docs**: `frontend/IPFS_SETUP_GUIDE.md`
- **Migration Guide**: `MIGRATION_SUMMARY.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

**Status**: ✅ Ready for deployment and testing!
