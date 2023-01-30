const { ethers } = require("hardhat");

async function main() {
  const SingletonFactory = await ethers.getContractFactory("SingletonFactory");
  const SingletonFactoryInstance = await SingletonFactory.deploy();

  await SingletonFactoryInstance.deployed();
  const create2Address = SingletonFactoryInstance.address;

  console.log(`Creat2 deployed at ${create2Address}`);

  const WETHFactory = await ethers.getContractFactory("WETH9");
  const WETHInstance = await WETHFactory.deploy();

  await WETHInstance.deployed();
  const WETHAddress = WETHInstance.address;

  console.log(`WETH deployed at ${WETHAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// Creat2 deployed at 0x4A64208814b14E5CA2475349ebC38B40CE2e1373
// WETH deployed at 0x82080454665F50c83DC43bd2A0daB4cAC62727f5