/*
 * @Description:
 * @Version: 1.0
 * @Autor: daivd.ding
 * @Date: 2022-10-21 11:06:42
 * @LastEditors: cejay
 * @LastEditTime: 2022-12-27 09:53:10
 */
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();
const MUMBAI_PRIVATE_KEY = process.env.MUMBAI_PRIVATE_KEY; // test private key
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    overrides: {
      "contracts/SoulWalletProxy.sol": {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    dontOverrideCompile: false, // defaults to false
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        initialIndex: 0,
        accountsBalance: "10000000000000000000000000", // 10,000,000 ETH
      },
    },
    localhost: {
      allowUnlimitedContractSize: true,
    },
    mumbai: {
      url: process.env.MATIC_MUMBAI_PROVIDER || "",
      accounts: [MUMBAI_PRIVATE_KEY],
      gasPrice: "auto",
      timeout: 1000000,
    },
    mainnet: {
      url: process.env.ETH_MAINNET_PROVIDER || "",
      accounts: [MAINNET_PRIVATE_KEY],
      gasPrice: "auto",
      timeout: 1000000,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: "88IYFKQV8S4AJCQ3AFKG21E9UP8XMVJS8N",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
