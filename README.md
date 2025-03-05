
---

## **🚀 GoldByte - Tokenized Gold on Blockchain**
GoldByte is a **gold-backed** digital currency deployed on **Ethereum Sepolia Testnet**, designed for **fast, low-cost, and scalable** cross-border transactions.

---

## **📌 Project Setup**

### **1️⃣ Prerequisites**
Before running this project, ensure you have:
- **Node.js** (v18 or above) installed. [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** for package management.
- **Metamask** installed and configured for the **Sepolia Testnet**.
- **Infura or Alchemy API key** to connect to Ethereum networks. (No need. Bibek has provided think Infura endpoint URL.)

---

### **2️⃣ Clone the Repository**
```bash
git clone https://github.com/BibekLakra91/BharatBytes
cd BharatBytes
```

---

### **3️⃣ Install Dependencies**
Run the following command to install all required dependencies:
```bash
npm install
```

This installs:
- **Hardhat** (for development & testing)
- **Ethers.js (v6)** (for interacting with smart contracts)
- **Dotenv** (for managing environment variables)

---

## **📂 Project Structure**
```
├── contracts/            # Contains Solidity smart contracts
│   ├── GoldByte.sol      # Main GoldByte ERC-20 smart contract
├── scripts/              # Automation scripts for deployment & interaction
│   ├── deploy.js         # Deploys GoldByte contract to Sepolia
│   ├── checkBalance.js   # Checks token balance of a wallet
│   ├── transferTokens.js # Transfers GoldByte tokens to a recipient
├── test/                 # Unit tests for smart contracts
│   ├── GoldByte-test.js  # Test cases for GoldByte contract
├── .env                  # Environment variables (NEVER share this!)
├── hardhat.config.js      # Hardhat configuration file
├── package.json          # Project dependencies and scripts
├── README.md             # This guide
```

---

## **⚙️ Configuration**

### **4️⃣ Set Up Environment Variables**
Create a `.env` file in the root directory and add the following:
```plaintext
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/1f1d731ab36c4dbe9f3134aae160b5a6
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY_WITHOUT 0x>
GOLDBYTE_CONTRACT=<YourGoldByteContractAddress>
RECEIVER_WALLET=<ReceiverAddress>
```
- **`PRIVATE_KEY`** → Your Ethereum wallet **private key** (⚠️ **NEVER** share this!).
- **`GOLDBYTE_CONTRACT`** → **Fill this after deployment**.
- **`RECEIVER_WALLET`** → Address to receive GoldByte tokens.

---

## **🛠️ How to Use**

### **5️⃣ Compile the Smart Contracts**
```bash
npx hardhat compile
```
This ensures the smart contract code is correct.

---

### **6️⃣ Deploy GoldByte Contract**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
- Once deployed, **copy the contract address** and update `GOLDBYTE_CONTRACT` in your `.env` file.

---

### **7️⃣ Check Your GoldByte Balance**
```bash
npx hardhat run scripts/checkBalance.js --network sepolia
```
This retrieves your token balance.

---
### **8️⃣ Mint GoldByte Tokens to Your Wallet**
```bash
npx hardhat run scripts/issueTokens.js --network sepolia
```
This script generates tokens into your wallet.

---


### **9️⃣ Transfer GoldByte Tokens**
```bash
npx hardhat run scripts/transferTokens.js --network sepolia
```
This sends **10 GoldByte (GB)** to the receiver wallet.

---

## **🧪 Running Tests**
```bash
npx hardhat test
```
This runs all test cases inside the **`test/`** directory.

---

## **🚀 Adding GoldByte to MetaMask**
To see **GoldByte (GB) tokens** in MetaMask:
1. Open **MetaMask**.
2. Select the **Sepolia Testnet**.
3. Click **"Import Token"**.
4. Enter the **GoldByte Contract Address**.
5. Click **"Add Custom Token"** → Done!

---

## **🛡️ Security Notes**
- **Never share your private key** or expose your `.env` file in a public repository.
- **Only use test accounts** while developing on Sepolia.

---

## **💡 Additional Information**
- **Hardhat Docs**: [https://hardhat.org](https://hardhat.org)
- **Ethers.js Docs**: [https://docs.ethers.io](https://docs.ethers.io)
- **Infura**: [https://infura.io](https://infura.io)
- **MetaMask**: [https://metamask.io](https://metamask.io)

---

## **💬 Need Help?**
If you encounter any issues:
- Check the **error messages** and make sure your `.env` variables are correct.
- Make sure your **Sepolia wallet has ETH** for gas fees (use a **Sepolia Faucet**).
- Post an issue on **GitHub** or discuss in a **developer forum**.

---
### ✅ **GoldByte - Bringing Gold to the Blockchain!**
---
This `README.md` file provides **everything** a developer needs to **run, deploy, and interact** with your project. Let me know if you want any changes! 🚀