const { ethers } = require("hardhat");

async function main() {
  // const SingeltonFactory = await ethers.getContractFactory("SingletonFactory");
  // const SingeltonFactoryInstance = await SingeltonFactory.deploy();

  // await SingeltonFactoryInstance.deployed();
  // const create2Address = SingeltonFactoryInstance.address;

  // console.log(`Creat2 deployed at ${create2Address}`);

  const USDCoinFactory = await ethers.getContractFactory("USDCoin");
  const USDCoinInstance = await USDCoinFactory.deploy();

  await USDCoinInstance.deployed();
  const USDCoinAddress = USDCoinInstance.address;

  console.log(`USDCoin deployed at ${USDCoinAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
