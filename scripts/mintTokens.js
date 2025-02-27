require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Load Provider & Signer
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 2. Get Contract Address & ABI
  const contractAddress = process.env.GOLDBYTE_CONTRACT;  // e.g., "0x3F2F..."
  // If you have the ABI in a JSON file, import it. Otherwise, you can create a minimal ABI with just the 'issueTokens' function:
  const goldByteABI = [
    "function issueTokens(address account, uint256 amount) external"
  ];

  // 3. Connect to GoldByte Contract
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, signer);

  // 4. Define Who & How Much to Mint
  //    - Here, you can mint to your own address or a separate one
  const mintTo = process.env.RECEIVER_WALLET || signer.address; 
  //    - Amount of GB to issue
  const amount = "1000";  // Issue 1000 GB
  const decimals = 18;
  const parsedAmount = ethers.parseUnits(amount, decimals);

  console.log(`Minting ${amount} GB to ${mintTo}...`);

  // 5. Call the issueTokens function
  const tx = await goldByte.issueTokens(mintTo, parsedAmount);
  await tx.wait();

  console.log(`✅ Successfully minted ${amount} GB to ${mintTo}!`);
  console.log("Transaction Hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
