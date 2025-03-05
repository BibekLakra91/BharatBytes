require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Set up provider and signer using the IMF's credentials
  const provider = new ethers.JsonRpcProvider(process.env.IMF_RPC_URL);
  const signer = new ethers.Wallet(process.env.IMF_PRIVATE_KEY, provider);

  // 2. Define the ABI that includes the updateRegisteredBank and getBankCodes functions
  const goldByteABI = [
    // Function to update the bank registration mapping:
    "function updateRegisteredBank(string calldata bankCode, address bankAddress) external",
    // Auto-generated getter for registeredBanks mapping:
    "function registeredBanks(string calldata) external view returns (address)",
    // Function to get the complete list of bank codes (assumed added to contract)
    "function getBankCodes() external view returns (string[] memory)"
  ];

  // 3. Connect to the GoldByte contract using IMF's signer
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, signer);

  // 5. Retrieve the entire registered bank list.
  // Note: This script assumes the contract implements a getBankCodes() function.
  const bankCodes = await goldByte.getBankCodes();
  console.log("\nRegistered Bank List:");
  for (let i = 0; i < bankCodes.length; i++) {
    const code = bankCodes[i];
    const wallet = await goldByte.registeredBanks(code);
    console.log(`Bank Code: ${code}, Wallet Address: ${wallet}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
