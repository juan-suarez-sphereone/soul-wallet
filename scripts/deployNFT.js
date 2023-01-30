const { ethers } = require("hardhat");

async function main() {

  const NFTFactory = await ethers.getContractFactory("NFTCreator");
  const NFTInstance = await NFTFactory.deploy();

  await NFTInstance.deployed();
  const NFTAddress = NFTInstance.address;

  console.log(`WETH deployed at ${NFTAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Creat2 deployed at 0x4A64208814b14E5CA2475349ebC38B40CE2e1373
// WETH deployed at 0x82080454665F50c83DC43bd2A0daB4cAC62727f5