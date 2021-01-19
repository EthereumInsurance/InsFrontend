// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
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
  daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  uniAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

  // need to enter manually for now
  var contracts = {
    "Token": [],
    "Insurance": [daiAddress, uniAddress],
    "Stake": []
  };

  console.log(`contracts object is ${contracts}`);

  for (const name of Object.keys(contracts)) {

    const args = contracts[name];
    const Contract = await ethers.getContractFactory(name);
    const deployedContract = await Contract.deploy(...args);
    await deployedContract.deployed();

    console.log(`${name} address:`, deployedContract.address);
    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles(name, deployedContract);
  };

}

function saveFrontendFiles(name, contract) {
  const fs = require("fs");
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
