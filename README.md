
---

# **GoldByte - Tokenized Gold with Bank Settlements**

**GoldByte** is an ERC‑20 token (1 GB = 1 gram of gold) that allows **registered banks** to issue tokens and users to redeem tokens at a chosen bank. The contract tracks obligations (settlements) between banks whenever redemptions occur, making it easy to see which bank owes gold to another bank.

## **Features**

1. **Bank Registration**  
   - Banks are identified by a **bank code** (e.g., `"LBG"`).  
   - The IMF (contract owner) calls `updateRegisteredBank(bankCode, bankAddress)` to register a bank.

2. **Issuance**  
   - A **registered bank** can issue tokens to any user by calling `issueTokens(...)`.  
   - The bank specifies:
     - Recipient’s address  
     - Amount of tokens to issue  
     - Issuer bank code (e.g., `"LBG"`)  
     - Recipient’s bank code (e.g., `"SBI"`)  
   - The contract increases the `lockedGoldReserves` by the amount of tokens issued.

3. **Transfers**  
   - Standard ERC‑20 transfers are allowed.  
   - If the recipient doesn’t have an associated bank, the issuance info is copied from the sender.

4. **Redemption**  
   - Any user can redeem tokens at any **registered** bank by calling `redeem(amount, chosenRedeemingBank)`.  
   - The contract:
     - Burns the user’s tokens.  
     - Reduces `lockedGoldReserves` by the redeemed amount.  
     - Updates `netSettlements[issuerBank][chosenRedeemingBank]` to reflect that the issuer bank owes the chosen redeeming bank.

5. **Settlement Tracking**  
   - The mapping `netSettlements[bankA][bankB]` is an `int256` that shows how much `bankA` owes `bankB`.  
   - If this value is positive, bankA owes bankB.  
   - If it’s negative, bankB actually owes bankA.  
   - The function `_settleRedemption` automatically nets out reverse obligations.

6. **Auto-Settlement**  
   - If a user holds tokens longer than `HOLDING_LIMIT` (e.g., 5 days), anyone can call `autoSettle(userAddress)`.  
   - The contract tries to transfer tokens to the user’s associated bank’s wallet. If that fails, it tries to send them to the issuer’s wallet. If both fail, it burns them.

7. **Dashboard & View Functions**  
   - `bankDashboard()`: For a bank wallet to see its own token balance and a net settlement report with all other banks.  
   - `userDashboard()`: For a non-bank wallet to see its token balance and redeemable balance.  
   - `getBankCodes()`: Lists all registered banks.  
   - `getGoldReserve()`: Returns the global locked gold reserve (in tokens).

---

## **Key Contract Functions**

1. **`updateRegisteredBank(string bankCode, address bankAddress) external onlyOwner`**  
   - Registers or updates a bank code to a specific wallet address.  
   - Only callable by the IMF (contract owner).

2. **`issueTokens(address account, uint256 amount, string issuerBank, string accountAffiliation) external`**  
   - A registered bank (caller) mints new tokens and increases `lockedGoldReserves`.  
   - The user’s bank affiliation is set if not already present.

3. **`redeem(uint256 amount, string chosenRedeemingBank) external`**  
   - Burns `amount` of tokens from the caller.  
   - Ensures `chosenRedeemingBank` is registered.  
   - Updates settlement so that `issuerBank` owes `chosenRedeemingBank`.

4. **`autoSettle(address account) external`**  
   - If the account has held tokens beyond `HOLDING_LIMIT`, tries to transfer them to the account’s bank wallet or the issuer’s wallet.  
   - If both fail, burns them.

5. **`bankDashboard()`**  
   - Returns `(tokenBalance, counterparties[], debts[])` for the calling bank wallet.  
   - Shows how much this bank owes or is owed by each other bank.

6. **`userDashboard()`**  
   - For non-bank wallets.  
   - Returns `(tokenBalance, redeemableBalance)`.

7. **`netSettlements(string bankA, string bankB) public view returns (int256)`**  
   - Shows how much `bankA` owes `bankB`.  
   - Positive = bankA owes bankB; negative = bankB owes bankA.

8. **`getBankCodes()`**  
   - Lists all registered bank codes.

9. **`getGoldReserve()`**  
   - Returns the total locked gold reserve in tokens.

---

## **Scripts**

### **Issuance Script: `issueToken.js`**
- Connects as a **bank** wallet (with `BANK_PRIVATE_KEY`).  
- Calls `issueTokens(...)` to mint new tokens for a recipient.  
- Increases the global locked gold reserve.

### **Redemption Script: `redeem.js`**
- A user (or any wallet) calls `redeem(amount, chosenRedeemingBank)`.  
- The script checks user’s balance, ensures the chosen bank is registered, then calls `redeem(...)`.  
- After redemption, tokens are burned, `lockedGoldReserves` is reduced, and settlement is updated so that the issuer owes the chosen bank.

### **Settlement Report Script: `settlement.js`**
- Fetches the list of registered banks (`getBankCodes()`).  
- Calls `netSettlements(bankA, bankB)` for each pair of banks.  
- Prints a human‑readable settlement report, showing how much each bank owes the other.

---

## **Hackathon Flow Example**

1. **Bank LBG Registers**  
   - IMF calls `updateRegisteredBank("LBG", lbgWalletAddress)`.

2. **Bank LBG Issues 100 GB to User A**  
   - LBG calls `issueTokens(userA, 100e18, "LBG", "LBG")`.  
   - `lockedGoldReserves` increases by 100.  
   - User A can see 100 tokens in `balanceOf(userA)`.

3. **User A Transfers 10 GB to User B**  
   - Standard ERC‑20 `transfer`.  
   - If user B had no bank affiliation, the contract copies the issuance info from user A.

4. **User B Redeems 10 GB at SBI**  
   - B calls `redeem(10e18, "SBI")`.  
   - The contract checks that `"SBI"` is registered, then updates `netSettlements("LBG","SBI") += 10`, burns tokens, and reduces `lockedGoldReserves` to 90.  
   - Now LBG effectively owes SBI 10 tokens.

5. **Check Settlements**  
   - Running `settlement.js` reveals `Bank LBG owes Bank SBI: 10.0 tokens`.

---

## **Conclusion**

**GoldByte** provides a secure, on‑chain solution for tokenizing gold, allowing **registered banks** to issue tokens, and users to redeem at any bank. The contract automatically handles **bank settlements** through a net obligations mapping, simplifying cross‑bank operations and ensuring a clear record of who owes what in tokenized gold.