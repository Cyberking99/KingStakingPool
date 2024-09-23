const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KingStakingPool Contract", function () {
  let kingToken, kingStakingPool, kingTokenAddress, kingStakingPoolAddress, owner, user1, user2;
  const poolRewardRate = ethers.parseUnits("1", 18);

  beforeEach(async function () {
    const KingToken = await ethers.getContractFactory("KingToken");
    kingToken = await KingToken.deploy("KingToken", "KTK", 18, 1000000);
    kingTokenAddress = await kingToken.getAddress();

    const KingStakingPool = await ethers.getContractFactory("KingStakingPool");
    kingStakingPool = await KingStakingPool.deploy();
    kingStakingPoolAddress = await kingStakingPool.getAddress();

    [owner, user1, user2] = await ethers.getSigners();

    await kingToken.mint(user1.address, ethers.parseUnits("1000", 18));
    await kingToken.mint(user2.address, ethers.parseUnits("1000", 18));
  });

  describe("Pool management", function () {
    it("Should allow owner to add a new pool", async function () {
      await kingStakingPool.addPool(kingTokenAddress, poolRewardRate);
      const pool = await kingStakingPool.pools(1);
      expect(pool.stakingToken).to.equal(kingTokenAddress);
      expect(pool.rewardRate).to.equal(poolRewardRate);
    });

    it("Should not allow non-owner to add a new pool", async function () {
      await expect(kingStakingPool.connect(user1).addPool(kingTokenAddress, poolRewardRate)).to.be.revertedWith(
        "Error: You are not the owner"
      );
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await kingStakingPool.addPool(kingTokenAddress, poolRewardRate);
    });

    it("Should allow user to stake tokens", async function () {
      const stakeAmount = ethers.parseUnits("100", 18);
      const allowanceAmount = ethers.parseUnits("200", 18);

      await kingToken.connect(user1).approve(kingStakingPoolAddress, allowanceAmount);
      const allowance = await kingToken.allowance(user1.address, kingStakingPoolAddress);

      await kingStakingPool.connect(user1).stake(1, stakeAmount);

      const stakedBalance = await kingStakingPool.getStakedBalance(1, user1.address);
      expect(stakedBalance).to.equal(stakeAmount);

      const totalStaked = await kingStakingPool.pools(1).then((pool) => pool.totalStaked);
      expect(totalStaked).to.equal(stakeAmount);

      await expect(kingStakingPool.connect(user1).stake(1, stakeAmount))
        .to.emit(kingStakingPool, "Staked")
        .withArgs(user1.address, 1, stakeAmount);
    });

    it("Should allow user to withdraw staked tokens", async function () {
        const stakeAmount = ethers.parseUnits("100", 18);

        await kingToken.connect(user1).approve(kingStakingPoolAddress, stakeAmount);
        await kingStakingPool.connect(user1).stake(1, stakeAmount);

        const withdrawAmount = ethers.parseUnits("50", 18);
        await kingStakingPool.connect(user1).withdraw(1, withdrawAmount);

        const stakedBalance = await kingStakingPool.getStakedBalance(1, user1.address);

        const expectedBalance = stakeAmount-withdrawAmount;
        expect(stakedBalance).to.equal(expectedBalance);

        await expect(kingStakingPool.connect(user1).withdraw(1, withdrawAmount))
            .to.emit(kingStakingPool, "Withdrawn")
            .withArgs(user1.address, 1, withdrawAmount);
    });
  });

  describe("Reward Claiming", function () {
    beforeEach(async function () {
      await kingStakingPool.addPool(kingTokenAddress, poolRewardRate);
    });

    it("Should calculate rewards for a staker", async function () {
      const stakeAmount = ethers.parseUnits("100", 18);

      await kingToken.connect(user1).approve(kingStakingPoolAddress, stakeAmount);
      await kingStakingPool.connect(user1).stake(1, stakeAmount);

      await ethers.provider.send("evm_mine", []);

      const reward = await kingStakingPool.calculateReward(1, user1.address);
      expect(reward).to.be.gt(0);
    });

    it("Should mint an NFT as reward upon claim", async function () {
        const stakeAmount = ethers.parseUnits("100", 18);

        await kingToken.connect(user1).approve(kingStakingPoolAddress, stakeAmount);
        await kingStakingPool.connect(user1).stake(1, stakeAmount);

        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);

        const claim = await kingStakingPool.connect(user1).claimReward(1);

        const uri = await kingStakingPool.uri(1);

        await expect(kingStakingPool.connect(user1).claimReward(1))
            .to.emit(kingStakingPool, "RewardClaimed")
            .withArgs(user1.address, 2, 100000000000000000000n);
    });
  });
});
