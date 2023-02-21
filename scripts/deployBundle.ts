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
import { UserOperation, SoulWalletLib, IUserOpReceipt } from "soul-wallet-lib";
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
  let EOA = (await ethers.getSigners())[0];
  console.log("EOA Address: ", EOA.address);
  let create2Factory = "0x17383736805faC95E075f77CFfDA41BAEBB55533"; //mumbai and goerli create2factory
  let soulWalletLib = new SoulWalletLib();

  const walletOwner = EOA.address;
  const walletOwnerPrivateKey = "0x" + [process.env.MUMBAI_PRIVATE_KEY];
  const salt = hexZeroPad(hexlify(0), 32);

  // #region Entrypoint
  const networkBundler: Map<string, string> = new Map();
  networkBundler.set(
    "ArbGoerli",
    "https://bundler-arb-goerli.soulwallets.me/rpc"
  );
  console.log(networkBundler);
  const EntryPointAddress = "0x67B2E1091b18ee967339d8A59bAb7b9423B45947";
  // #endregion GuardianLogic

  const WalletLogicAddress = "0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e";

  let GuardianLogicAddress: "0xF197e47472544848745c6DC62A2d40A2A78881F5";
  let WETHTokenPaymasterAddress: "0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b";
  const chainId = await (await ethers.provider.getNetwork()).chainId;
  const walletFactoryAddress =
    soulWalletLib.Utils.deployFactory.getAddress(WalletLogicAddress);
  console.log("walletFactoryAddress:", walletFactoryAddress);
  // if not deployed, deploy
  if ((await ethers.provider.getCode(walletFactoryAddress)) === "0x") {
    console.log("walletFactory not deployed, deploying...");
    const increaseGasLimit = (estimatedGasLimit: BigNumber) => {
      return ethers.BigNumber.from(Math.pow(10, 8) + "");
      //return estimatedGasLimit.mul(10)  // 10x gas
    };
    await soulWalletLib.Utils.deployFactory.deploy(
      WalletLogicAddress,
      ethers.provider,
      EOA
    );

    while ((await ethers.provider.getCode(walletFactoryAddress)) === "0x") {
      console.log("walletFactory not deployed, waiting...");
      await new Promise((r) => setTimeout(r, 3000));
    }

    console.log("walletFactory deployed, verifying...");
    try {
      // verify contract/SmartWalletFactory.sol:SmartWalletFactory at walletFactoryAddress
      {
        // npx hardhat verify --network ArbGoerli 0xb8EE53678Ffc1fcc1Bec87dEF082dB4Afc72c92B 0xaD1021AD721cb98E682F51489b1aD84395F3e495 0xce0042B868300000d44A59004Da54A005ffdcf9f
        console.log("walletFactoryAddress:", walletFactoryAddress);
        console.log("WalletLogicAddress:", WalletLogicAddress);
        console.log(
          "soulWalletLib.singletonFactory:",
          soulWalletLib.singletonFactory
        );
      }
      await run("verify:verify", {
        address: walletFactoryAddress,
        constructorArguments: [
          WalletLogicAddress,
          soulWalletLib.singletonFactory,
        ],
      });
    } catch (error) {
      console.log("walletFactory verify failed:", error);
    }
  } else {
    console.log("walletFactory already deployed at:" + walletFactoryAddress);
  }

  const WalletFactory = {
    contract: await ethers.getContractAt(
      "SmartWalletFactory",
      walletFactoryAddress
    ),
  };
  const upgradeDelay = 10;
  const guardianDelay = 10;

  const walletAddress = await soulWalletLib.calculateWalletAddress(
    WalletLogicAddress,
    EntryPointAddress,
    walletOwner,
    upgradeDelay,
    guardianDelay,
    SoulWalletLib.Defines.AddressZero
  );

  console.log("walletAddress: " + walletAddress);

  // check if wallet is activated (deployed)
  const code = await ethers.provider.getCode(walletAddress);
  if (code === "0x") {
    const activateOp = soulWalletLib.activateWalletOp(
      WalletLogicAddress,
      EntryPointAddress,
      walletOwner,
      upgradeDelay,
      guardianDelay,
      SoulWalletLib.Defines.AddressZero,
      "0x",
      ethers.utils
        .parseUnits(mockGasFee.high.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.high.suggestedMaxPriorityFeePerGas, "gwei")
        .toString()
    );

    const requiredPrefund = activateOp.requiredPrefund(
      ethers.utils.parseUnits(mockGasFee.estimatedBaseFee, "gwei")
    );
    console.log(
      "requiredPrefund: " + ethers.utils.formatEther(requiredPrefund) + " ETH"
    );
    // send `requiredPrefund` ETH to wallet
    const _balance = await ethers.provider.getBalance(walletAddress);
    if (_balance.lt(requiredPrefund)) {
      const _requiredfund = requiredPrefund.sub(_balance);
      console.log(
        "sending " + ethers.utils.formatEther(_requiredfund) + " ETH to wallet"
      );
      await EOA.sendTransaction({
        to: walletAddress,
        value: _requiredfund,
        from: EOA.address,
      });
    }

    const userOpHash = activateOp.getUserOpHash(EntryPointAddress, chainId);
    activateOp.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );
    const bundler = new soulWalletLib.Bundler(
      EntryPointAddress,
      ethers.provider,
      ""
    );
    //await bundler.init(); // run init to check bundler is alivable
    const validation = await bundler.simulateValidation(activateOp);
    if (validation.status !== 0) {
      throw new Error(`error code:${validation.status}`);
    }
    const simulate = await bundler.simulateHandleOp(activateOp);
    if (simulate.status !== 0) {
      throw new Error(`error code:${simulate.status}`);
    }

    if (true) {
      const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
      const re = await EntryPoint.handleOps([activateOp], EOA.address);
      console.log(re);
      // check if wallet is activated (deployed)
      const code = await ethers.provider.getCode(walletAddress);
      if (code === "0x") {
        throw new Error("wallet not activated");
      } else {
        console.log("wallet activated");
      }
    }
  } else {
    // bundler test
    const nonce = await soulWalletLib.Utils.getNonce(
      walletAddress,
      ethers.provider
    );
    let sendETHOP = await soulWalletLib.Tokens.ETH.transfer(
      ethers.provider,
      walletAddress,
      nonce,
      EntryPointAddress,
      SoulWalletLib.Defines.AddressZero,
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
        .mul(3)
        .toString(),
      EOA.address,
      "2"
    );
    if (!sendETHOP) {
      throw new Error("sendETHOP is null");
    }

    const requiredPrefund = sendETHOP.requiredPrefund(
      ethers.utils.parseUnits(mockGasFee.estimatedBaseFee, "gwei")
    );
    console.log(
      "requiredPrefund: " + ethers.utils.formatEther(requiredPrefund) + " ETH"
    );
    // send `requiredPrefund` ETH to wallet
    const _balance = await ethers.provider.getBalance(walletAddress);
    if (_balance.lt(requiredPrefund)) {
      const _requiredfund = requiredPrefund.sub(_balance);
      console.log(
        "sending " + ethers.utils.formatEther(_requiredfund) + " ETH to wallet"
      );
      await EOA.sendTransaction({
        to: walletAddress,
        value: _requiredfund,
        from: EOA.address,
      });
    }

    const userOpHash = sendETHOP.getUserOpHash(EntryPointAddress, chainId);

    sendETHOP.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );

    const bundlerUrl = networkBundler.get(network.name);
    if (!bundlerUrl) {
      throw new Error(`bundler rpc not found for network ${network.name}`);
    }
    const bundler = new soulWalletLib.Bundler(
      EntryPointAddress,
      ethers.provider,
      bundlerUrl
    );
    await bundler.init();

    const validation = await bundler.simulateValidation(sendETHOP);
    if (validation.status !== 0) {
      throw new Error(`error code:${validation.status}`);
    }
    const simulate = await bundler.simulateHandleOp(sendETHOP);
    if (simulate.status !== 0) {
      throw new Error(`error code:${simulate.status}`);
    }

    const receipt: IUserOpReceipt | null =
      await bundler.eth_getUserOperationReceipt(
        "0xf54c61c780e9c0324147e3f6214d8a007051c90df035a20891bcdb807d4ef71e"
      );

    const bundlerEvent = bundler.sendUserOperation(sendETHOP, 1000 * 60 * 3);
    bundlerEvent.on("error", (err: any) => {
      console.log(err);
    });
    bundlerEvent.on("send", (userOpHash: string) => {
      console.log("send: " + userOpHash);
    });
    bundlerEvent.on("receipt", (receipt: IUserOpReceipt) => {
      console.log("receipt: " + receipt);
    });
    bundlerEvent.on("timeout", () => {
      console.log("timeout");
    });
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//Mumbai
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//
//Goerli
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//
