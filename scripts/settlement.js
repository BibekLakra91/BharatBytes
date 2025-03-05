require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Connect to the network
  const provider = new ethers.JsonRpcProvider(process.env.IMF_RPC_URL);

  // 2. Define the ABI with getBankCodes() and netSettlements() view functions
  const goldByteABI = [
    "function getBankCodes() external view returns (string[])",
    "function netSettlements(string calldata, string calldata) external view returns (int256)"
  ];

  // 3. Connect to the GoldByte contract
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, provider);

  // 4. Get the list of bank codes
  const bankCodes = await goldByte.getBankCodes();
  console.log("Settlement Report:");
  console.log("------------------");

  // 5. Iterate over every pair of distinct bank codes and print the settlement value
  for (let i = 0; i < bankCodes.length; i++) {
    for (let j = 0; j < bankCodes.length; j++) {
      if (i === j) continue;

      // netSettlements returns a native bigint in ethers v6
      const settlementBN = await goldByte.netSettlements(bankCodes[i], bankCodes[j]);

      // Compare to 0n instead of calling isZero()
      if (settlementBN !== 0n) {
        // Format the raw bigint to a decimal string with 18 decimals
        const settlementStr = ethers.formatUnits(settlementBN, 18);
        console.log(`Bank ${bankCodes[i]} owes Bank ${bankCodes[j]}: ${settlementStr} g Golds`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
