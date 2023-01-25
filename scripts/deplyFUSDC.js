const { ethers } = require("hardhat");

async function main() {
  const ShitcoinFactory = await ethers.getContractFactory("Stablecoin");
  const ShitcoinInstance = await ShitcoinFactory.deploy();

  await ShitcoinInstance.deployed();
  const ShitcoinAddress = ShitcoinInstance.address;

  console.log(`Shitcoin deployed at ${ShitcoinAddress}`);
  console.log(
    `Balance of walletaddres Racho 🚀 ${await ShitcoinInstance.balanceOf(
      "0xdC457839AbE50082722B09b1B1F30dd617668772"
    )}`
  );
  console.log(
    `Balance of walletaddres Tincho 🚀 ${await ShitcoinInstance.balanceOf(
      "0xB156Ebe47aC4A7d40cF6f43BaFea242fC2fEE6b3"
    )}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
