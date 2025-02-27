const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Load ABI and contract address from environment
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "GoldByteABI.json")));
const contractAddress = process.env.GOLDBYTE_CONTRACT_ADDRESS;

const provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const goldByteContract = new ethers.Contract(contractAddress, contractABI, signer);

// Issue tokens endpoint
app.post('/issue', async (req, res) => {
  try {
    const { account, amount } = req.body;
    const tx = await goldByteContract.issueTokens(account, amount);
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer tokens endpoint (using standard ERC20 transfer)
app.post('/transfer', async (req, res) => {
  try {
    const { to, amount } = req.body;
    const tx = await goldByteContract.transfer(to, amount);
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redeem tokens endpoint
app.post('/redeem', async (req, res) => {
  try {
    const { account, amount } = req.body;
    const tx = await goldByteContract.redeemTokens(account, amount);
    await tx.wait();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-settle endpoint (can be called by anyone)
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

app.listen(port, () => {
  console.log(`GoldByte API Server listening at http://localhost:${port}`);
});
