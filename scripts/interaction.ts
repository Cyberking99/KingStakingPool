import { ethers } from "hardhat";

async function main() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy or get instances of the contracts
    const KingTokenFactory = await ethers.getContractFactory("KingToken");
    const kingToken = await KingTokenFactory.deploy("King Token", "KT", 18, 1000000);
    const kingTokenAddress = await kingToken.getAddress();
    console.log(`KingToken deployed to: ${kingTokenAddress}`);

    const KingCollectionsFactory = await ethers.getContractFactory("KingCollections");
    const kingCollections = await KingCollectionsFactory.deploy();
    const kingCollectionsAddress = await kingCollections.getAddress();
    console.log(`kingCollections deployed to: ${kingCollectionsAddress}`);

    const KingStakingPoolFactory = await ethers.getContractFactory("KingStakingPool");
    const kingStakingPool = await KingStakingPoolFactory.deploy();
    const kingStakingPoolAddress = await kingStakingPool.getAddress();
    console.log(`KingStakingPool deployed to: ${kingStakingPoolAddress}`);

    // Interact with KingToken
    await kingToken.transfer(addr1.address, 100);
    console.log(`Transferred 100 tokens to ${addr1.address}`);

    const balance1 = await kingToken.balanceOf(addr1.address);
    console.log(`Addr1 Balance: ${balance1.toString()}`);

    // Approve tokens for staking
    await kingToken.approve(kingStakingPoolAddress, 50);
    console.log(`Approved 50 tokens for ${kingStakingPoolAddress}`);

    // Interact with KingCollections
    await kingCollections.mint(addr1.address, 1, 2, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0000FF"/></svg>');
    console.log(`Minted 2 tokens for ${addr1.address} with ID 1`);

    const balanceCollection = await kingCollections.balanceOf(addr1.address, 1);
    console.log(`Addr1 Collection Balance: ${balanceCollection.toString()}`);

    // Add a staking pool
    await kingStakingPool.addPool(kingTokenAddress, ethers.parseUnits("1", 18));
    console.log(`Added staking pool for ${kingTokenAddress}`);

    // Stake tokens
    await kingStakingPool.stake(1, 50);
    console.log(`Staked 50 tokens in pool 1`);

    const stakedBalance = await kingStakingPool.getStakedBalance(1, addr1.address);
    console.log(`Addr1 Staked Balance: ${stakedBalance.toString()}`);

    // Withdraw tokens
    await kingStakingPool.withdraw(1, 25);
    console.log(`Withdrew 25 tokens from pool 1`);

    const updatedStakedBalance = await kingStakingPool.getStakedBalance(1, addr1.address);
    console.log(`Updated Addr1 Staked Balance: ${updatedStakedBalance.toString()}`);

    // Claim reward
    await kingStakingPool.claimReward(1);
    console.log(`Claimed rewards for pool 1`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
