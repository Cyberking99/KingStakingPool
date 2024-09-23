import { ethers } from "hardhat";

async function main() {
    const KingToken = await ethers.getContractFactory("KingToken");
    const kingToken = await KingToken.deploy("KingToken", "KTK", 18, 1000000);

    console.log("KingToken deployed to:", await kingToken.getAddress());

    const KingCollections = await ethers.getContractFactory("KingCollections");
    const kingCollections = await KingCollections.deploy();

    console.log("KingCollections deployed to:", await kingCollections.getAddress());

    console.log("Minting initial NFT...");
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0000FF"/></svg>';
    const mintTx = await kingCollections.mint("0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", 1, 1, svg);
    await mintTx.wait();

    console.log("Initial NFT minted!");

    // Fetch and log the token URI for the minted NFT
    const tokenURI = await kingCollections.uri(1);
    console.log("Token URI for minted NFT:", tokenURI);

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
