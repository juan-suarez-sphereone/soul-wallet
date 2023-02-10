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
import { EntryPoint__factory, WETH9__factory } from "../src/types/index";
import { Utils } from "../test/Utils";
import dotenv from "dotenv";
dotenv.config();
import * as ethUtil from "ethereumjs-util";
let readline = require("readline-promise").default;
const rlInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});
// let fs = require("fs").promise;

// async function readFile(filePath: string) {
//   try {
//     const data = await fs.readFile(filePath);
//     console.log(data.toString());
//   } catch (error: any) {
//     console.error(`Got an error trying to read the file: ${error.message}`);
//   }
// }
// readFile("texto.txt");
let users = [
  { name: "Juan", wallet: "0xffe367d89bEb0c2Fb9088c0949d717270CcBC831" }, //12
  { name: "Mati", wallet: "0x1F72e1D63b4940e4d44a16d6dF5A64c71860CA54" }, // 14
  { name: "Tincho", wallet: "0xdC7359023D0B8d6B59112aB53984dD95a40791C2" }, //10
  { name: "Diego", wallet: "0x06813E67bD5867e5DfB75F5BDF903fD0c648E892" }, // 11
  { name: "Coti", wallet: "0x8F1D1867B7DBf9CE0d8FD5D593127C13662E3b45" }, //13
];

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

  console.log(
    "\n ✨  HELLO THERE!  ✨ \n\n 🤖  Welcome to our Smart Wallet demo 🤖 \n - Created with the Soul-Wallet Library - \n\n ✅ Make transactions between diferent tokens and accounts \n ✅ Paymaster will cover the gas fees for you \n\n"
  );
  let username = await rlInterface.questionAsync(
    "Please enter you user name:  "
  );
  console.log(`Welcome back ${username}`);

  let EOA = (await ethers.getSigners())[0];
  console.log("EOA Address: ", EOA.address);

  let SmartWallet = users.filter(
    (user) => user.name.toLowerCase() === username.toLowerCase()
  )[0].wallet;
  console.log("SmartWallet: ", SmartWallet);

  const walletOwner = EOA.address;
  const walletOwnerPrivateKey = "0x" + [process.env.MUMBAI_PRIVATE_KEY];
  let EntryPointAddress = "0xa40CBE24Bfe961b759FE8549040d5c80d56400e6";
  let PaymasterAddress = "0xE56CE953F65f14d9D09A19aC804665549D55F2D3";

  console.log("Plese select from the menu what you'll be sending today");
  console.log("1-Send Matic");
  console.log("2-Send USDC");
  console.log("3-Send WETH");
  console.log("4-Send NFT");
  let menu = await rlInterface.questionAsync("👉   ");

  if (menu === "1") {
    console.log(
      "---------------------- 💰 BALANCE 💰 --------------------------"
    );

    const provider = ethers.getDefaultProvider();
    let maticBalance = await provider.getBalance(SmartWallet);
    console.log(`MATIC: ${ethers.utils.formatUnits(maticBalance)}`);

    let destination = await rlInterface.questionAsync(
      "Who do you want to send MATIC to: 👨🏻‍💻🧑🏻‍💻  "
    );
    let _to = users.filter(
      (user) => user.name.toLowerCase() === destination.toLowerCase()
    )[0].wallet;
    let amount = await rlInterface.questionAsync(
      "How much do you want to send: 💰    "
    );
    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const nonce = await EIP4337Lib.Utils.getNonce(SmartWallet, ethers.provider);

    const sendMATIC = await EIP4337Lib.Tokens.ETH.transfer(
      ethers.provider,
      SmartWallet,
      nonce,
      EntryPointAddress,
      PaymasterAddress,
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
        .toString(),
      _to,
      amount
    );
    if (!sendMATIC) {
      throw new Error("sendMATIC is null");
    }
    const userOpHash = sendMATIC.getUserOpHash(EntryPointAddress, chainId);
    sendMATIC.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );
    await EIP4337Lib.RPC.simulateHandleOp(
      ethers.provider,
      EntryPointAddress,
      sendMATIC
    );
    const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
    console.log(sendMATIC);
    const re = await EntryPoint.handleOps([sendMATIC], SmartWallet);
    console.log(re);
    console.log(
      `Transaction successful you now have ${await provider.getBalance(
        SmartWallet
      )} MATIC on your wallet  `
    );

    // #region Entrypoint

    // if not deployed, deploy
  } else if (menu === "2") {
    let TokenAddress = "0x164C681FB5eA009508B49230db7d47749206C16A";
    console.log(
      "---------------------- 💰 BALANCE 💰 --------------------------"
    );
    let ERC20Contract = WETH9__factory.connect(TokenAddress, EOA);
    console.log(`USDC: ${await ERC20Contract.balanceOf(SmartWallet)}`);
    let destination = await rlInterface.questionAsync(
      "Who do you want to send USDC to:👨🏻‍💻🧑🏻‍💻    "
    );
    let _to = users.filter(
      (user) => user.name.toLowerCase() === destination.toLowerCase()
    )[0].wallet;
    let amount = await rlInterface.questionAsync(
      "How much do you want to send: 💰  "
    );
    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const nonce = await EIP4337Lib.Utils.getNonce(SmartWallet, ethers.provider);

    const sendUSDC = await EIP4337Lib.Tokens.ERC20.transfer(
      ethers.provider,
      SmartWallet,
      nonce,
      EntryPointAddress,
      PaymasterAddress,
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
        .toString(),
      TokenAddress,
      _to,
      amount
    );
    if (!sendUSDC) {
      throw new Error("sendUSDC is null");
    }
    const userOpHash = sendUSDC.getUserOpHash(EntryPointAddress, chainId);
    sendUSDC.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );
    await EIP4337Lib.RPC.simulateHandleOp(
      ethers.provider,
      EntryPointAddress,
      sendUSDC
    );
    const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
    console.log(sendUSDC);
    const re = await EntryPoint.handleOps([sendUSDC], SmartWallet);
    console.log(re);
    console.log(
      `Transaction successful you now have ${await (
        await ERC20Contract.balanceOf(SmartWallet)
      ).sub(amount)} USDC on your wallet  `
    );
  } else if (menu === "3") {
    console.log(
      "---------------------- 💰 BALANCE 💰 --------------------------"
    );
    let TokenAddress = "0x217c132171845A65A40e612A0A28C915a84214b4";
    let ERC20Contract = WETH9__factory.connect(TokenAddress, EOA);
    console.log(`WETH: ${await ERC20Contract.balanceOf(SmartWallet)}`);

    let destination = await rlInterface.questionAsync(
      "Who do you want to send WETH to: 👨🏻‍💻🧑🏻‍💻   "
    );
    let _to = users.filter(
      (user) => user.name.toLowerCase() === destination.toLowerCase()
    )[0].wallet;
    let amount = await rlInterface.questionAsync(
      "How much do you want to send:  💰    "
    );
    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const nonce = await EIP4337Lib.Utils.getNonce(SmartWallet, ethers.provider);

    const sendWETH = await EIP4337Lib.Tokens.ERC20.transfer(
      ethers.provider,
      SmartWallet,
      nonce,
      EntryPointAddress,
      PaymasterAddress,
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
        .toString(),
      TokenAddress,
      _to,
      amount
    );
    if (!sendWETH) {
      throw new Error("sendWETH is null");
    }
    const userOpHash = sendWETH.getUserOpHash(EntryPointAddress, chainId);
    sendWETH.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );
    await EIP4337Lib.RPC.simulateHandleOp(
      ethers.provider,
      EntryPointAddress,
      sendWETH
    );
    const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
    console.log(sendWETH);
    const re = await EntryPoint.handleOps([sendWETH], SmartWallet);
    console.log(re);
    console.log(
      `Transaction successful you now have ${await ERC20Contract.balanceOf(
        SmartWallet
      )} WETH on your wallet  `
    );
  } else if (menu === "4") {
    console.log(
      "---------------------- 💰 BALANCE 💰 --------------------------"
    );
    let TokenAddress = "0x8337A008949C0e6F3D8ac5cE6956d4d17fcfCeC5";
    let ERC721Contract = WETH9__factory.connect(TokenAddress, EOA);
    console.log(
      `You have ${await ERC721Contract.balanceOf(
        SmartWallet
      )} NFT in this collection`
    );
    let destination = await rlInterface.questionAsync(
      "Who do you want to send the NFT to: 👨🏻‍💻🧑🏻‍💻   "
    );
    let _to = users.filter(
      (user) => user.name.toLowerCase() === destination.toLowerCase()
    )[0].wallet;
    let id = await rlInterface.questionAsync("Select the NFT Id: 🖼️     ");
    const chainId = await (await ethers.provider.getNetwork()).chainId;
    const nonce = await EIP4337Lib.Utils.getNonce(SmartWallet, ethers.provider);

    const sendNFT = await EIP4337Lib.Tokens.ERC721.transferFrom(
      ethers.provider,
      SmartWallet,
      nonce,
      EntryPointAddress,
      PaymasterAddress,
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(mockGasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
        .toString(),
      TokenAddress,
      SmartWallet,
      _to,
      id
    );
    if (!sendNFT) {
      throw new Error("sendNFT is null");
    }
    const userOpHash = sendNFT.getUserOpHash(EntryPointAddress, chainId);
    sendNFT.signWithSignature(
      walletOwner,
      Utils.signMessage(userOpHash, walletOwnerPrivateKey)
    );
    await EIP4337Lib.RPC.simulateHandleOp(
      ethers.provider,
      EntryPointAddress,
      sendNFT
    );
    const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
    console.log(sendNFT);
    const re = await EntryPoint.handleOps([sendNFT], SmartWallet);
    console.log(re);
    console.log(
      `Transaction successful you now have ${await ERC721Contract.balanceOf(
        SmartWallet
      )} NFT in this collection  `
    );
  }
  process.exit;
  // #endregion GuardianLogic
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
