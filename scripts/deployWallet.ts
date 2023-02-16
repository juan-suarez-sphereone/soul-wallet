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
  let create2Factory = "0x17383736805faC95E075f77CFfDA41BAEBB55533";
  let WETHContractAddress = "0x03e2Ca7e7047c5A8d487B5a961ad4C5C0140d8D9";
  let EOA = (await ethers.getSigners())[0];
  let WalletLogicAddress = "0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e";
  let EntryPointAddress = "0x67B2E1091b18ee967339d8A59bAb7b9423B45947";
  let WETHTokenPaymasterAddress = "0xFb023d1b3cCF1934924cd6B38E0EbB2acb2fF563";

  if (!create2Factory) {
    throw new Error("create2Factory not set");
  }
  if (!WETHContractAddress) {
    throw new Error("WETHContractAddress not set");
  }

  const chainId = await (await ethers.provider.getNetwork()).chainId;

  const walletOwner = EOA.address;
  const walletOwnerPrivateKey = "0x" + [process.env.MUMBAI_PRIVATE_KEY];
  // const _paymasterStake = "" + Math.pow(12, 15);
  // const WETHPaymaster = await WETHTokenPaymaster__factory.connect(
  //   WETHTokenPaymasterAddress,
  //   EOA
  // );
  // console.log(await WETHPaymaster.owner());
  // console.log("adding stake");
  // await WETHPaymaster.addStake(12, {
  //   from: EOA.address,
  //   value: _paymasterStake,
  // });
  // await WETHPaymaster.deposit({
  //   from: EOA.address,
  //   value: _paymasterStake,
  // });

  // #region deploy wallet

  const upgradeDelay = 10;
  const guardianDelay = 10;
  const walletAddress = await EIP4337Lib.calculateWalletAddress(
    WalletLogicAddress,
    EntryPointAddress,
    walletOwner,
    upgradeDelay,
    guardianDelay,
    EIP4337Lib.Defines.AddressZero,
    WETHContractAddress,
    WETHTokenPaymasterAddress,
    0,
    create2Factory
  );

  console.log("walletAddress: " + walletAddress);

  // send 0.002 WETH to wallet

  const WETHContract = WETH9__factory.connect(WETHContractAddress, EOA);
  const _b = await WETHContract.balanceOf(walletAddress);
  console.log(_b);
  // console.log("sending 0.02 WETH to wallet");
  // await WETHContract.transferFrom(
  //   EOA.address,
  //   walletAddress,
  //   ethers.utils.parseEther("0.02")
  // );

  // check if wallet is activated (deployed)
  const code = await ethers.provider.getCode(walletAddress);
  if (code === "0x") {
    console.log("Wallet No Activada. COMIENZA ACTIVACION");
    // get gas price
    let eip1559GasFee: any;

    eip1559GasFee = await EIP4337Lib.Utils.suggestedGasFee.getEIP1559GasFees(
      chainId
    );
    if (!eip1559GasFee) {
      throw new Error("eip1559GasFee is null");
    }

    const activateOp = EIP4337Lib.activateWalletOp(
      WalletLogicAddress,
      EntryPointAddress,
      walletOwner,
      upgradeDelay,
      guardianDelay,
      EIP4337Lib.Defines.AddressZero,
      WETHContractAddress,
      WETHTokenPaymasterAddress,
      0,
      create2Factory,
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
        .toString()
    );

    const userOpHash = activateOp.getUserOpHash(EntryPointAddress, chainId);

    activateOp.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );
    await EIP4337Lib.RPC.simulateHandleOp(
      ethers.provider,
      EntryPointAddress,
      activateOp
    );
    const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
    const re = await EntryPoint.handleOps([activateOp], EOA.address);
    console.log(re);
  }
  const paymasterContract = WETHTokenPaymaster__factory.connect(
    WETHTokenPaymasterAddress,
    EOA
  );
  const smartWalletCodeHash = keccak256(walletAddress);
  console.log(smartWalletCodeHash);
  const addWallet = await paymasterContract.addWallet(smartWalletCodeHash);
  console.log(addWallet);
  // #endregion deploy wallet
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//Common Create2Factory "0x17383736805faC95E075f77CFfDA41BAEBB55533"
//Common WETH Token "0x03e2Ca7e7047c5A8d487B5a961ad4C5C0140d8D9"
//Mumbai
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//WETHTokenPaymasterAddress: 0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b
//SmartWallet: 0x8020dbB437D720437FDBc0ba5498e1ffB615E8Ab
//Goerli
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//WETHTokenPaymasterAddress: 0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b
//SmartWallet: 0x8020dbB437D720437FDBc0ba5498e1ffB615E8Ab
