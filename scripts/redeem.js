require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Load Provider and Signer from environment variables
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 2. Get contract address & define the ABI for the redeem function and balance check
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByteABI = [
    "function redeem(uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)"
  ];

  // 3. Connect to the GoldByte contract
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, signer);

  // 4. Define the redemption parameter
  const redeemAmount = ethers.parseUnits("50", 18); // Redeem 50 GB tokens

  // 5. Check token balance before redemption
  const balanceBefore = await goldByte.balanceOf(signer.address);
  console.log(`📊 Your token balance before redemption: ${ethers.formatUnits(balanceBefore, 18)} GB`);

  if (balanceBefore < redeemAmount) {
    console.log("❌ Insufficient token balance to redeem.");
    return;
  }

  // 6. Redeem tokens (this will burn tokens and reduce the locked gold reserve)
  console.log(`🔹 Redeeming ${ethers.formatUnits(redeemAmount, 18)} GB...`);
  const tx = await goldByte.redeem(redeemAmount);
  await tx.wait();
  console.log(`✅ Redemption successful! TX Hash: ${tx.hash}`);

  // 7. Check token balance after redemption
  const balanceAfter = await goldByte.balanceOf(signer.address);
  console.log(`📊 Your token balance after redemption: ${ethers.formatUnits(balanceAfter, 18)} GB`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
