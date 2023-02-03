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

// Creat2 deployed at 0x4593E032481bf78A7462822B4b279306989cfD36
// WETH deployed at 0x217c132171845A65A40e612A0A28C915a84214b4