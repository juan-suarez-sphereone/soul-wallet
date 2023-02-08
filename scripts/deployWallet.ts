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
  let WalletLogicAddress = "0x091A9CC401cA4f1d91F6bd187ff2408D3E3f04Fb";
  let EntryPointAddress = "0x4bd797204A6eB2F33DB52c898Dd5Fdfc19bbc334";
  let WETHTokenPaymasterAddress = "0x67664a169D154Ead598C67D288c16b1F4f9A1949";

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

  // #region deploy wallet

  const tokenAndPaymaster = [
    {
      token: "0x217c132171845A65A40e612A0A28C915a84214b4",
      paymaster: WETHTokenPaymasterAddress,
    },
  ];

  const packedTokenAndPaymaster =
    EIP4337Lib.Utils.tokenAndPaymaster.pack(tokenAndPaymaster)

  const upgradeDelay = 10;
  const guardianDelay = 10;
  const walletAddress = await EIP4337Lib.calculateWalletAddress(
    WalletLogicAddress,
    EntryPointAddress,
    walletOwner,
    upgradeDelay,
    guardianDelay,
    EIP4337Lib.Defines.AddressZero,
    packedTokenAndPaymaster,
    0,
    create2Factory
  );

  console.log("walletAddress: " + walletAddress);

  // send 0.002 WETH to wallet
  const WETHContract = WETH9__factory.connect(WETHContractAddress, EOA);
  const _b = await WETHContract.balanceOf(walletAddress);

  console.log("sending 0.003 WETH to wallet");
  await WETHContract.transferFrom(
    EOA.address,
    walletAddress,
    ethers.utils.parseEther("0.003")
  );
  console.log("SENT WETH TO WALLET")

  // check if wallet is activated (deployed)
  const code = await ethers.provider.getCode(walletAddress);
  if (code === "0x") {
    console.log("Wallet No Activada. COMIENZA ACTIVACION")
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
        .parseUnits(eip1559GasFee.low.suggestedMaxFeePerGas, "gwei")
        .toString(),
      ethers.utils
        .parseUnits(eip1559GasFee.low.suggestedMaxPriorityFeePerGas, "gwei")
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

  // #endregion deploy wallet
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
