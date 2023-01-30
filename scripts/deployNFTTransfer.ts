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
import { EIP4337Lib, UserOperation, WalletLib } from "soul-wallet-lib";
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
    EOA = await ethers.getSigner("0x0FCf4D3EA80FA5281A2Ee4105b543F70a4D1Ce35");
    create2Factory = "0x4A64208814b14E5CA2475349ebC38B40CE2e1373";
    WETHContractAddress = "0x8337A008949C0e6F3D8ac5cE6956d4d17fcfCeC5";
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

  const walletOwner = "0x0FCf4D3EA80FA5281A2Ee4105b543F70a4D1Ce35";
  const walletOwnerPrivateKey =
    "0x3a77989543d0f0a85e2cc6a62dc3c9c703f15daf69c94de27edf7ea7f18a4e01";

  const salt = hexZeroPad(hexlify(0), 32);

  console.log("Create2Factory: " + create2Factory);
  console.log("WETH Contract Address: " + WETHContractAddress);
  console.log(" ");

  console.log("Address of Contracts:");
  console.log(" ");

  // #region Entrypoint

  const EntryPointAddress = "0x511df957f5C68150CF20b0A18F5e08a883d4D485";

  // #region WETHPaymaster

  const WETHTokenPaymasterAddress =
    "0x363Cbe12A67d9df39Cf743e4371E29339F369759";
  console.log("WETHTokenPaymasterAddress:", WETHTokenPaymasterAddress);

  // #region WalletLogic

  
  const WalletLogicAddress = "0xF5BdfDEa42db308481540A70F15F2a38B723358E"
  console.log("Wallet Logic Address: " + WalletLogicAddress);

  // #region GuardianLogic

  const GuardianLogicAddress = "0xda8F177C172e39E118bDeef5986226883dD303cc"
  console.log("GuardianLogicAddress:", GuardianLogicAddress);

  // #region deploy wallet

  const upgradeDelay = 10;
  const guardianDelay = 10;

  // #set Wallet Address a mano ahora
  const walletAddress = "0x6f905f4ca5b3527d45ca87aad98b509093230183";

  console.log("walletAddress: " + walletAddress);

  console.log("---------------------");

  console.log("Balances Of WETH:");
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

  // console.log("sending 0.05 WETH from EOA to Smart Wallet");
  //  await WETHContract.transferFrom(EOA.address, walletAddress, 1);
  // console.log("ENVIÓ LOS NFT");

  // #region send 1wei Weth to wallet
  const nonce = await EIP4337Lib.Utils.getNonce(walletAddress, ethers.provider);
  let eip1559GasFee: any;
  eip1559GasFee = mockGasFee;

  // // ESTA FUNCION ENVIA A EOA tokens TIN/WETH
  // const approveNFTOp = await EIP4337Lib.Tokens.ERC721.approve(
  //   ethers.provider,
  //   walletAddress,
  //   nonce,
  //   EntryPointAddress,
  //   WETHTokenPaymasterAddress,
  //   ethers.utils
  //     .parseUnits(eip1559GasFee.medium.suggestedMaxFeePerGas, "gwei")
  //     .toString(),
  //   ethers.utils
  //     .parseUnits(eip1559GasFee.medium.suggestedMaxPriorityFeePerGas, "gwei")
  //     .toString(),
  //   WETHContractAddress,
  //   EOA.address,
  //   "1"
  // );

    // ESTA FUNCION ENVIA A EOA tokens TIN/WETH
    const transferNFTOp = await EIP4337Lib.Tokens.ERC721.transferFrom(
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
      walletAddress,
      EOA.address,
      "2"
    );

  if (!transferNFTOp) {
    throw new Error("sendWETHOP is null");
  }

  //ACA FIRMA LA OPERACION ANTERIOR CON TU PRIVATE KEY
  const userOpHash = transferNFTOp.getUserOpHash(EntryPointAddress, chainId);
  transferNFTOp.signWithSignature(
    walletOwner,
    Utils.signMessage(userOpHash, walletOwnerPrivateKey)
  );

  // EL ENTRY POINT EJECUTA LA TX SI EL MSJ VA FIRMADO POR MI WALLET
  const EntryPoint = EntryPoint__factory.connect(EntryPointAddress, EOA);
  console.log(transferNFTOp);
  const re = await EntryPoint.handleOps([transferNFTOp], EOA.address);
  console.log(re);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
