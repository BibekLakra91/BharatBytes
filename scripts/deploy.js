async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying GoldByte with account:", deployer.address);
  
    const GoldByte = await ethers.getContractFactory("GoldByte");
    const goldByte = await GoldByte.deploy();
    await goldByte.deployed();
  
    console.log("GoldByte deployed to:", goldByte.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  