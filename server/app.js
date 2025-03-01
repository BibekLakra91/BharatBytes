const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Load ABI and contract address
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "GoldByteABI.json")));
const contractAddress = process.env.GOLDBYTE_CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(process.env.MUMBAI_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const goldByteContract = new ethers.Contract(contractAddress, contractABI, signer);

// ✅ Issue tokens
app.post('/issue', async (req, res) => {
  try {
    const { account, amount, reserveType } = req.body;
    const tx = await goldByteContract.issueTokens(account, ethers.parseUnits(amount.toString(), 18), reserveType);
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Transfer tokens
app.post('/transfer', async (req, res) => {
  try {
    const { to, amount } = req.body;
    const tx = await goldByteContract.transfer(to, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Redeem tokens
app.post('/redeem', async (req, res) => {
  try {
    const { account, amount, settlementType } = req.body;
    if (!settlementType) {
      return res.status(400).json({ error: "settlementType is required (Gold/Fiat)" });
    }

    const tx = await goldByteContract.redeem(ethers.parseUnits(amount.toString(), 18), settlementType);
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Auto-settle tokens
app.post('/autoSettle', async (req, res) => {
  try {
    const { account } = req.body;
    const tx = await goldByteContract.autoSettle(account);
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Check balance
app.get('/balance/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const balance = await goldByteContract.balanceOf(account);
    res.status(200).json({ balance: ethers.formatUnits(balance, 18) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`GoldByte API Server listening at http://localhost:${port}`);
});
