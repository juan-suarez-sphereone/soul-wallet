const { ethers } = require("hardhat");

async function main() {
  const paymasterTransferFactory = await ethers.getContractFactory("WETHTokenPaymaster1111");
  const paymasterTransferInstance = await paymasterTransferFactory.deploy("0x4bd797204A6eB2F33DB52c898Dd5Fdfc19bbc334", "0x217c132171845A65A40e612A0A28C915a84214b4", "0x95718f7cd230b37E7517Fceb45E733324D7B10E2");

  await paymasterTransferInstance.deployed();
  const paymasterTransferAddress = paymasterTransferInstance.address;

  console.log(`Paymaster Transfer deployed at ${paymasterTransferAddress}`);

  try {
    await run("verify:verify", {
      address: paymasterTransferAddress,
      constructorArguments: ["0x4bd797204A6eB2F33DB52c898Dd5Fdfc19bbc334", "0x217c132171845A65A40e612A0A28C915a84214b4", "0x95718f7cd230b37E7517Fceb45E733324D7B10E2"],
    });
  } catch (error) {
    console.log("Paymaster Transfer verify failed:", error);
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