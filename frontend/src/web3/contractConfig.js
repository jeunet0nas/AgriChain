export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        name: "_from",
        type: "address",
        indexed: true,
      },
      {
        name: "_to",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
      },
      {
        name: "approved",
        type: "address",
        indexed: true,
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
      },
      {
        name: "operator",
        type: "address",
        indexed: true,
      },
      {
        name: "approved",
        type: "bool",
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "URI",
    inputs: [
      {
        name: "value",
        type: "string",
        indexed: false,
      },
      {
        name: "tokenId",
        type: "uint256",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "StatusUpdated",
    inputs: [
      {
        name: "batchId",
        type: "uint256",
        indexed: true,
      },
      {
        name: "updater",
        type: "address",
        indexed: true,
      },
      {
        name: "oldStatus",
        type: "uint256",
        indexed: false,
      },
      {
        name: "newStatus",
        type: "uint256",
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BatchMinted",
    inputs: [
      {
        name: "batchId",
        type: "uint256",
        indexed: true,
      },
      {
        name: "farmer",
        type: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BatchInspected",
    inputs: [
      {
        name: "batchId",
        type: "uint256",
        indexed: true,
      },
      {
        name: "inspector",
        type: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RoleGranted",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "account",
        type: "address",
        indexed: true,
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RoleRevoked",
    inputs: [
      {
        name: "role",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "account",
        type: "address",
        indexed: true,
      },
      {
        name: "sender",
        type: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BatchArchived",
    inputs: [
      {
        name: "batchId",
        type: "uint256",
        indexed: true,
      },
      {
        name: "caller",
        type: "address",
        indexed: true,
      },
      {
        name: "archiveWallet",
        type: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BatchRecalled",
    inputs: [
      {
        name: "batchId",
        type: "uint256",
        indexed: true,
      },
      {
        name: "caller",
        type: "address",
        indexed: true,
      },
      {
        name: "reasonHash",
        type: "bytes32",
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "grantRole",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_role",
        type: "bytes32",
      },
      {
        name: "_account",
        type: "address",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeRole",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_role",
        type: "bytes32",
      },
      {
        name: "_account",
        type: "address",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      {
        name: "_role",
        type: "bytes32",
      },
      {
        name: "_account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
  {
    type: "function",
    name: "mintBatch",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_uri",
        type: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "markBatchInspected",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_batchId",
        type: "uint256",
      },
      {
        name: "_newURI",
        type: "string",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "advanceBatchRetailStatus",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_batchId",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "markBatchRecalled",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_batchId",
        type: "uint256",
      },
      {
        name: "_reasonHash",
        type: "bytes32",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateBatchURI",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_batchId",
        type: "uint256",
      },
      {
        name: "_newURI",
        type: "string",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_tokenId",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_tokenId",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_tokenId",
        type: "uint256",
      },
      {
        name: "_data",
        type: "bytes",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_tokenId",
        type: "uint256",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_operator",
        type: "address",
      },
      {
        name: "_approved",
        type: "bool",
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getApproved",
    stateMutability: "view",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_operator",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [
      {
        name: "_tokenId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
  {
    type: "function",
    name: "get_FARMER_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "get_INSPECTOR_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "get_LOGISTICS_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "get_RETAILER_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "get_ADMIN_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
  },
  {
    type: "function",
    name: "get_HARVESTED_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "get_INSPECTING_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "get_IN_TRANSIT_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "get_DELIVERED_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "get_RETAILED_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "get_CONSUMED_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "get_RECALLED_STATE",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "getBatchStatus",
    stateMutability: "view",
    inputs: [
      {
        name: "_batchId",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [
      {
        name: "_interfaceId",
        type: "bytes4",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
  {
    type: "function",
    name: "tokenOwner",
    stateMutability: "view",
    inputs: [
      {
        name: "arg0",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "operatorApprovals",
    stateMutability: "view",
    inputs: [
      {
        name: "arg0",
        type: "address",
      },
      {
        name: "arg1",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
  {
    type: "function",
    name: "tokenURIs",
    stateMutability: "view",
    inputs: [
      {
        name: "arg0",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
  },
  {
    type: "function",
    name: "tokenCounter",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "contractOwner",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "batchStatus",
    stateMutability: "view",
    inputs: [
      {
        name: "arg0",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "roles",
    stateMutability: "view",
    inputs: [
      {
        name: "arg0",
        type: "bytes32",
      },
      {
        name: "arg1",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
  },
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [],
  },
];
