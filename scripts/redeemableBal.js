require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.IMF_RPC_URL);
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByteABI = [
    "function redeemableBalanceFor(address account, string calldata redeemingBank) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function accountBank(address account) view returns (string)"
  ];
  
  const goldByte = new ethers.Contract(contractAddress, goldByteABI, provider);
  const userAddress = process.env.USER_ADDRESS;
  const redeemingBankCode = process.env.REDEEMING_BANK_CODE;
  if (!userAddress || !redeemingBankCode) {
    console.error("USER_ADDRESS or REDEEMING_BANK_CODE not defined in .env");
    process.exit(1);
  }
  const totalBalance = await goldByte.balanceOf(userAddress);
  const redeemable = await goldByte.redeemableBalanceFor(userAddress, redeemingBankCode);
  const storedBank = await goldByte.accountBank(userAddress);
  
  console.log(`User Address: ${userAddress}`);
  console.log(`Total Token Balance: ${ethers.formatUnits(totalBalance, 18)} GB tokens`);
  console.log(`User's Associated Bank: ${storedBank}`);
  console.log(`Redeeming Bank Code Provided: ${redeemingBankCode}`);
  console.log(`Redeemable Token Balance for ${redeemingBankCode}: ${ethers.formatUnits(redeemable, 18)} GB tokens`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
