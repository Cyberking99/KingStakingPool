// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface KingTokenC {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract KingCollectionsC {
    mapping(uint256 => mapping(address => uint256)) public balances;
    mapping(uint256 => string) public tokenURIs;

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event URI(string value, uint256 indexed id);

    function _balanceOf(address account, uint256 id) public view returns (uint256) {
        return balances[id][account];
    }

    function _mint(address to, uint256 id, uint256 amount, string memory _uri) internal {
        balances[id][to] += amount;
        tokenURIs[id] = _uri;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
        emit URI(_uri, id);
    }

    function uri(uint256 id) public view returns (string memory) {
        require(bytes(tokenURIs[id]).length > 0, "Error(ERC1155): Token ID does not exist");
        return tokenURIs[id];
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
    
    bool private locked;

    event Staked(address indexed user, uint256 poolId, uint256 amount);
    event Withdrawn(address indexed user, uint256 poolId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 nftId, uint256 amount);

    constructor() {
        owner = msg.sender;
        nextPoolId = 1;
        rewardNFTIdCounter = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Error: You are not the owner");
        _;
    }

    modifier noReentrant() {
        require(!locked, "Error: Reentrancy detected");
        locked = true;
        _;
        locked = false;
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
        if (staker.amountStaked == 0) {
            staker.lastRewardBlock = block.number;
        }

        KingTokenC(pool.stakingToken).transferFrom(msg.sender, address(this), amount);

        pool.totalStaked += amount;
        staker.amountStaked += amount;

        emit Staked(msg.sender, poolId, amount);
    }

    function withdraw(uint256 poolId, uint256 amount) external {
        Staker storage staker = stakers[msg.sender][poolId];
        require(staker.amountStaked >= amount, "Error: You did not stake up to that amount");

        staker.amountStaked -= amount;
        pools[poolId].totalStaked -= amount;

        KingTokenC(pools[poolId].stakingToken).transfer(msg.sender, amount);

        uint256 reward = calculateReward(poolId, msg.sender);
        if (reward > 0) {
            claimReward(poolId);
        }

        emit Withdrawn(msg.sender, poolId, amount);
    }

    function claimReward(uint256 poolId) public {
        Staker storage staker = stakers[msg.sender][poolId];
        uint256 reward = calculateReward(poolId, msg.sender);

        require(reward > 0, "Error: No rewards to claim");

        string memory _uri = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0000FF"/></svg>';
        _mint(msg.sender, rewardNFTIdCounter, reward, _uri);
        emit RewardClaimed(msg.sender, rewardNFTIdCounter, reward);
        rewardNFTIdCounter++;

        staker.lastRewardBlock = block.number;
    }

    function calculateReward(uint256 poolId, address stakerAddress) public view returns (uint256) {
        Pool storage pool = pools[poolId];
        Staker storage staker = stakers[stakerAddress][poolId];
        uint256 stakedAmount = staker.amountStaked;
        uint256 rewardBlocks = block.number - staker.lastRewardBlock;
        return stakedAmount * pool.rewardRate * rewardBlocks / 1e18;
    }

    function getStakedBalance(uint256 poolId, address stakerAddress) public view returns (uint256) {
        return stakers[stakerAddress][poolId].amountStaked;
    }
}
