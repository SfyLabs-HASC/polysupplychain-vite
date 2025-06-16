// FILE: src/abi/contractABI.ts
// Questo file contiene l'ABI ufficiale del contratto SupplyChainV2.
// L'ABI è l'interfaccia che descrive tutte le funzioni e gli eventi del contratto
// e permette a librerie come ethers.js o web3.js di interagire con esso correttamente.

export const supplyChainABI = [

	// ───── Constructor ─────
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},

	// ───── Events ─────
	{
		"name": "BatchClosed",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "contributor", "type": "address" },
			{ "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" }
		]
	},
	{
		"name": "BatchInitialized",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "contributor", "type": "address" },
			{ "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
			{ "indexed": false, "internalType": "string", "name": "name", "type": "string" }
		]
	},
	{
		"name": "BatchStepAdded",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "contributor", "type": "address" },
			{ "indexed": true, "internalType": "uint256", "name": "batchId", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "stepIndex", "type": "uint256" }
		]
	},
	{
		"name": "ContributorAdded",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "contributorAddress", "type": "address" },
			{ "indexed": false, "internalType": "string", "name": "name", "type": "string" }
		]
	},
	{
		"name": "ContributorCreditsSet",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "contributorAddress", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "newCreditBalance", "type": "uint256" }
		]
	},
	{
		"name": "ContributorStatusChanged",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "contributorAddress", "type": "address" },
			{ "indexed": false, "internalType": "bool", "name": "isActive", "type": "bool" }
		]
	},
	{
		"name": "OwnerSet",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "oldOwner", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
		]
	},
	{
		"name": "SuperOwnerChanged",
		"type": "event",
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "oldSuperOwner", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "newSuperOwner", "type": "address" }
		]
	},

	// ───── Write Functions (modifica stato) ─────
	{ "name": "addContributor", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "address", "name": "_contributorAddress", "type": "address" }, { "internalType": "string", "name": "_name", "type": "string" } ], "outputs": [] },
	{ "name": "initializeBatch", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "string", "name": "_description", "type": "string" }, { "internalType": "string", "name": "_date", "type": "string" }, { "internalType": "string", "name": "_location", "type": "string" }, { "internalType": "string", "name": "_imageIpfsHash", "type": "string" } ], "outputs": [] },
	{ "name": "addStepToBatch", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "uint256", "name": "_batchId", "type": "uint256" }, { "internalType": "string", "name": "_eventName", "type": "string" }, { "internalType": "string", "name": "_description", "type": "string" }, { "internalType": "string", "name": "_date", "type": "string" }, { "internalType": "string", "name": "_location", "type": "string" }, { "internalType": "string", "name": "_attachmentsIpfsHash", "type": "string" } ], "outputs": [] },
	{ "name": "closeBatch", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "uint256", "name": "_batchId", "type": "uint256" } ], "outputs": [] },
	{ "name": "deactivateContributor", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "address", "name": "_contributorAddress", "type": "address" } ], "outputs": [] },
	{ "name": "setContributorCredits", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "address", "name": "_contributorAddress", "type": "address" }, { "internalType": "uint256", "name": "_credits", "type": "uint256" } ], "outputs": [] },
	{ "name": "setOwner", "type": "function", "stateMutability": "nonpayable", "inputs": [ { "internalType": "address", "name": "_newOwner", "type": "address" } ], "outputs": [] },

	// ───── Read Functions (view/pure) ─────
	{ "name": "owner", "type": "function", "stateMutability": "view", "inputs": [], "outputs": [ { "internalType": "address", "name": "", "type": "address" } ] },
	{ "name": "superOwner", "type": "function", "stateMutability": "view", "inputs": [], "outputs": [ { "internalType": "address", "name": "", "type": "address" } ] },
	{ "name": "batches", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "outputs": [ { "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "contributor", "type": "address" }, { "internalType": "string", "name": "contributorName", "type": "string" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "description", "type": "string" }, { "internalType": "string", "name": "date", "type": "string" }, { "internalType": "string", "name": "location", "type": "string" }, { "internalType": "string", "name": "imageIpfsHash", "type": "string" }, { "internalType": "bool", "name": "isClosed", "type": "bool" } ] },
	{ "name": "contributors", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "outputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "credits", "type": "uint256" }, { "internalType": "bool", "name": "isActive", "type": "bool" } ] },
	{ "name": "contributorBatches", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ] },
	{ "name": "getBatchesByContributor", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "address", "name": "_contributor", "type": "address" } ], "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ] },
	{ "name": "getBatchInfo", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "uint256", "name": "_batchId", "type": "uint256" } ], "outputs": [ { "components": [...], "internalType": "struct SupplyChainV2.Batch", "name": "", "type": "tuple" } ] },
	{ "name": "getBatchStepCount", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "uint256", "name": "_batchId", "type": "uint256" } ], "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ] },
	{ "name": "getBatchStep", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "uint256", "name": "_batchId", "type": "uint256" }, { "internalType": "uint256", "name": "_stepIndex", "type": "uint256" } ], "outputs": [ { "components": [...], "internalType": "struct SupplyChainV2.Step", "name": "", "type": "tuple" } ] },
	{ "name": "getContributorInfo", "type": "function", "stateMutability": "view", "inputs": [ { "internalType": "address", "name": "_contributorAddress", "type": "address" } ], "outputs": [ { "components": [...], "internalType": "struct SupplyChainV2.Contributor", "name": "", "type": "tuple" } ] }

] as const;
