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
  let EOA = (await ethers.getSigners())[0];
  let EntryPointAddress = "0xA0a5f4014064Ef0B4DF13d55Ef201F585DBBd7e2";
  let WETHTokenPaymasterAddress = "0x695823A0feD349eb7197CC68246de20CF5d429Ce";
  let walletAddress = "0xb21D07b2DE3Bc66790E72223B5e7512372df2b69"

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

  const chainId = await (await ethers.provider.getNetwork()).chainId;

  const walletOwner = EOA.address;
  const walletOwnerPrivateKey = "0x" + [process.env.PRIVATE_KEY];

  // #region send 1wei Weth to wallet
  const nonce = await EIP4337Lib.Utils.getNonce(walletAddress, ethers.provider);
  let eip1559GasFee: any;
  eip1559GasFee = await EIP4337Lib.Utils.suggestedGasFee.getEIP1559GasFees(
    chainId
  );
  if (!eip1559GasFee) {
    throw new Error("eip1559GasFee is null");
  }

  const sendWETHOP = await EIP4337Lib.Tokens.ERC20.transfer(
    ethers.provider,
    walletAddress,
    nonce,
    EntryPointAddress,
    WETHTokenPaymasterAddress,
    ethers.utils
      .parseUnits(eip1559GasFee.medium.suggestedMaxFeePerGas, "gwei")
      .toString(),
    ethers.utils
      .parseUnits(eip1559GasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
      .toString(),
    WETHContractAddress,
    EOA.address,
    "1"
  );
  if (!sendWETHOP) {
    throw new Error("sendWETHOP is null");
  }
  const userOpHash = sendWETHOP.getUserOpHash(EntryPointAddress, chainId);
  sendWETHOP.signWithSignature(
    walletOwner,
    Utils.signMessage(userOpHash, walletOwnerPrivateKey)
  );
  await EIP4337Lib.RPC.simulateHandleOp(
    ethers.provider,
    EntryPointAddress,
    sendWETHOP
  );
  const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
  console.log(sendWETHOP);
  const re = await EntryPoint.handleOps([sendWETHOP], EOA.address);
  console.log(re);

  // #endregion send 1wei Weth to wallet
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
