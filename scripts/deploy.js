// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const fs = require("fs-extra");

// NEED TO ALSO UPDATE CONTRACT NAMES BELOW
const TEST = true;
var sourceFolder = TEST ? folder = "TestContracts" : folder = "EthInsurance";

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // these are the two arguments that Insurance contract takes
  const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const uniAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

  // argument for Greeting contracts
  const greeting = "Hello world;"

  // need to enter manually for now
  var realContracts = {
    "Insurance": [daiAddress, uniAddress],
    "Stake": [],
  };

  var testContracts = {
    "Token": [],
    "Greeter": [greeting],
    "StakeTest": [],
  }

  var contracts = TEST ? testContracts : realContracts;

  console.log(`contracts object is ${contracts}`);

  await updateContractsFolder().then(console.log("InsFrontend contract folder updated"));
  await updateArtifactsFolder().then(console.log("InsFrontend artifacts folder updated"));

  for (const name of Object.keys(contracts)) {

    const args = contracts[name];
    const Contract = await ethers.getContractFactory(name);
    const deployedContract = await Contract.deploy(...args);
    await deployedContract.deployed();

    console.log(`${name} address:`, deployedContract.address);
    // We also save the contract's artifacts and address in the frontend directory
    saveFileOnFrontend(name, deployedContract);
  };

}

function saveFileOnFrontend(name, contract) {
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

// The 2 adds 2 spaces
  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ [name]: contract.address }, undefined, 2)
  );

  const ContractArtifact = artifacts.readArtifactSync(`${name}`);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(ContractArtifact, null, 2)
  );
}

async function updateContractsFolder() {

  const contractSource = __dirname + `/../../${sourceFolder}/contracts`;
  const contractDestination = __dirname + "/../contracts";

  if (!fs.existsSync(contractDestination)) {
    fs.mkdirSync(contractDestination);
  }

  await fs.copy(contractSource, contractDestination).then(console.log("contract files copied"));

}

async function updateArtifactsFolder() {

  const artifactSource = __dirname + `/../../${sourceFolder}/artifacts`;
  const artifactDestination = __dirname + "/../artifacts";

  if (!fs.existsSync(artifactDestination)) {
    fs.mkdirSync(artifactDestination);
  }

  await fs.copy(artifactSource, artifactDestination).then(console.log("artifact files copied"));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
