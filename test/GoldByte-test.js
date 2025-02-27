const { expect } = require("chai");

describe("GoldByte", function () {
  let GoldByte, goldByte, owner, addr1;

  beforeEach(async function () {
    // Get test accounts
    [owner, addr1] = await ethers.getSigners();

    // Deploy contract
    GoldByte = await ethers.getContractFactory("GoldByte");
    goldByte = await GoldByte.deploy(); // No need for `.deployed()`
    
    console.log("GoldByte deployed to:", goldByte.address);
  });

  describe("Token Properties", function () {
    it("Should have the correct name and symbol", async function () {
      expect(await goldByte.name()).to.equal("GoldByte");
      expect(await goldByte.symbol()).to.equal("BG");
    });
  });

  describe("Token Issuance and Redemption", function () {
    it("Should issue tokens correctly", async function () {
      await goldByte.issueTokens(addr1.address, 1000);
      expect(await goldByte.balanceOf(addr1.address)).to.equal(1000);
    });

    it("Should redeem tokens with a fee for non-registered accounts", async function () {
      await goldByte.issueTokens(addr1.address, 1000);
      await goldByte.redeemTokens(addr1.address, 1000);
      expect(await goldByte.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("Auto Settlement Mechanism", function () {
    it("Should auto-settle tokens held longer than 10 days", async function () {
      await goldByte.issueTokens(addr1.address, 500);

      // Fast-forward blockchain time by 11 days
      await network.provider.send("evm_increaseTime", [11 * 24 * 3600]);
      await network.provider.send("evm_mine");

      await goldByte.autoSettle(addr1.address);
      expect(await goldByte.balanceOf(addr1.address)).to.equal(0);
    });
  });
});
