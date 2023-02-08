const { ethers } = require("hardhat");

async function main() {
  const depositPaymasterFactory = await ethers.getContractFactory("DepositPaymaster");
  const depositPaymasterInstance = await depositPaymasterFactory.deploy("0x4bd797204A6eB2F33DB52c898Dd5Fdfc19bbc334");

  await depositPaymasterInstance.deployed();
  const depositPaymasterAddress = depositPaymasterInstance.address;

  console.log(`depositPaymaster deployed at ${depositPaymasterAddress}`);

  try {
    await run("verify:verify", {
      address: depositPaymasterAddress,
      constructorArguments: ["0x4bd797204A6eB2F33DB52c898Dd5Fdfc19bbc334"],
    });
  } catch (error) {
    console.log("depositPaymaster verify failed:", error);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Creat2 deployed at 0x4593E032481bf78A7462822B4b279306989cfD36
// WETH deployed at 0x217c132171845A65A40e612A0A28C915a84214b4