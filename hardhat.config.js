require("@nomiclabs/hardhat-waffle");

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
require("./tasks/faucet");

// Using block pinning (block from 1/20/2021)

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/-76KsrX6ucXk1TeDaLniCbdJIlPbL5q5",
        blockNumber: 11695056,
      },
    },
  },
  solidity: "0.7.6"
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
