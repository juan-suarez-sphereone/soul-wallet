const { ethers } = require("hardhat");

async function main() {
  const SingeltonFactory = await ethers.getContractFactory("SingletonFactory");
  const SingeltonFactoryInstance = await SingeltonFactory.deploy();

  await SingeltonFactoryInstance.deployed();
  const create2Address = SingeltonFactoryInstance.address;

  console.log(`Creat2 deployed at ${create2Address}`);

  const WETHfactory = await ethers.getContractFactory("WETH9");
  const WETHInstance = await WETHfactory.deploy();

  await WETHInstance.deployed();
  const WETHaddress = WETHInstance.address;

  console.log(`WETH deployed at ${WETHaddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
