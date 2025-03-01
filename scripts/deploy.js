async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying GoldByte with account:", deployer.address);

  const GoldByte = await ethers.getContractFactory("GoldByte");
  const goldByte = await GoldByte.deploy(); // ✅ Deploy contract
  await goldByte.waitForDeployment(); // ✅ Replaces .deployed() in Ethers v6

  console.log("GoldByte deployed to:", await goldByte.getAddress()); // ✅ Correct way to get address
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
