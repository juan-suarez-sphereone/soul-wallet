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
  let mockGasFee = {
    low: {
      suggestedMaxPriorityFeePerGas: "1",
      suggestedMaxFeePerGas: "16.984563596",
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 30000,
    },
    medium: {
      suggestedMaxPriorityFeePerGas: "1.5",
      suggestedMaxFeePerGas: "23.079160855",
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 45000,
    },
    high: {
      suggestedMaxPriorityFeePerGas: "2",
      suggestedMaxFeePerGas: "29.173758114",
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
    },
    estimatedBaseFee: "15.984563596",
    networkCongestion: 0.31675,
    latestPriorityFeeRange: ["0.131281956", "4.015436404"],
    historicalPriorityFeeRange: ["0.02829803", "58.45567467"],
    historicalBaseFeeRange: ["13.492240252", "17.51875421"],
    priorityFeeTrend: "level",
    baseFeeTrend: "down",
  };
  let create2Factory = "";
  let WETHContractAddress = "";
  let EOA = (await ethers.getSigners())[0];
  let EntryPointAddress = "0xe683550A3D0605c95D586044C77eb9e3B7E947a6";
  let WETHTokenPaymasterAddress = EIP4337Lib.Defines.AddressZero;
  let walletAddress = "0x29245BA65003C4988b1cF2A07E8189d7cb1d1E8e";

  if (network.name === "mumbai") {
    create2Factory = "0x4593E032481bf78A7462822B4b279306989cfD36";
    WETHContractAddress = "0x164c681fb5ea009508b49230db7d47749206c16a";
  }

  if (!create2Factory) {
    throw new Error("create2Factory not set");
  }
  if (!WETHContractAddress) {
    throw new Error("WETHContractAddress not set");
  }

  const chainId = await (await ethers.provider.getNetwork()).chainId;

  const walletOwner = EOA.address;
  const walletOwnerPrivateKey = "0x" + [process.env.MUMBAI_PRIVATE_KEY];

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
      .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
      .toString(),
    ethers.utils
      .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
      .toString(),
    WETHContractAddress,
    EOA.address,
    "200000000000000000"
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
  const re = await EntryPoint.handleOps([sendWETHOP], walletAddress);
  console.log(re);

  // #endregion send 1wei Weth to wallet
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//0.918771970874629169 EOA balance before
// 0.000136228951403571 Tx gas fee
// 0.918696602923874782 EOA balance after

//Common Create2Factory "0x17383736805faC95E075f77CFfDA41BAEBB55533"
//Common WETH Token "0x03e2Ca7e7047c5A8d487B5a961ad4C5C0140d8D9"
//Mumbai
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//WETHTokenPaymasterAddress: 0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b
//Goerli
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//WETHTokenPaymasterAddress: 0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b
