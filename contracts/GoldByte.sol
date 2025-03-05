// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GoldByte Token (GB)
 * @dev ERC20 token representing tokenized gold (1 GB = 1 gram of gold) with enhanced issuance, redemption, settlement,
 *      and dashboard functionality.
 *
 * Key features:
 * - Only registered banks (set by the IMF, i.e. contract owner) may issue tokens.
 *   A mapping from bank code (e.g., "SBI") to the bank's wallet address is maintained along with an enumerable list of bank codes.
 * - During issuance, the issuer provides the recipient’s bank affiliation.
 * - At redemption, anyone can redeem tokens at a chosen bank.
 *   The chosen redeeming bank must be registered in the contract.
 *   When tokens are redeemed, they are burned, the global gold reserve is reduced,
 *   and settlement logic updates the net obligations so that the issuer bank owes the chosen redeeming bank.
 * - Auto-settlement will attempt to transfer tokens to the associated bank’s wallet; if that fails, it falls back to the issuer bank’s wallet.
 * - Dashboard view functions allow bank wallets to see their token balance and net settlements,
 *   while non-bank wallets see only their balance and redeemable amount.
 */
contract GoldByte is ERC20, Ownable {
    // Constants
    uint256 public constant HOLDING_LIMIT = 5 days;
    uint256 public constant NON_REGISTERED_FEE_BASIS_POINTS = 7; // fee if needed
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Global locked gold reserves (in GB tokens)
    uint256 public lockedGoldReserves;
    // Timestamp mapping for auto-settlement
    mapping(address => uint256) public lastReceivedTimestamp;

    // ---------------- Bank Registration ----------------
    mapping(string => address) public registeredBanks; // bank code => bank wallet
    mapping(address => bool) public isBankWallet;        // bank wallet => is bank?
    mapping(address => string) public bankCodeOfWallet;    // bank wallet => bank code
    string[] public bankCodes;                           // enumerable list of bank codes
    mapping(string => bool) private isBankCodeRegistered; // helper mapping

    event BankRegistrationUpdated(string bankCode, address bankAddress);

    function updateRegisteredBank(string calldata bankCode, address bankAddress) external onlyOwner {
        registeredBanks[bankCode] = bankAddress;
        isBankWallet[bankAddress] = true;
        bankCodeOfWallet[bankAddress] = bankCode;
        if (!isBankCodeRegistered[bankCode]) {
            bankCodes.push(bankCode);
            isBankCodeRegistered[bankCode] = true;
        }
        emit BankRegistrationUpdated(bankCode, bankAddress);
    }

    // ---------------- Issuance & Redemption Info ----------------
    // Mapping from account to its affiliated bank (set at issuance)
    mapping(address => string) public accountBank;
    // Struct to hold issuance info (we now only store the issuer bank code)
    struct IssuanceInfo {
        string issuerBank; // bank code of the issuing bank
    }
    mapping(address => IssuanceInfo) private issuanceInfo;

    // Custom getter for issuance info (returns the issuer bank)
    function getIssuanceInfo(address account) external view returns (string memory) {
        return issuanceInfo[account].issuerBank;
    }

    // ---------------- Settlement ----------------
    // netSettlements[A][B] is the net amount that bank A owes bank B.
    mapping(string => mapping(string => int256)) public netSettlements;

    event Issued(address indexed to, uint256 amount, string issuerBank, string accountBank);
    event Redeemed(address indexed from, uint256 amount);
    event AutoSettled(address indexed account, uint256 amount);
    event AccountBankUpdated(address indexed account, string bank);
    event ReserveLocked(uint256 amount);
    event ReserveReleased(uint256 amount);

    constructor() ERC20("GoldByte", "GB") {}

    // ---------------- Issuance ----------------
    /**
     * @notice Issue tokens.
     * @dev Only a registered bank (caller must match registeredBanks[issuerBank]) may issue tokens.
     * @param account The recipient address.
     * @param amount The number of tokens to issue.
     * @param issuerBank The issuing bank's code.
     * @param accountAffiliation The recipient's bank code.
     */
    function issueTokens(
        address account,
        uint256 amount,
        string calldata issuerBank,
        string calldata accountAffiliation
    ) external {
        require(registeredBanks[issuerBank] != address(0), "Issuer bank not registered");
        require(msg.sender == registeredBanks[issuerBank], "Caller not authorized as issuer bank");

        _mint(account, amount);
        lockedGoldReserves += amount;
        lastReceivedTimestamp[account] = block.timestamp;

        // Record issuance info if not already set.
        if (bytes(issuanceInfo[account].issuerBank).length == 0) {
            issuanceInfo[account] = IssuanceInfo(issuerBank);
            accountBank[account] = accountAffiliation;
            emit AccountBankUpdated(account, accountAffiliation);
        } else {
            require(
                keccak256(bytes(issuanceInfo[account].issuerBank)) == keccak256(bytes(issuerBank)),
                "Issuer bank mismatch on issuance"
            );
        }
        emit ReserveLocked(amount);
        emit Issued(account, amount, issuerBank, accountAffiliation);
    }

    // ---------------- Transfers ----------------
    /**
     * @notice Override _transfer to propagate issuance info and bank affiliation.
     * @dev If recipient has no account bank set, inherit from sender.
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override {
        if (bytes(accountBank[recipient]).length == 0) {
            issuanceInfo[recipient] = issuanceInfo[sender];
            accountBank[recipient] = accountBank[sender];
            emit AccountBankUpdated(recipient, accountBank[sender]);
        } else {
            require(
                keccak256(bytes(issuanceInfo[recipient].issuerBank)) ==
                    keccak256(bytes(issuanceInfo[sender].issuerBank)),
                "Issuer bank mismatch on transfer"
            );
        }
        super._transfer(sender, recipient, amount);
        lastReceivedTimestamp[recipient] = block.timestamp;
    }

    // ---------------- Redemption & Settlement ----------------
    /**
     * @notice Redeem tokens at a chosen bank.
     * @dev The caller provides a chosen redeeming bank code.
     *      The function checks that the chosen bank is registered.
     *      Then it triggers settlement so that the issuer bank owes the chosen redeeming bank.
     * @param amount The number of tokens to redeem.
     * @param chosenRedeemingBank The bank code where redemption is attempted.
     */
    function redeem(uint256 amount, string calldata chosenRedeemingBank) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(registeredBanks[chosenRedeemingBank] != address(0), "Redeeming bank not registered");

        // Settlement: update net settlements so that issuer bank owes chosenRedeemingBank.
        _settleRedemption(msg.sender, amount, chosenRedeemingBank);
        _burn(msg.sender, amount);
        require(lockedGoldReserves >= amount, "Not enough gold reserves");
        lockedGoldReserves -= amount;
        emit ReserveReleased(amount);
        emit Redeemed(msg.sender, amount);
    }

    /**
     * @notice Internal settlement logic triggered on redemption.
     * @dev Updates net settlements so that the issuer bank owes the chosen redeeming bank.
     *      Also nets out any reverse obligations.
     * @param redeemer The address redeeming tokens.
     * @param amount The redemption amount.
     * @param chosenRedeemingBank The bank code at which redemption is done.
     */
    function _settleRedemption(address redeemer, uint256 amount, string calldata chosenRedeemingBank) internal {
        string memory issuerBank = issuanceInfo[redeemer].issuerBank;
        netSettlements[issuerBank][chosenRedeemingBank] += int256(amount);
        int256 reverseDebt = netSettlements[chosenRedeemingBank][issuerBank];
        if (reverseDebt > 0) {
            int256 minDebt = netSettlements[issuerBank][chosenRedeemingBank] < reverseDebt
                ? netSettlements[issuerBank][chosenRedeemingBank]
                : reverseDebt;
            netSettlements[issuerBank][chosenRedeemingBank] -= minDebt;
            netSettlements[chosenRedeemingBank][issuerBank] -= minDebt;
        }
    }

    /**
     * @notice External helper function to perform a token transfer for settlement.
     * @dev Intended for autoSettle use.
     */
    function settleTransfer(address from, address to, uint256 amount) external returns (bool) {
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Auto-settle tokens held beyond the permitted period.
     * @dev Attempts to transfer tokens to the associated bank's wallet;
     *      if that fails, falls back to the issuer bank's wallet;
     *      if both fail, burns tokens.
     * @param account The account whose tokens are to be auto-settled.
     */
    function autoSettle(address account) external {
        uint256 holdingTime = block.timestamp - lastReceivedTimestamp[account];
        require(holdingTime > HOLDING_LIMIT, "Holding period not exceeded");
        uint256 balance = balanceOf(account);
        require(balance > 0, "No tokens to settle");
        bool settled = false;
        string memory assocBank = accountBank[account];
        address assocWallet = registeredBanks[assocBank];
        if (assocWallet != address(0)) {
            try this.settleTransfer(account, assocWallet, balance) returns (bool success) {
                settled = success;
            } catch {}
        }
        if (!settled) {
            string memory issuer = issuanceInfo[account].issuerBank;
            address issuerWallet = registeredBanks[issuer];
            require(issuerWallet != address(0), "Issuer bank wallet not set");
            try this.settleTransfer(account, issuerWallet, balance) returns (bool success2) {
                settled = success2;
            } catch {
                _burn(account, balance);
                lockedGoldReserves -= balance;
                emit AutoSettled(account, balance);
                return;
            }
        }
        emit AutoSettled(account, balance);
    }

    // ---------------- Dashboard View Functions ----------------
    /**
     * @notice Returns the redeemable balance for an account.
     * @dev If the account's associated bank is not registered, returns zero.
     * @param account The account to query.
     * @return The redeemable token balance.
     */
    function redeemableBalance(address account) public view returns (uint256) {
        uint256 bal = balanceOf(account);
        if (bal == 0) return 0;
        string memory rBank = accountBank[account];
        if (registeredBanks[rBank] == address(0)) return 0;
        return bal;
    }

    /**
     * @notice Returns the redeemable balance for an account given a redeeming bank code.
     * @param account The account to query.
     * @param redeemingBank The bank code at which redemption is attempted.
     * @return The redeemable token balance for that bank.
     */
    function redeemableBalanceFor(address account, string calldata redeemingBank) external view returns (uint256) {
        uint256 bal = balanceOf(account);
        if (bal == 0) return 0;
        return bal;
    }

    /**
     * @notice For bank wallets: returns the bank's token balance (gold reserve) and net settlement details.
     * @dev Only callable by a registered bank wallet.
     * @return tokenBalance The bank wallet's token balance.
     * @return counterparties An array of bank codes representing counterparties.
     * @return debts An array of net settlement amounts corresponding to each counterparty.
     */
    function bankDashboard() external view returns (uint256 tokenBalance, string[] memory counterparties, int256[] memory debts) {
        require(isBankWallet[msg.sender], "Not a bank wallet");
        string memory myBank = bankCodeOfWallet[msg.sender];
        tokenBalance = balanceOf(msg.sender);
        uint256 count = 0;
        for (uint256 i = 0; i < bankCodes.length; i++) {
            if (keccak256(bytes(bankCodes[i])) != keccak256(bytes(myBank))) {
                count++;
            }
        }
        counterparties = new string[](count);
        debts = new int256[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < bankCodes.length; i++) {
            if (keccak256(bytes(bankCodes[i])) != keccak256(bytes(myBank))) {
                counterparties[j] = bankCodes[i];
                debts[j] = netSettlements[myBank][bankCodes[i]];
                j++;
            }
        }
    }

    /**
     * @notice For non-bank wallets: returns the user's token balance and redeemable balance.
     * @dev Only callable by non-bank wallets.
     * @return tokenBalance The user's total token balance.
     * @return redeemable The redeemable token balance.
     */
    function userDashboard() external view returns (uint256 tokenBalance, uint256 redeemable) {
        require(!isBankWallet[msg.sender], "Bank wallets should use bankDashboard");
        tokenBalance = balanceOf(msg.sender);
        redeemable = redeemableBalance(msg.sender);
    }

    /**
     * @notice Returns the complete list of registered bank codes.
     * @return An array of bank codes.
     */
    function getBankCodes() external view returns (string[] memory) {
        return bankCodes;
    }

    /**
     * @notice Returns the global locked gold reserve.
     * @return The total locked gold reserve.
     */
    function getGoldReserve() external view returns (uint256) {
        return lockedGoldReserves;
    }
}
