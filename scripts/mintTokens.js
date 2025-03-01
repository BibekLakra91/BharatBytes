require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Load Provider & Signer
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 2. Define contract details with ABI that includes both the issueTokens and getGoldReserve functions
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByteABI = [
    "function issueTokens(address account, uint256 amount) external",
    "function balanceOf(address owner) view returns (uint256)",
    "function getGoldReserve() view returns (uint256)"
  ];

  // 3. Connect to the GoldByte Contract
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, signer);

  // 4. Define Who & How Much to Mint
  //    Use RECEIVER_WALLET if provided, otherwise default to signer's address.
  const mintTo = process.env.RECEIVER_WALLET || signer.address;
  const amount = "1000";  // 1000 GB tokens (each token represents 1 gram of gold)
  const decimals = 18;
  const parsedAmount = ethers.parseUnits(amount, decimals);

  console.log(`Minting ${amount} GB tokens to ${mintTo}...`);

  // 5. Call the issueTokens function to mint tokens and lock the equivalent gold reserve.
  const tx = await goldByte.issueTokens(mintTo, parsedAmount);
  await tx.wait();

  console.log(`✅ Successfully minted ${amount} GB tokens to ${mintTo}!`);
  console.log("Transaction Hash:", tx.hash);

  // 6. Check the token balance of the recipient
  const tokenBalance = await goldByte.balanceOf(mintTo);
  console.log(`📊 Token balance of ${mintTo}: ${ethers.formatUnits(tokenBalance, 18)} GB`);

  // 7. Check the bank's gold reserve (in grams)
  const goldReserve = await goldByte.getGoldReserve();
  console.log(`🏦 Bank's gold reserve: ${ethers.formatUnits(goldReserve, 18)} grams`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
