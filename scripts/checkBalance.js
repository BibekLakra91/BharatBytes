require("dotenv").config();
const { ethers } = require("ethers");  // ✅ Use "ethers" from "ethers.js", not "hardhat"

async function main() {
  // ✅ Load provider correctly
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // ✅ Load wallet signer
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // ✅ Define contract details
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByteABI = [
    "function balanceOf(address owner) view returns (uint256)"
  ]; // ✅ Ensure ABI has "balanceOf" function
  
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, provider);
  
  console.log(`🔍 Checking balance for: ${signer.address}`);

  // ✅ Get balance
  const balance = await goldByte.balanceOf(signer.address);
  console.log(`📊 Your GoldByte balance: ${ethers.formatUnits(balance, 18)} GB`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
