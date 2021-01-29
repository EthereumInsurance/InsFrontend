// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const fs = require("fs-extra");
const erc20 = require("@studydefi/money-legos/erc20");
const { block } = require("./utils.js");
const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");

var sourceFolder = "EthInsurance";

const DAI_WHALE = "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE";
const YOUR_ADDRESS = "0xE400820f3D60d77a3EC8018d44366ed0d334f93C";
const onePercent = ethers.BigNumber.from("10").pow(16);

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  const [defaultAccount] = await ethers.getSigners();
  console.log(`defaultAccount address is ${defaultAccount.address}`)

  // impersonating large Dai holder account
  await impersonateAccount(DAI_WHALE);

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
      value: parseEther("100"),
    })

  // send DAI to your address and default account for staking
  // using parseEther because Dai also has 18 decimals
  const whaleDai = ethers.utils.formatEther((await daiForImp.balanceOf(DAI_WHALE)).toString());
  console.log(`DAI_WHALE balance is ${whaleDai}`);
  // This may fail sometimes, the DAI_WHALE is Binance and may have shortage of Dai
  await daiForImp.transfer(YOUR_ADDRESS, parseEther("1000000"), { from: DAI_WHALE })
  await daiForImp.transfer(defaultAccount.address, parseEther("1000000"), { from: DAI_WHALE })

  // stop impersonating Dai whale
  await stopImpersonatingAccount(DAI_WHALE);


  await updateContractsFolder().then(console.log("InsFrontend contract folder updated"));
  // this manually compiles based on new contracts (creates artifacts and a file in cache)
  await hre.run('compile');

  // impersonating our address
  // NOTE: This is ONLY for approving on the dai contracts
  // We do NOT deploy any other contracts using our address
  await impersonateAccount(YOUR_ADDRESS);
  const youSigner = await ethers.provider.getSigner(YOUR_ADDRESS);
  const youDai = await new ethers.Contract(daiAddress, daiABI, youSigner);

  // Deploy contracts from defaultAccount
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
    youDai.address,
    StakeToken.address,
    strategyManager.address
  );
  await insurance.deployed();
  saveFileOnFrontend("Insurance", insurance);

  // SETUP
  await insurance.setTimeLock(10);
  await strategyManager.setPool(insurance.address);
  // Allows the first argument address an allowance over the dai contract's tokens
  // MaxUint256 is just a really big number
  await youDai.approve(insurance.address, ethers.constants.MaxUint256);
  console.log(`allowance for insurance address from you is ${await youDai.allowance(YOUR_ADDRESS, insurance.address)}`)
  console.log(`insurance address in deploy is ${insurance.address}`)

  // Now that we have approved the Insurance contract to receive our Dai, stop impersonation
  stopImpersonatingAccount(YOUR_ADDRESS);

  // Also need to approve Dai from defaultAccount to insurance contract
  const defaultDai = await new ethers.Contract(daiAddress, daiABI, defaultAccount);
  await defaultDai.approve(insurance.address, ethers.constants.MaxUint256);
  console.log(`allowance for insurance address from defaultAccount is ${await defaultDai.allowance(defaultAccount.address, insurance.address)}`)


  await StakeToken.approve(insurance.address, ethers.constants.MaxUint256);
  // this is method is available due to inheriting Ownable
  // sets owner for contract to the first argument address
  await StakeToken.transferOwnership(insurance.address);
  const timeLock = await insurance.timeLock();
  console.log(`timeLock is ${timeLock}`);

  // We are going to add funds to the pool from defaultAccount's account
  // This will allow us to properly test our example protocol's covered balances
  // and preload funds into pool that aren't from us (for demo purposes)
  console.log(`insuranceaddress before owns ${await defaultDai.balanceOf(insurance.address)}`)

  await stakeFunds(insurance, "50000");
  await insurance.getFunds(await defaultAccount.getAddress());

  console.log(`insuranceaddress after owns ${await defaultDai.balanceOf(insurance.address)}`)

  // create some fake protocols that we will cover
  const protocols = [
    {
      address: "0x561ca898cce9f021c15a441ef41899706e923541cee724530075d1a1144761a0",
      coverAmount: parseEther("10000"),
      premPerBlock: onePercent,
    },
    {
      address: "0x561ca898cce9f021c15a441ef41899706e923541cee724530075d1a1144761b1",
      coverAmount: parseEther("20000"),
      premPerBlock: onePercent,
    },
    {
      address: "0x561ca898cce9f021c15a441ef41899146e923541cee724530075d1a1144761c2",
      coverAmount: parseEther("30000"),
      premPerBlock: onePercent,
    },
  ]

  // add protocols to the pool
  var p;
  for (p of protocols) {
    await addProtocol(insurance, p.address, p.coverAmount, p.premPerBlock);
  }


}

async function stakeFunds(insuranceContract, stakeAmount) {
  await insuranceContract.stakeFunds(parseEther(stakeAmount));
}

async function addProtocol(insuranceContract, protocolAddress, coverAmount, premPerBlock) {
  blockNumber = await block(
    insuranceContract.updateProfiles(
      protocolAddress,
      coverAmount,
      premPerBlock,
      ethers.constants.MaxUint256,
      false
    )
  );

  console.log(`protocol added is ${protocolAddress}`);
  console.log(`covered amount is ${await insurance.coveredFunds(protocolAddress)}`);
  console.log(`premium per block for protocol is ${await insurance.premiumPerBlock(protocolAddress)}`);
}

async function impersonateAccount(account) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account]}
  )
}

async function stopImpersonatingAccount(account) {
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [account]}
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
