require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  // 1. Connect to the network and load the signer (user's account)
  const provider = new ethers.JsonRpcProvider(process.env.IMF_RPC_URL);
  const signer = new ethers.Wallet(process.env.REDEEMER_PRIVATE_KEY, provider);

  // 2. Define an ABI including:
  //    - redeem(uint256, string)
  //    - balanceOf, accountBank, getIssuanceInfo, netSettlements, and registeredBanks.
  const baseABI = [
    "function redeem(uint256 amount, string calldata chosenRedeemingBank) external",
    "function balanceOf(address account) view returns (uint256)",
    "function accountBank(address account) view returns (string)",
    "function getIssuanceInfo(address account) view returns (string)",
    "function netSettlements(string calldata, string calldata) view returns (int256)"
  ];
  const extendedABI = [
    ...baseABI,
    "function registeredBanks(string calldata) external view returns (address)"
  ];

  // 3. Connect to the GoldByte contract
  const contractAddress = process.env.GOLDBYTE_CONTRACT;
  const goldByte = new ethers.Contract(contractAddress, extendedABI, signer);

  // 4. Define the redemption amount (for example, 50 tokens)
  const redeemAmount = ethers.parseUnits("5", 18);

  // 5. Check user's total token balance
  const balanceBefore = await goldByte.balanceOf(signer.address);
  console.log(`Token balance before redemption: ${ethers.formatUnits(balanceBefore, 18)} GB`);

  if (balanceBefore < redeemAmount) {
    console.error("Insufficient token balance to redeem.");
    return;
  }

  // 6. Get the user's associated bank
  const userBank = await goldByte.accountBank(signer.address);
  console.log(`User's associated bank: ${userBank}`);

  // 7. Verify that the user's bank is registered
  const registeredUserBank = await goldByte.registeredBanks(userBank);
  if (registeredUserBank === ethers.ZeroAddress) {
    console.error(`User's bank (${userBank}) is not registered in the contract.`);
    return;
  }
  console.log(`User's bank ${userBank} is registered with address: ${registeredUserBank}`);

  // 8. Retrieve issuance info to obtain the issuer bank code.
  const issuerBank = await goldByte.getIssuanceInfo(signer.address);
  console.log(`Issuer bank for tokens: ${issuerBank}`);

  // 9. Get the chosen redeeming bank code from environment variable.
  const chosenRedeemingBank = process.env.REDEEMING_BANK_CODE;
  if (!chosenRedeemingBank) {
    console.error("REDEEMING_BANK_CODE not defined in .env");
    return;
  }
  console.log(`Chosen redeeming bank: ${chosenRedeemingBank}`);

  // 10. Call redeem() with the chosen redeeming bank.
  console.log(`Attempting to redeem ${ethers.formatUnits(redeemAmount, 18)} GB tokens at bank ${chosenRedeemingBank}...`);
  try {
    const tx = await goldByte.redeem(redeemAmount, chosenRedeemingBank);
    await tx.wait();
    console.log(`Redemption successful! TX Hash: ${tx.hash}`);
  } catch (error) {
    console.error("Redemption failed:", error);
    return;
  }

  // 11. Check updated token balance after redemption
  const balanceAfter = await goldByte.balanceOf(signer.address);
  console.log(`Token balance after redemption: ${ethers.formatUnits(balanceAfter, 18)} GB`);

  // 12. Query the settlement mapping:
  //     This shows how much the issuer bank now owes the chosen redeeming bank.
  const settlement = await goldByte.netSettlements(issuerBank, chosenRedeemingBank);
  console.log(`Settlement: Issuer bank (${issuerBank}) owes Redeeming bank (${chosenRedeemingBank}): ${settlement.toString()/10**18} gm gold`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
