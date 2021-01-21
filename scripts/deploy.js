// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const fs = require("fs-extra");
const erc20 = require("@studydefi/money-legos/erc20");

// NEED TO ALSO UPDATE CONTRACT NAMES BELOW
const TEST = true;
var sourceFolder = TEST ? folder = "TestContracts" : folder = "EthInsurance";

const DAI_WHALE = "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE";
const YOUR_ADDRESS = "0xE400820f3D60d77a3EC8018d44366ed0d334f93C";

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // impersonating large Dai holder account
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [DAI_WHALE]}
  )

  const impSigner = await ethers.provider.getSigner(DAI_WHALE);
  console.log("impSigner balance:", (await impSigner.getBalance()).toString());

  // getting access to Dai contract
  const daiABI = erc20.dai.abi;
  const daiAddress = erc20.dai.address;
  const dai = await new ethers.Contract(daiAddress, daiABI, impSigner);

  // send ETH to your address for gas
  await impSigner.sendTransaction({
      from: DAI_WHALE,
      to: YOUR_ADDRESS,
      value: ethers.utils.parseEther("100"),
    })

  // send DAI to your address for staking
  // using parseEther because Dai also has 18 decimals
  await dai.transfer(YOUR_ADDRESS, ethers.utils.parseEther("10000"), { from: DAI_WHALE })

  // stop impersonating Dai whale
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [DAI_WHALE]}
  )

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // argument for Greeting contracts
  const greeting = "Hello world;"

  // adding USDC address for second Insurance field (need to fix later)
  const usdcAddress = erc20.usdc.address;

  // need to enter manually for now
  var realContracts = {
    "Insurance": [daiAddress, usdcAddress],
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
