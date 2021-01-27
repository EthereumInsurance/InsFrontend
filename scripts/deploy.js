// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const fs = require("fs-extra");
const erc20 = require("@studydefi/money-legos/erc20");

var sourceFolder = "EthInsurance";

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
  const daiForImp = await new ethers.Contract(daiAddress, daiABI, impSigner);

  // send ETH to your address for gas
  await impSigner.sendTransaction({
      from: DAI_WHALE,
      to: YOUR_ADDRESS,
      value: ethers.utils.parseEther("100"),
    })

  // send DAI to your address for staking
  // using parseEther because Dai also has 18 decimals
  await daiForImp.transfer(YOUR_ADDRESS, ethers.utils.parseEther("10000"), { from: DAI_WHALE })

  // stop impersonating Dai whale
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [DAI_WHALE]}
  )

  // impersonating our own account (to prevent having to sign with MetaMask)
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [YOUR_ADDRESS]}
  )

  const youSigner = await ethers.provider.getSigner(YOUR_ADDRESS);

  console.log(
    "Deploying the contracts with the account:",
    await youSigner.getAddress()
  );

  console.log("Account balance:", (await youSigner.getBalance()).toString());

  await updateContractsFolder().then(console.log("InsFrontend contract folder updated"));
  await updateArtifactsFolder().then(console.log("InsFrontend artifacts folder updated"));

  // Deploy contracts
  const dai = await new ethers.Contract(daiAddress, daiABI, youSigner);

  const STAKE = await ethers.getContractFactory("Stake");
  StakeToken = await STAKE.deploy();
  await StakeToken.deployed();
  saveFileOnFrontend("Stake", StakeToken);

  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  strategyManager = await StrategyManager.deploy();
  await strategyManager.deployed();
  saveFileOnFrontend("StrategyManager", strategyManager);

  const Insurance = await ethers.getContractFactory("Insurance");
  insurance = await Insurance.deploy(
    dai.address,
    StakeToken.address,
    strategyManager.address
  );
  await insurance.deployed();
  saveFileOnFrontend("Insurance", insurance);

  // SETUP
  await insurance.setTimeLock(10);
  // Allows the first argument address an allowance over the dai contract's tokens
  // MaxUint256 is just a really big number
  await dai.approve(insurance.address, ethers.constants.MaxUint256);
  console.log(`allowance for insurance address is ${await dai.allowance(YOUR_ADDRESS, insurance.address)}`)
  await StakeToken.approve(insurance.address, ethers.constants.MaxUint256);
  // this is method is available due to inheriting Ownable
  // sets owner for contract to the first argument address
  await StakeToken.transferOwnership(insurance.address);
  const timeLock = await insurance.timeLock();
  console.log(`timeLock is ${timeLock}`)

  // stop impersonating our account
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [YOUR_ADDRESS]}
  )


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
