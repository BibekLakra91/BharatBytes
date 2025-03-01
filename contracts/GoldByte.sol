// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GoldByte Token (GB)
 * @dev ERC20 token representing tokenized gold (1 GB = 1 gram of gold) with additional features:
 * - Tokens must be held for no longer than 10 days; after that, they are automatically settled.
 * - Registered LBG accounts incur no fee; non‑registered accounts incur a fee of 0.07%.
 * - Each issued token is backed by locked gold reserves.
 * - When GB tokens are redeemed, the equivalent gold reserve is released.
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
    // Track locked gold reserves (in GB tokens)
    uint256 public lockedGoldReserves;

    // Events
    event Issued(address indexed to, uint256 amount);
    event Redeemed(address indexed from, uint256 netAmount, uint256 fee);
    event AutoSettled(address indexed account, uint256 netAmount, uint256 fee);
    event LBGRegistrationUpdated(address indexed account, bool isRegistered);
    event ReserveLocked(uint256 amount);
    event ReserveReleased(uint256 amount);

    constructor() ERC20("GoldByte", "GB") {}

    /**
     * @notice Issue tokens (simulate fiat-to-token conversion) and lock an equivalent gold reserve.
     * @dev Only the contract owner can mint tokens.
     * @param account Address to receive the issued tokens.
     * @param amount Number of GB tokens to issue.
     */
    function issueTokens(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
        lastReceivedTimestamp[account] = block.timestamp;

        // Lock the equivalent amount in gold reserves
        lockedGoldReserves += amount;

        emit ReserveLocked(amount);
        emit Issued(account, amount);
    }

    /**
     * @notice Override ERC20 _transfer to update the holding timestamp.
     * @dev Resets the holding period for the recipient.
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
     * @notice Redeem GB tokens in exchange for gold.
     * @dev Burns tokens and releases the corresponding gold reserve.
     * @param amount The number of GB tokens to redeem.
     */
    function redeem(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient GB balance");

        // Calculate fee for non-registered LBG accounts
        uint256 fee = isRegisteredLBG[msg.sender] ? 0 : (amount * NON_REGISTERED_FEE_BASIS_POINTS) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;

        // Burn the tokens from the sender's account
        _burn(msg.sender, amount);

        // Reduce locked gold reserves
        require(lockedGoldReserves >= amount, "Not enough gold reserves");
        lockedGoldReserves -= amount;

        emit ReserveReleased(amount);
        emit Redeemed(msg.sender, netAmount, fee);
    }

    /**
     * @notice Auto-settle tokens that exceed the 10-day holding limit.
     * @dev Can be called by anyone to force settlement if tokens have been held too long.
     * @param account The account whose tokens need to be settled.
     */
    function autoSettle(address account) external {
        uint256 holdingTime = block.timestamp - lastReceivedTimestamp[account];
        require(holdingTime > HOLDING_LIMIT, "Holding period not exceeded");

        uint256 balance = balanceOf(account);
        require(balance > 0, "No tokens to settle");

        // Calculate fee if the account is not registered
        uint256 fee = isRegisteredLBG[account] ? 0 : (balance * NON_REGISTERED_FEE_BASIS_POINTS) / FEE_DENOMINATOR;
        uint256 netAmount = balance - fee;
  
        // Burn all tokens of the account
        _burn(account, balance);

        emit AutoSettled(account, netAmount, fee);
    }

    /**
     * @notice Update LBG registration status for an account.
     * @dev Only the contract owner can update registration status.
     * @param account The address to update.
     * @param registered Boolean indicating if the account is registered.
     */
    function setLBGRegistration(address account, bool registered) external onlyOwner {
        isRegisteredLBG[account] = registered;
        emit LBGRegistrationUpdated(account, registered);
    }

    /**
     * @notice Get the current locked gold reserve.
     * @return The amount of gold reserves locked.
     */
    function getGoldReserve() external view returns (uint256) {
        return lockedGoldReserves;
    }
}
