/*
 * @Description:
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-12-26 23:06:27
 * @LastEditors: cejay
 * @LastEditTime: 2023-01-03 09:50:01
 */

import {
  getCreate2Address,
  hexlify,
  hexZeroPad,
  keccak256,
} from "ethers/lib/utils";
import { ethers, network, run } from "hardhat";
import { EIP4337Lib, UserOperation } from "soul-wallet-lib";
import { WETH9__factory, EntryPoint__factory } from "../src/types/index";
import { Utils } from "../test/Utils";
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

  // npx hardhat run --network goerli scripts/deploy.ts

  let create2Factory = "";
  let WETHContractAddress = "";
  let EOA;

  if (network.name === "mumbai") {
    EOA = await ethers.getSigner("0x474220E3aE3B3b31bba681ea8ECBBd8a535D0Bb7");
    create2Factory = "0x029A613761EfD429E82D72257817557cfF87a4fE";
    WETHContractAddress = "0x0764E4da6F0E2dB75F02Db0083cd648bF298A880";
  } else {
    console.log("SHOULD TEST IN MUMBAI");
  }

  if (!create2Factory) {
    throw new Error("create2Factory not set");
  }
  if (!WETHContractAddress) {
    throw new Error("WETHContractAddress not set");
  }

  const chainId = await (await ethers.provider.getNetwork()).chainId;

  const walletOwner = "0x93EDb58cFc5d77028C138e47Fffb929A57C52082";
  const walletOwnerPrivateKey =
    "0x82cfe73c005926089ebf7ec1f49852207e5670870d0dfa544caabb83d2cd2d5f";

  const salt = hexZeroPad(hexlify(0), 32);

  console.log("Create2Factory: " + create2Factory);
  console.log("WETH Contract Address: " + WETHContractAddress);
  console.log(" ");

  console.log("Address of Contracts:");
  console.log(" ");

  // #region Entrypoint

  const EntryPointAddress = "0x6bfc015F131d0BfC5AD06F39B6212C289a12AB96";
  console.log("EntryPoint address:", EntryPointAddress);
  // #region WETHPaymaster

  const WETHTokenPaymasterAddress =
    "0x2910e660c0dA0Ce88eDe60DF82237ECE8D357151";
  console.log("WETHTokenPaymasterAddress:", WETHTokenPaymasterAddress);

  // #region WalletLogic

  const WalletLogicAddress = "0x6dA5c78ce5f6a3Ade6DF5849428943F64a26AC89";
  console.log("Wallet Logic Address: " + WalletLogicAddress);

  // #region GuardianLogic

  const GuardianLogicAddress = "0xf351781085F38BE1371B98a003150bBb6f1539c4";

  // #region deploy wallet

  // #set Wallet Address a mano ahora
  const walletAddress = "0xDfdc9eFD54364aFf021DD0E1F38FE138E58eB04c";
  const tinchoWallet = "0xfe3f8dBf3340600927b1D165662C6F627BCc0e32";
  console.log("walletAddress: " + walletAddress);

  console.log("---------------------");

  console.log("Balances Of TIN:");
  console.log(" ");

  // send 0.02 WETH to wallet
  const WETHContract = WETH9__factory.connect(WETHContractAddress, EOA);
  const _b = await WETHContract.balanceOf(walletAddress);
  console.log("Balance of Wallet Address: " + _b);
  const _EOABalance = await WETHContract.balanceOf(EOA.address);
  console.log(
    "Balance of EOA Address: " + ethers.utils.parseEther(_EOABalance.toString())
  );
  const _entryBalance = await WETHContract.balanceOf(EntryPointAddress);
  console.log("Balance of EntryContract: " + _entryBalance);
  const _paymasterBalance = await WETHContract.balanceOf(
    WETHTokenPaymasterAddress
  );
  console.log("Balance of Paymaster: " + _paymasterBalance);
  const _guardianBalance = await WETHContract.balanceOf(GuardianLogicAddress);
  console.log("Balance of Guardian: " + _guardianBalance);
  console.log("---------------");

  // #region send 1wei Weth to wallet
  const nonce = await EIP4337Lib.Utils.getNonce(walletAddress, ethers.provider);
  let eip1559GasFee: any;
  eip1559GasFee = mockGasFee;

  // ESTA FUNCION ENVIA A EOA tokens TIN/WETH
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
    tinchoWallet,
    "20"
  );

  if (!sendWETHOP) {
    throw new Error("sendWETHOP is null");
  }

  //ACA FIRMA LA OPERACION ANTERIOR CON TU PRIVATE KEY
  const userOpHash = sendWETHOP.getUserOpHash(EntryPointAddress, chainId);
  sendWETHOP.signWithSignature(
    walletOwner,
    Utils.signMessage(userOpHash, walletOwnerPrivateKey)
  );

  // EL ENTRY POINT EJECUTA LA TX SI EL MSJ VA FIRMADO POR MI WALLET
  const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
  console.log(sendWETHOP);
  const re = await EntryPoint.handleOps([sendWETHOP], EOA.address);
  console.log(re);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
