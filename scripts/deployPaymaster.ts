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
  // npx hardhat run --network goerli scripts/deploy.ts

  let create2Factory = "";
  let WETHContractAddress = "";
  let EntryPointAddress = "0x0e15E3A09E03709888901E18aEa9fF580BFB69a7"
  let EOA = (await ethers.getSigners())[0];

  if (network.name === "mumbai") {
    create2Factory = "0x4593E032481bf78A7462822B4b279306989cfD36";
    WETHContractAddress = "0x217c132171845A65A40e612A0A28C915a84214b4";
  }

  if (!create2Factory) {
    throw new Error("create2Factory not set");
  }
  if (!WETHContractAddress) {
    throw new Error("WETHContractAddress not set");
  }

  const salt = hexZeroPad(hexlify(35), 32);

  // #region WETHPaymaster

  const WETHTokenPaymasterFactory = await ethers.getContractFactory(
    "WETHTokenPaymaster"
  );
  const WETHTokenPaymasterBytecode =
    WETHTokenPaymasterFactory.getDeployTransaction(
      EntryPointAddress,
      WETHContractAddress,
      EOA.address
    ).data;
  if (!WETHTokenPaymasterBytecode) {
    throw new Error("WETHTokenPaymasterBytecode not set");
  }
  const WETHTokenPaymasterInitCodeHash = keccak256(WETHTokenPaymasterBytecode);
  const WETHTokenPaymasterAddress = getCreate2Address(
    create2Factory,
    salt,
    WETHTokenPaymasterInitCodeHash
  );
  console.log("WETHTokenPaymasterAddress:", WETHTokenPaymasterAddress);
  // if not deployed, deploy
  if ((await ethers.provider.getCode(WETHTokenPaymasterAddress)) === "0x") {
    console.log("WETHTokenPaymaster not deployed, deploying...");
    const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
      return ethers.BigNumber.from(Math.pow(10, 7) + "");
      //return estimatedGasLimit.mul(10)  // 10x gas
    };
    const create2FactoryContract = Create2Factory__factory.connect(
      create2Factory,
      EOA
    );
    const estimatedGas = await create2FactoryContract.estimateGas.deploy(
      WETHTokenPaymasterBytecode,
      salt
    );
    const tx = await create2FactoryContract.deploy(
      WETHTokenPaymasterBytecode,
      salt,
      { gasLimit: increaseGasLimit(estimatedGas) }
    );
    console.log("EntryPoint tx:", tx.hash);
    while (
      (await ethers.provider.getCode(WETHTokenPaymasterAddress)) === "0x"
    ) {
      console.log("WETHTokenPaymaster not deployed, waiting...");
      await new Promise((r) => setTimeout(r, 6000));
    }
    {
      const _paymasterStake = "" + Math.pow(12, 16);
      const WETHPaymaster = await WETHTokenPaymaster__factory.connect(
        WETHTokenPaymasterAddress,
        EOA
      );
      console.log(await WETHPaymaster.owner());
      console.log("adding stake");
      await WETHPaymaster.addStake(12, {
        from: EOA.address,
        value: _paymasterStake,
      });
      await WETHPaymaster.deposit({
        from: EOA.address,
        value: _paymasterStake,
      });
    }

    console.log("WETHTokenPaymaster deployed, verifying...");
    try {
      await run("verify:verify", {
        address: WETHTokenPaymasterAddress,
        constructorArguments: [
          EntryPointAddress,
          WETHContractAddress,
          EOA.address,
        ],
      });
    } catch (error) {
      console.log("WETHTokenPaymaster verify failed:", error);
    }
  } else {
  }
  // #endregion WETHPaymaster
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
