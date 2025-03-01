// require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config(); // Load environment variables

module.exports = {
  solidity: "0.8.17",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",  // Infura RPC for Sepolia
      chainId: 11155111, // Sepolia Testnet Chain ID
      accounts: process.env.PRIVATE_KEY ? [`${process.env.PRIVATE_KEY}`] : [],
    },
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY
  // },
};
