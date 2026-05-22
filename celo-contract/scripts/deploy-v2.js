import { ethers } from "hardhat";

async function main() {
    console.log("Preparing to deploy ChessxuV2...");
    
    const tokenAddress = process.env.TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000"; // Mock or real token
    const trustedForwarder = process.env.TRUSTED_FORWARDER || "0xD4295d9aF32dB85038c82302636d7734E4Cc4f69"; 

    const ChessxuV2 = await ethers.getContractFactory("ChessxuV2");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
