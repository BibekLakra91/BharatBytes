// require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config(); // Load environment variables

module.exports = {
  solidity: "0.8.17",
  networks: {
    sepolia: {
      url: process.env.IMF_RPC_URL  || "",  // Infura RPC for Sepolia
      chainId: 11155111, // Sepolia Testnet Chain ID
      accounts: process.env.IMF_PRIVATE_KEY ? [`0x${process.env.IMF_PRIVATE_KEY}`] : [],
      // accounts: process.env.SENDER_PRIVATE_KEY ? [`0x${process.env.SENDER_PRIVATE_KEY}`] : [],
    },
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY
  // },
};
