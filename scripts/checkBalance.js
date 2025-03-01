require("dotenv").config();
const { ethers } = require("ethers");  // Use ethers.js

async function main() {
  // Load provider
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Load wallet signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Define contract details with additional ABI for gold reserve
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByteABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function getGoldReserve() view returns (uint256)"
  ];
  
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, provider);
  
  console.log(`🔍 Checking balance for: ${signer.address}`);

  // Get user's token balance
  const balance = await goldByte.balanceOf(signer.address);
  console.log(`📊 Your GoldByte balance: ${ethers.formatUnits(balance, 18)} GB`);
  
  // Get the bank's (contract's) locked gold reserve
  const goldReserve = await goldByte.getGoldReserve();
  console.log(`🏦 Bank's gold reserve: ${ethers.formatUnits(goldReserve, 18)} g`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
