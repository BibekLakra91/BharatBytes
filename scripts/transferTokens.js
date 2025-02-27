require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Load environment variables
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const receiver = process.env.RECEIVER_WALLET;

  if (!rpcUrl || !privateKey || !contractAddress || !receiver) {
    throw new Error("Missing environment variables in .env (SEPOLIA_RPC_URL, PRIVATE_KEY, GOLDBYTE_CONTRACT, RECEIVER_WALLET).");
  }

  // 2. Create a provider (Ethers v6 syntax)
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // 3. Create a wallet signer
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Using Ethers v6 with the following settings:");
  console.log(`- Provider: ${rpcUrl}`);
  console.log(`- Signer:   ${wallet.address}`);
  console.log(`- Contract: ${contractAddress}`);
  console.log(`- Receiver: ${receiver}`);

  // 4. Minimal ABI for ERC20
  const goldByteABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  // 5. Connect to the GoldByte contract
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, wallet);

  // 6. Define the token amount to transfer (10 tokens, assuming 18 decimals)
  const amount = ethers.parseUnits("10", 18);

  console.log(`\nTransferring 10 tokens from ${wallet.address} to ${receiver}...`);
  const tx = await goldByte.transfer(receiver, amount);
  await tx.wait();

  console.log(`✅ Transaction successful! Hash: ${tx.hash}`);

  // 7. Check the receiver's new balance
  const newBalance = await goldByte.balanceOf(receiver);
  console.log(`Receiver's new balance: ${ethers.formatUnits(newBalance, 18)} tokens\n`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
