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
import { use } from "chai";
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
  { name: "Juan", wallet: "0x8020dbB437D720437FDBc0ba5498e1ffB615E8Ab" }, //12
  { name: "Mati", wallet: "0x5349A206F2048663cbA58cA971F98B3b712d7904" }, // 14// 11
  { name: "Coti", wallet: "0x03382278bEd4215ba21Eb2F20293aDe537501D55" }, //13
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
      suggestedMaxPriorityFeePerGas: "20",
      suggestedMaxFeePerGas: "290.173758114",
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
  let EOA = (await ethers.getSigners())[0];
  console.log("EOA Address: ", EOA.address);
  let transactions = [];
  const walletOwner = EOA.address;
  const walletOwnerPrivateKey = "0x" + [process.env.MUMBAI_PRIVATE_KEY];
  let EntryPointAddress = "0x67B2E1091b18ee967339d8A59bAb7b9423B45947";
  let PaymasterAddress = "0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b";
  let SmartWallet = "";
  let menu = "";

  while (menu !== "5") {
    let username = await rlInterface.questionAsync(
      "Please enter you user name:  "
    );
    console.log(`Welcome back ${username}`);

    let SmartWallet = users.filter(
      (user) => user.name.toLowerCase() === username.toLowerCase()
    )[0].wallet;
    console.log("SmartWallet: ", SmartWallet);
    console.log("Plese select from the menu what you'll be sending today");
    console.log("1-Send Matic");
    console.log("2-Send USDC");
    console.log("3-Send WETH");
    console.log("4-Send NFT");
    console.log("5-Checkout");
    menu = await rlInterface.questionAsync("👉   ");

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
      const nonce = await EIP4337Lib.Utils.getNonce(
        SmartWallet,
        ethers.provider
      );

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

      console.log(`You will send ${amount} MATIC to ${_to}`);
      let confirmation = await rlInterface.questionAsync(
        "Confirm to add to queue: (Y/N)    "
      );
      if (confirmation.toLowerCase() === "y") {
        let tx = {
          to: _to,
          amount: amount,
          tx: sendMATIC,
        };
        transactions.push(tx);
      } else if (confirmation.toLowerCase() === "n") {
        console.log("Transaccion disccard ❌");
      }

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
      const nonce = await EIP4337Lib.Utils.getNonce(
        SmartWallet,
        ethers.provider
      );

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
      console.log(`You will send ${amount} USDC to ${_to}`);
      let confirmation = await rlInterface.questionAsync(
        "Confirm to add to queue: (Y/N)    "
      );
      if (confirmation.toLowerCase() === "y") {
        let tx = {
          to: _to,
          amount: amount,
          tx: sendUSDC,
        };
        transactions.push(tx);
      } else if (confirmation.toLowerCase() === "n") {
        console.log("Transaccion disccard ❌");
      }
    } else if (menu === "3") {
      console.log(
        "---------------------- 💰 BALANCE 💰 --------------------------"
      );
      let TokenAddress = "0x03e2Ca7e7047c5A8d487B5a961ad4C5C0140d8D9";
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
      const nonce = await EIP4337Lib.Utils.getNonce(
        SmartWallet,
        ethers.provider
      );

      const sendWETH = await EIP4337Lib.Tokens.ERC20.transfer(
        ethers.provider,
        SmartWallet,
        nonce,
        EntryPointAddress,
        PaymasterAddress,
        ethers.utils
          .parseUnits(mockGasFee.high.suggestedMaxFeePerGas, "gwei")
          .toString(),
        ethers.utils
          .parseUnits(mockGasFee.high.suggestedMaxPriorityFeePerGas, "gwei")
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
      console.log(`You will send ${amount} USDC to ${_to}`);
      let confirmation = await rlInterface.questionAsync(
        "Confirm to add to queue: (Y/N)    "
      );
      if (confirmation.toLowerCase() === "y") {
        let tx = {
          to: _to,
          amount: amount,
          tx: sendWETH,
        };
        transactions.push(tx);
      } else if (confirmation.toLowerCase() === "n") {
        console.log("Transaccion disccard ❌");
      }
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
      const nonce = await EIP4337Lib.Utils.getNonce(
        SmartWallet,
        ethers.provider
      );

      const sendNFT = await EIP4337Lib.Tokens.ERC721.transferFrom(
        ethers.provider,
        SmartWallet,
        nonce,
        EntryPointAddress,
        PaymasterAddress,
        ethers.utils
          .parseUnits(mockGasFee.high.suggestedMaxFeePerGas, "gwei")
          .toString(),
        ethers.utils
          .parseUnits(mockGasFee.high.suggestedMaxPriorityFeePerGas, "gwei")
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
      console.log(`You will send NFT n° ${id} to ${_to}`);
      let confirmation = await rlInterface.questionAsync(
        "Confirm to add to queue: (Y/N)    "
      );
      if (confirmation.toLowerCase() === "y") {
        let tx = {
          to: _to,
          amount: id,
          tx: sendNFT,
        };
        transactions.push(tx);
      } else if (confirmation.toLowerCase() === "n") {
        console.log("Transaccion disccard ❌");
      }
    }
  }
  let finalConfirmation = await rlInterface.questionAsync(
    `\n Confirm that you wanto to send:  \n ${transactions.length} transfers  (Y/N):    `
  );
  if (finalConfirmation.toLowerCase() === "y") {
    let userOp = transactions.map((tx) => tx.tx);
    console.log(userOp);
    const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);

    const re = await EntryPoint.handleOps(userOp, EOA.address);
    console.log(re);
    console.log(`Transactions completed`);
  } else {
    console.log("Transactions dicard ❌");
  }
  // #endregion GuardianLogic
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
//SmartWallet2:0x5349A206F2048663cbA58cA971F98B3b712d7904
//SmartWalletCoti:0x03382278bEd4215ba21Eb2F20293aDe537501D55
//Goerli
//EntryPointAddress: 0x67B2E1091b18ee967339d8A59bAb7b9423B45947
//WalletLogicAddress: 0xdf7F1e7b7935df644FCf9eb99A16B1554861da5e
//GuardianLogicAddress: 0xF197e47472544848745c6DC62A2d40A2A78881F5
//WETHTokenPaymasterAddress: 0x2aE9dCD2d24A066E534f53A59C8e93d58E959E6b
//SmartWallet: 0x8020dbB437D720437FDBc0ba5498e1ffB615E8Ab
//SmartWallet2:0x5349A206F2048663cbA58cA971F98B3b712d7904
//SmartWalletCoti: 0x03382278bEd4215ba21Eb2F20293aDe537501D55
