const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GoldByte Redemption", function () {
    let GoldByte, goldByte, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the contract
        GoldByte = await ethers.getContractFactory("GoldByte");
        goldByte = await GoldByte.deploy();
        await goldByte.waitForDeployment();
    });

    describe("Basic Redemption Tests", function () {
        it("Should allow a user to redeem tokens if they have enough balance", async function () {
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Gold");

            await expect(goldByte.connect(addr1).redeem(ethers.parseUnits("50", 18), "Gold"))
                .to.emit(goldByte, "ReserveReleased")
                .withArgs(ethers.parseUnits("50", 18), "Gold");
        });

        it("Should fail if a user tries to redeem more than their balance", async function () {
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Fiat");

            await expect(goldByte.connect(addr1).redeem(ethers.parseUnits("150", 18), "Fiat"))
                .to.be.revertedWith("Insufficient GB balance");
        });

        it("Should fail if there are not enough reserves to back redemption", async function () {
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Gold");

            // Force reserves to be less than the redemption amount
            await goldByte.redeem(ethers.parseUnits("90", 18), "Gold"); // Reduce reserves

            await expect(goldByte.connect(addr1).redeem(ethers.parseUnits("50", 18), "Gold"))
                .to.be.revertedWith("Not enough gold reserves");
        });
    });

    describe("Fee Handling", function () {
        it("Should charge a fee for non-registered accounts when redeeming", async function () {
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Fiat");

            const fee = ethers.parseUnits("0.07", 18); // 0.07% fee
            const expectedNetAmount = ethers.parseUnits("100", 18) - fee;

            await expect(goldByte.connect(addr1).redeem(ethers.parseUnits("100", 18), "Fiat"))
                .to.emit(goldByte, "Redeemed")
                .withArgs(addr1.address, expectedNetAmount, fee, "Fiat");
        });

        it("Should not charge a fee for registered LBG accounts", async function () {
            await goldByte.setLBGRegistration(addr1.address, true);
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Gold");

            await expect(goldByte.connect(addr1).redeem(ethers.parseUnits("100", 18), "Gold"))
                .to.emit(goldByte, "Redeemed")
                .withArgs(addr1.address, ethers.parseUnits("100", 18), 0, "Gold");
        });
    });

    describe("Reserve Management", function () {
        it("Should reduce gold reserves when redeeming gold-backed GB", async function () {
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Gold");
            const initialGoldReserves = await goldByte.lockedGoldReserves();

            await goldByte.connect(addr1).redeem(ethers.parseUnits("50", 18), "Gold");

            expect(await goldByte.lockedGoldReserves()).to.equal(initialGoldReserves - ethers.parseUnits("50", 18));
        });

        it("Should reduce fiat reserves when redeeming fiat-backed GB", async function () {
            await goldByte.issueTokens(addr1.address, ethers.parseUnits("100", 18), "Fiat");
            const initialFiatReserves = await goldByte.lockedFiatReserves();

            await goldByte.connect(addr1).redeem(ethers.parseUnits("50", 18), "Fiat");

            expect(await goldByte.lockedFiatReserves()).to.equal(initialFiatReserves - ethers.parseUnits("50", 18));
        });
    });
});
