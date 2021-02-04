require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
require("./tasks/faucet");
require("./tasks/reset");
require('dotenv').config();

const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
const KOVAN_PRIVATE_KEY = process.env.KOVAN_PRIVATE_KEY;
const ETHERSCAN_API = process.env.ETHERSCAN_API;

console.log("Hardhat Config File gets run !!!")

// Using block pinning (block from 1/20/2021)

module.exports = {
  networks: {
    kovan: {
      url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [`0x${KOVAN_PRIVATE_KEY}`]
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
        blockNumber: 11695191,
      },
    },
  },
  solidity: "0.7.6",
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API,
  },
};

// For local hardhat blockchain:
// module.exports = {
//   networks: {
//     hardhat: {
//       chainId: 1337,
//     },
//   },
//   solidity: "0.7.6"
// };
