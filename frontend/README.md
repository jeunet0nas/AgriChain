# AgriChain Frontend

Vue 3 + Vite application cho AgriChain - Blockchain Agricultural Supply Chain Tracking System.

## Features

- 🌾 **Role-based views**: Farmer, Inspector, Logistics, Retailer, Admin
- 🔗 **Web3 Integration**: ethers.js v6 + MetaMask
- 📦 **IPFS Storage**: Pinata for metadata, images, certificates
- 🎨 **Modern UI**: Tailwind CSS + Vue 3 Composition API
- 📊 **Timeline Tracking**: Blockchain event-based product history

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Pinata JWT and contract address

# Start dev server
npm run dev
```

## Environment Setup

See [IPFS_SETUP_GUIDE.md](IPFS_SETUP_GUIDE.md) for detailed Pinata configuration.

Required `.env` variables:

- `VITE_PINATA_JWT` - Pinata API token
- `VITE_IPFS_GATEWAY` - IPFS gateway URL
- `VITE_CONTRACT_ADDRESS` - Deployed contract address

## Architecture

### Event Synchronization

**Single Source of Truth**: Blockchain events only

- Product shells created with empty events array
- `loadPastEventsFromChain()` queries blockchain for ALL events
- Real-time listeners update state only (no event creation)
- Duplicate prevention via multi-criteria checks

### Key Files

- `src/stores/useProductSync.js` - Event synchronization composable
- `src/stores/useProductsStore.js` - Product state management
- `src/web3/contractClient.js` - Smart contract interaction
- `src/web3/ipfsClient.js` - IPFS upload/fetch utilities

## Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Learn More

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [Pinata IPFS](https://docs.pinata.cloud/)
