/*
 * @Description:
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-12-26 23:06:27
 * @LastEditors: cejay
 * @LastEditTime: 2023-01-03 09:50:01
 */

import { BigNumber } from "ethers";
import {
  getCreate2Address,
  hexlify,
  hexZeroPad,
  keccak256,
} from "ethers/lib/utils";
import { ethers, network, run } from "hardhat";
import { EIP4337Lib, UserOperation } from "soul-wallet-lib";
import {
  WETH9__factory,
  WETHTokenPaymaster__factory,
  Create2Factory__factory,
  EntryPoint__factory,
} from "../src/types/index";
import { Utils } from "../test/Utils";
import dotenv from "dotenv";
dotenv.config();
import * as ethUtil from "ethereumjs-util";


async function main() {
 
  let create2Factory = "";
  let EOA = (await ethers.getSigners())[0];
  console.log("EOA Address: ", EOA.address)

  if (network.name === "mumbai") {
    create2Factory = "0x4593E032481bf78A7462822B4b279306989cfD36";
  }

  if (!create2Factory) {
    throw new Error("create2Factory not set");
  }
 
  const salt = hexZeroPad(hexlify(30), 32);

  // #region Entrypoint

  const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
  // get EntryPointFactory deployed bytecode
  const EntryPointFactoryBytecode = EntryPointFactory.bytecode;
  // get create2 address
  const EntryPointInitCodeHash = keccak256(EntryPointFactoryBytecode);
  const EntryPointAddress = getCreate2Address(
    create2Factory,
    salt,
    EntryPointInitCodeHash
  );
  console.log("EntryPointAddress:", EntryPointAddress);
  
  // if not deployed, deploy
  if ((await ethers.provider.getCode(EntryPointAddress)) === "0x") {
    console.log("EntryPoint not deployed, deploying...");
    const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
      return ethers.BigNumber.from(Math.pow(10, 7) + "");
      //return estimatedGasLimit.mul(10)  // 10x gas
    };
    const create2FactoryContract = Create2Factory__factory.connect(
      create2Factory,
      EOA
    );
    const estimatedGas = await create2FactoryContract.estimateGas.deploy(
      EntryPointFactoryBytecode,
      salt
    );
    const tx = await create2FactoryContract.deploy(
      EntryPointFactoryBytecode,
      salt,
      { gasLimit: increaseGasLimit(estimatedGas) }
    );
    console.log("EntryPoint tx:", tx.hash);
    while ((await ethers.provider.getCode(EntryPointAddress)) === "0x") {
      console.log("EntryPoint not deployed, waiting...");
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log("EntryPoint deployed, verifying...");
    try {
      await run("verify:verify", {
        address: EntryPointAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("EntryPoint verify failed:", error);
    }
  } else {
  }

  // #endregion Entrypoint

  // #region WalletLogic

  const WalletLogicFactory = await ethers.getContractFactory("SmartWallet");
  const WalletLogicBytecode = WalletLogicFactory.bytecode;
  const WalletLogicInitCodeHash = keccak256(WalletLogicBytecode);
  console.log("Wallet Logic Code Hash:", WalletLogicInitCodeHash)
  const WalletLogicAddress = getCreate2Address(
    create2Factory,
    salt,
    WalletLogicInitCodeHash
  );
  console.log("WalletLogicAddress:", WalletLogicAddress);
  // if not deployed, deploy
  if ((await ethers.provider.getCode(WalletLogicAddress)) === "0x") {
    console.log("WalletLogic not deployed, deploying...");
    const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
      return ethers.BigNumber.from(Math.pow(10, 7) + "");
      //return estimatedGasLimit.mul(10)  // 10x gas
    };
    const create2FactoryContract = Create2Factory__factory.connect(
      create2Factory,
      EOA
    );
    const estimatedGas = await create2FactoryContract.estimateGas.deploy(
      WalletLogicBytecode,
      salt
    );
    const tx = await create2FactoryContract.deploy(WalletLogicBytecode, salt, {
      gasLimit: increaseGasLimit(estimatedGas),
    });
    console.log("WalletLogic tx:", tx.hash);
    while ((await ethers.provider.getCode(WalletLogicAddress)) === "0x") {
      console.log("WalletLogic not deployed, waiting...");
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log("WalletLogic deployed, verifying...");
    try {
      await run("verify:verify", {
        address: WalletLogicAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("WalletLogic verify failed:", error);
    }
  } else {
  }

  // #endregion WalletLogic

  // #region GuardianLogic

  const GuardianLogicFactory = await ethers.getContractFactory(
    "GuardianMultiSigWallet"
  );
  const GuardianLogicBytecode = GuardianLogicFactory.bytecode;
  const GuardianLogicInitCodeHash = keccak256(GuardianLogicBytecode);
  const GuardianLogicAddress = getCreate2Address(
    create2Factory,
    salt,
    GuardianLogicInitCodeHash
  );
  console.log("GuardianLogicAddress:", GuardianLogicAddress);
  // if not deployed, deploy
  if ((await ethers.provider.getCode(GuardianLogicAddress)) === "0x") {
    console.log("GuardianLogic not deployed, deploying...");
    const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
      return ethers.BigNumber.from(Math.pow(10, 7) + "");
      //return estimatedGasLimit.mul(10)  // 10x gas
    };
    const create2FactoryContract = Create2Factory__factory.connect(
      create2Factory,
      EOA
    );
    const estimatedGas = await create2FactoryContract.estimateGas.deploy(
      GuardianLogicBytecode,
      salt
    );
    const tx = await create2FactoryContract.deploy(
      GuardianLogicBytecode,
      salt,
      { gasLimit: increaseGasLimit(estimatedGas) }
    );
    console.log("GuardianLogic tx:", tx.hash);
    while ((await ethers.provider.getCode(GuardianLogicAddress)) === "0x") {
      console.log("GuardianLogic not deployed, waiting...");
      await new Promise((r) => setTimeout(r, 3000));
    }
    console.log("GuardianLogic deployed, verifying...");
    try {
      await run("verify:verify", {
        address: GuardianLogicAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("GuardianLogic verify failed:", error);
    }
  } else {
  }

  // #endregion GuardianLogic
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
