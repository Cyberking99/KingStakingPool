import { ethers } from "hardhat";

async function main() {
    const KingToken = await ethers.getContractFactory("KingToken");
    const kingToken = await KingToken.deploy("KingToken", "KTK", 18, 1000000);

    console.log("KingToken deployed to:", await kingToken.getAddress());

    const KingCollections = await ethers.getContractFactory("KingCollections");
    const kingCollections = await KingCollections.deploy("https://gateway.lighthouse.storage/ipfs/bafybeibnuhhhi56il2ok5arqziumn77halkwwnjlhn4motjp7bljvfiyl4");

    console.log("KingCollections deployed to:", await kingCollections.getAddress());

    const KingStakingPool = await ethers.getContractFactory("KingStakingPool");
    const kingStakingPool = await KingStakingPool.deploy();

    console.log("KingStakingPool deployed to:", await kingStakingPool.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
