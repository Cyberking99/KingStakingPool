import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import "@nomicfoundation/hardhat-chai-matchers";

describe("KingCollections", function () {
    let kingCollections: Contract;
    const baseURI = "https://gateway.lighthouse.storage/ipfs/bafybeibnuhhhi56il2ok5arqziumn77halkwwnjlhn4/";

    beforeEach(async function () {
        const KingCollections = await ethers.getContractFactory("KingCollections");
        kingCollections = await KingCollections.deploy(baseURI);
    });

    it("should set the correct base URI", async function () {
        expect(await kingCollections.uri(1)).to.equal(baseURI + "1");
    });

    it("should mint tokens correctly", async function () {
        const [addr1] = await ethers.getSigners();
        await kingCollections.mint(addr1.address, 1, 100);
        expect(await kingCollections.balanceOf(addr1.address, 1)).to.equal(100);
    });

    it("should emit TransferSingle event on mint", async function () {
        const [addr1] = await ethers.getSigners();
        await expect(kingCollections.mint(addr1.address, 1, 100))
            .to.emit(kingCollections, "TransferSingle")
            .withArgs(addr1.address, AddressZero, addr1.address, 1, 100); // Use imported AddressZero
    });

    it("should fail if minting to the zero address", async function () {
        await expect(kingCollections.mint(AddressZero, 1, 100)).to.be.revertedWith("Error(ERC1155): Minting to the zero address not allowed");
    });

    it("should fail to mint tokens to the zero address", async function () {
        await expect(kingCollections.mint(AddressZero, 1, 100)).to.be.revertedWith("Error(ERC1155): Minting to the zero address not allowed");
    });

    it("should mint correctly when minting to a valid address", async function () {
        const [addr1] = await ethers.getSigners();
        await kingCollections.mint(addr1.address, 1, 100);
        expect(await kingCollections.balanceOf(addr1.address, 1)).to.equal(100);
    });
});
