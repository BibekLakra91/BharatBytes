// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GoldByte Token (BG)
 * @dev ERC20 token representing tokenized gold (1 BG = 1 gram of gold) with additional features:
 * - Tokens must be held for no longer than 10 days; after that, they are automatically settled.
 * - Registered LBG accounts incur no fee; non‑registered accounts incur a fee of 0.07% (80% less than a competitive minimum of ~0.35%).
 */
contract GoldByte is ERC20, Ownable {
    // Constants
    uint256 public constant HOLDING_LIMIT = 10 days;  // Maximum holding period
    uint256 public constant NON_REGISTERED_FEE_BASIS_POINTS = 7; // 0.07% fee for non-registered accounts
    uint256 public constant FEE_DENOMINATOR = 10000; // For basis point calculations  

    // Mapping to track the last time tokens were received per account
    mapping(address => uint256) public lastReceivedTimestamp;
    // Mapping to track LBG registration status (true = registered)
    mapping(address => bool) public isRegisteredLBG;

    // Events
    event Issued(address indexed to, uint256 amount);
    event Redeemed(address indexed from, uint256 netAmount, uint256 fee);
    event AutoSettled(address indexed account, uint256 netAmount, uint256 fee);
    event LBGRegistrationUpdated(address indexed account, bool isRegistered);

    constructor() ERC20("GoldByte", "BG") {}

    /**
     * @notice Issue tokens (simulate fiat-to-token conversion).
     * Only the owner can call.
     */
    function issueTokens(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
        lastReceivedTimestamp[account] = block.timestamp;
        emit Issued(account, amount);
    }

    /**
     * @notice Override ERC20 _transfer to update lastReceivedTimestamp.
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override {
        super._transfer(sender, recipient, amount);
        lastReceivedTimestamp[recipient] = block.timestamp;
    }

    /**
     * @notice Redeem tokens (simulate token-to-fiat/gold conversion).
     * Only the owner can trigger redemption.
     */
    function redeemTokens(address account, uint256 amount) public onlyOwner {
        require(balanceOf(account) >= amount, "Insufficient tokens");
        uint256 fee = isRegisteredLBG[account] ? 0 : (amount * NON_REGISTERED_FEE_BASIS_POINTS) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;
        _burn(account, amount);
        emit Redeemed(account, netAmount, fee);
        // Off-chain settlement (fiat/gold) is triggered via event processing.
    }

    /**
     * @notice Auto-settle tokens held longer than 10 days.
     * Anyone can call this function.
     */
    function autoSettle(address account) external {
        uint256 holdingTime = block.timestamp - lastReceivedTimestamp[account];
        require(holdingTime > HOLDING_LIMIT, "Holding period not exceeded");
        uint256 balance = balanceOf(account);
        require(balance > 0, "No tokens to settle");
        uint256 fee = isRegisteredLBG[account] ? 0 : (balance * NON_REGISTERED_FEE_BASIS_POINTS) / FEE_DENOMINATOR;
        uint256 netAmount = balance - fee;
        _burn(account, balance);
        emit AutoSettled(account, netAmount, fee);
        // Off-chain processing for settlement is triggered here.
    }

    /**
     * @notice Set LBG registration status for an account.
     * Only the owner can update.
     */
    function setLBGRegistration(address account, bool registered) external onlyOwner {
        isRegisteredLBG[account] = registered;
        emit LBGRegistrationUpdated(account, registered);
    }
}
