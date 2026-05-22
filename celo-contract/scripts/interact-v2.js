import { ethers } from "hardhat";

async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        console.error("Please set CONTRACT_ADDRESS");
        process.exit(1);
    }

    const ChessxuV2 = await ethers.getContractFactory("ChessxuV2");
    const chessxu = await ChessxuV2.attach(contractAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
