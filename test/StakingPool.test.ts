import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import "@nomicfoundation/hardhat-chai-matchers";

describe("KingStakingPool", function () {
    let kingToken: Contract;
    let stakingPool: Contract;
    const baseURI = "https://gateway.lighthouse.storage/ipfs/bafybeibnuhhhi56il2ok5arqziumn77halkwwnjlhn4/";

    beforeEach(async function () {
        const KingToken = await ethers.getContractFactory("KingToken");
        kingToken = await KingToken.deploy("KingToken", "KTK", 18, ethers.parseUnits("1000000", 18));
        // console.log(kingToken.getAddress())

        const KingStakingPool = await ethers.getContractFactory("KingStakingPool");
        stakingPool = await KingStakingPool.deploy();
    });

    it("should add a new pool", async function () {
        const kingTokenAddress = await kingToken.getAddress();
        console.log(kingTokenAddress);
        await stakingPool.addPool(kingTokenAddress, 100);
        const pool = await stakingPool.pools(kingTokenAddress);
        expect(pool.stakingToken).to.equal(kingTokenAddress);
        expect(pool.rewardRate).to.equal(100);
    });

    it("should allow staking tokens", async function () {
        const [owner, addr1] = await ethers.getSigners();
        const kingTokenAddress = await kingToken.getAddress();
        await kingToken.transfer(addr1.address, ethers.parseUnits("100", 18));
        await kingToken.connect(addr1).approve(stakingPool.address, ethers.parseUnits("100", 18));
        await stakingPool.addPool(kingTokenAddress, 100);
        await stakingPool.connect(addr1).stake(0, ethers.parseUnits("100", 18));
        const stakedAmount = await stakingPool.getStakedBalance(0, addr1.address);
        expect(stakedAmount).to.equal(ethers.parseUnits("100", 18));
    });

    it("should emit Staked event on staking", async function () {
        const [addr1] = await ethers.getSigners();
        const kingTokenAddress = await kingToken.getAddress();
        await kingToken.transfer(addr1.address, ethers.parseUnits("100", 18));
        await kingToken.connect(addr1).approve(stakingPool.address, ethers.parseUnits("100", 18));
        await stakingPool.addPool(kingTokenAddress, 100);
        await expect(stakingPool.connect(addr1).stake(0, ethers.parseUnits("100", 18)))
            .to.emit(stakingPool, "Staked")
            .withArgs(addr1.address, 0, ethers.parseUnits("100", 18));
    });

    it("should fail if trying to stake into a non-existing pool", async function () {
        const [addr1] = await ethers.getSigners();
        await expect(stakingPool.connect(addr1).stake(0, ethers.parseUnits("100", 18)))
            .to.be.revertedWith("Error: Pool doesn't exist");
    });

    it("should allow withdrawal of staked tokens", async function () {
        const [owner, addr1] = await ethers.getSigners();
        await kingToken.transfer(addr1.address, ethers.parseUnits("100", 18));
        await kingToken.connect(addr1).approve(stakingPool.address, ethers.parseUnits("100", 18));
        await stakingPool.addPool(kingToken.target, 100);
        await stakingPool.connect(addr1).stake(0, ethers.parseUnits("100", 18));

        await stakingPool.connect(addr1).withdraw(0, ethers.parseUnits("100", 18));
        const stakedAmount = await stakingPool.getStakedBalance(0, addr1.address);
        expect(stakedAmount).to.equal(0);
    });

    it("should fail if trying to withdraw more than staked", async function () {
        const [addr1] = await ethers.getSigners();
        await expect(stakingPool.connect(addr1).withdraw(0, ethers.parseUnits("100", 18)))
            .to.be.revertedWith("Insufficient staked balance");
    });

    it("should correctly calculate rewards", async function () {
        const [addr1] = await ethers.getSigners();
        await kingToken.transfer(addr1.address, ethers.parseUnits("100", 18));
        await kingToken.connect(addr1).approve(stakingPool.address, ethers.parseUnits("100", 18));
        await stakingPool.addPool(kingToken.target, 100);
        await stakingPool.connect(addr1).stake(0, ethers.parseUnits("100", 18));

        await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
        await ethers.provider.send("evm_mine");

        const rewards = await stakingPool.calculateReward(0, addr1.address);
        expect(rewards).to.be.gt(0);
    });
});
