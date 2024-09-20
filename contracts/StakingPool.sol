// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

contract KingTokenC {
    function balanceOf(address account) public view returns (uint256) {}
    function transfer(address recipient, uint256 amount) public returns (bool) {}
    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {}
}

contract KingCollectionsC {
    mapping(uint256 => mapping(address => uint256)) public balances;
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    function balanceOf(address account, uint256 id) public view returns (uint256) {
        return balances[id][account];
    }

    function _mint(address to, uint256 id, uint256 amount) internal {
        balances[id][to] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }
}

contract KingStakingPool is KingCollectionsC {
    struct Pool {
        address stakingToken;
        uint256 rewardRate;
        uint256 totalStaked;
    }

    struct Staker {
        uint256 amountStaked;
        uint256 lastRewardBlock;
    }

    mapping(uint256 => Pool) public pools;
    mapping(address => mapping(uint256 => Staker)) public stakers;
    address public owner;
    uint256 public rewardNFTIdCounter;
    uint256 public nextPoolId;

    event Staked(address indexed user, uint256 poolId, uint256 amount);
    event Withdrawn(address indexed user, uint256 poolId, uint256 amount);
    event RewardMinted(address indexed user, uint256 nftId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 nftId, uint256 amount);

    constructor() {
        owner = msg.sender;
        nextPoolId = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Error: You are not the owner");
        _;
    }

    function addPool(address token, uint256 rewardRate) external onlyOwner {
        require(pools[nextPoolId].stakingToken == address(0), "Error: Pool already exists");

        pools[nextPoolId] = Pool({
            stakingToken: token,
            rewardRate: rewardRate,
            totalStaked: 0
        });

        nextPoolId++;
    }

    function stake(uint256 poolId, uint256 amount) external {
        Pool storage pool = pools[poolId];
        require(pool.stakingToken != address(0), "Error: Pool doesn't exist");

        Staker storage staker = stakers[msg.sender][poolId];

        claimReward(poolId);

        KingTokenC(pool.stakingToken).transferFrom(msg.sender, address(this), amount);

        pool.totalStaked += amount;
        staker.amountStaked += amount;
        staker.lastRewardBlock = block.number;

        emit Staked(msg.sender, poolId, amount);
    }

    function withdraw(uint256 poolId, uint256 amount) external {
        Staker storage staker = stakers[msg.sender][poolId];
        require(staker.amountStaked >= amount, "Error: You did not stake up to that amount");

        claimReward(poolId);

        staker.amountStaked -= amount;
        pools[poolId].totalStaked -= amount;
        staker.lastRewardBlock = block.number;

        KingTokenC(pools[poolId].stakingToken).transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, poolId, amount);
    }

    function claimReward(uint256 poolId) public {
        Staker storage staker = stakers[msg.sender][poolId];
        uint256 reward = calculateReward(poolId, msg.sender);

        require(reward > 0, "Error: No rewards to claim");

        _mint(msg.sender, rewardNFTIdCounter++, reward);
        emit RewardClaimed(msg.sender, rewardNFTIdCounter - 1, reward);

        staker.lastRewardBlock = block.number;
    }

    function calculateReward(uint256 poolId, address stakerAddress) public view returns (uint256) {
        Pool storage pool = pools[poolId];
        Staker storage staker = stakers[stakerAddress][poolId];
        uint256 stakedAmount = staker.amountStaked;
        uint256 rewardBlocks = block.number - staker.lastRewardBlock;
        return stakedAmount * pool.rewardRate * rewardBlocks;
    }

    function getStakedBalance(uint256 poolId, address stakerAddress) public view returns (uint256) {
        return stakers[stakerAddress][poolId].amountStaked;
    }
}
