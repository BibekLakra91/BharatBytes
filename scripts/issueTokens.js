require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Load Provider & Signer using the bank's credentials.
  //    (The bank’s private key must correspond to a wallet that is registered under the given bank code.)
  const provider = new ethers.JsonRpcProvider(process.env.IMF_RPC_URL);
  const signer = new ethers.Wallet(process.env.BANK_PRIVATE_KEY, provider);

  // 2. Define contract details using the updated ABI.
  //    Note: Removed bannedRedeemBanks from the function signature.
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByteABI = [
    "function issueTokens(address account, uint256 amount, string calldata issuerBank, string calldata accountAffiliation) external",
    "function balanceOf(address owner) view returns (uint256)",
    "function getGoldReserve() view returns (uint256)"
  ];

  // 3. Connect to the GoldByte contract.
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, signer);

  // 4. Define issuance parameters.
  //    If RECEIVER_WALLET is not provided, the bank issues tokens to its own wallet.
  const mintTo = process.env.RECEIVER_WALLET || signer.address;
  const amount = "100"; // 100 GB tokens (each token represents 1 gram of gold)
  const decimals = 18;
  const parsedAmount = ethers.parseUnits(amount, decimals);

  // Read the issuer bank code from ISSUER_BANK (e.g., "LBG")
  const issuerBank = process.env.ISSUER_BANK;
  if (!issuerBank) {
    console.error("ISSUER_BANK not defined in .env");
    process.exit(1);
  }

  // Account affiliation defaults to the issuer bank if not provided.
  const accountAffiliation = process.env.ACCOUNT_AFFILIATION || issuerBank;

  console.log(`Attempting to issue ${amount} GB tokens to ${mintTo} from bank ${issuerBank}...`);

  // 5. Call issueTokens with the new signature.
  const tx = await goldByte.issueTokens(mintTo, parsedAmount, issuerBank, accountAffiliation);
  await tx.wait();
  console.log(`✅ Successfully issued ${amount} GB tokens to ${mintTo} from bank ${issuerBank}`);
  console.log("Transaction Hash:", tx.hash);

  // 6. Check the token balance of the recipient.
  const tokenBalance = await goldByte.balanceOf(mintTo);
  console.log(`📊 Token balance of ${mintTo}: ${ethers.formatUnits(tokenBalance, 18)} GB`);

  // 7. Check the global gold reserve (locked tokens).
  const goldReserve = await goldByte.getGoldReserve();
  console.log(`🏦 Total Gold Reserve: ${ethers.formatUnits(goldReserve, 18)} grams`);

  // 8. If issuing to self, print active GoldByte issued by this bank.
  if (mintTo.toLowerCase() === signer.address.toLowerCase()) {
    console.log(`🏦 Active GoldByte issued by bank ${issuerBank}: ${ethers.formatUnits(tokenBalance, 18)} grams`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
