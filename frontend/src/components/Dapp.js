import React from "react";
import { ethers } from "ethers";

import INSURANCE_ARTIFACT from "../ABIs/InsuranceABI.json";
import STRATEGY_MANAGER_ARTIFACT from "../ABIs/StrategyManagerABI.json";
import AAVE_LENDING_POOL_PROVIDER_ABI from "../ABIs/LendingPoolProviderABI.json";
import AAVE_LENDING_POOL_ABI from "../ABIs/LendingPoolABI.json";
import AAVE_DAI_ABI from "../ABIs/AaveDaiABI.json";
import STAKE_TOKEN_ABI from "../ABIs/StakeTokenABI.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { TwoCards } from "./TwoCards";
import { FAQ } from "./FAQ";
import Charts from "./Charts";
import { Menu } from "antd";

// This is the Hardhat Network id, you might change it in the hardhat.config.js
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = 42;

const { parseEther, formatEther } = require("ethers/lib/utils");
const { constants } = require("ethers");
const blocksPerYear = 2103795;

const INSURANCE_ADDRESS = "0x6E36a59b4b4dBD1d47ca2A6D22A1A45d26765601";
const STRATEGY_MANAGER_ADDRESS = "0x93540d68b2447F924E51caE24c3EAa3AB5516e32";
const AAVE_LENDING_POOL_ADDRESS = "0x580D4Fdc4BF8f9b5ae2fb9225D584fED4AD5375c";
const AAVE_LENDING_POOL_PROVIDER_ADDRESS = "0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5";
const AAVE_DAI_ADDRESS = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
const STAKE_TOKEN_ADDRESS = "0x2610C11aB6f7DCa1d8915f328c6995E0c16f5d94";

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      // The user's address and balance
      selectedAddress: undefined,
      timeLock: undefined,
      userStake: undefined,
      totalStakedFunds: undefined,
      earningsPerMonth: undefined,
      protCoveredFunds: undefined,
      totalCoveredFunds: undefined,
      protAnnualPaymentArray: undefined,
      aaveDaiRate: undefined,
      totalAPY: undefined,
      daiAaveStrategyFunds: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      insuranceData: undefined,
      menuTab: "1",
      timeLeftForUnlock: undefined,
      fundsForUnlock: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // console.log(`timeLock is ${this.state.timeLock}`)
    // console.log(`protCoveredFunds is ${this.state.protCoveredFunds}`)
    // console.log(`totalAPY is ${this.state.totalAPY}`)

    // If the user's data hasn't loaded yet, we show a loading component.
    if (!this.state.timeLock || !this.state.protCoveredFunds || !this.state.totalAPY) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1 style={{ marginBottom: 5 }} >
              Audits R Dead {'\u2620'}
            </h1>
            <h4 style={{ marginBottom: 25 }} >
              Insurance for DeFi
            </h4>
          </div>
        </div>
        <Menu
          style={{textAlign:"center", marginBottom: '25px'}}
          onClick={this._setMenuTab}
          selectedKeys={this.state.menuTab}
          mode="horizontal">
          <Menu.Item key="1" >
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" >
            Allocations
          </Menu.Item>
        </Menu>

        {this.state.txBeingSent && (
          <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
        )}

        {this.state.transactionError && (
          <TransactionErrorMessage
            message={this._getRpcErrorMessage(this.state.transactionError)}
            dismiss={() => this._dismissTransactionError()}
          />
        )}

        {this.state.menuTab === "1" && (
          <>
            <TwoCards
              stakeFunds={(amount) =>
                this._stakeFunds(amount)
              }
              withdrawStake={() =>
                this._withdrawStake()
              }
              cancelWithdraw={() =>
                this._cancelWithdraw()
              }
              claimFunds={() =>
                this._claimFunds()
              }
              userStake={this.state.userStake}
              earningsPerMonth={this.state.earningsPerMonth}
              totalStakedFunds={this.state.totalStakedFunds}
              totalAPY={this.state.totalAPY}
              timeLock = {this.state.timeLock}
              timeLeftForUnlock = {this.state.timeLeftForUnlock}
              fundsForUnlock = {this.state.fundsForUnlock}
            />
          </>
        )}

        {this.state.menuTab === "2" && (
          <>
            <Charts
              totalStakedFunds={this.state.totalStakedFunds}
              protCoveredFunds={this.state.protCoveredFunds}
              totalCoveredFunds={this.state.totalCoveredFunds}
              daiAaveStrategyFunds={this.state.daiAaveStrategyFunds}
            />
          </>
        )}
        {this.state.menuTab === "1" && (
          <>
            <FAQ/>
          </>
        )}


        </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's userStake, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.enable();

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state
      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", ([networkId]) => {
      console.log(`networkChanged runs`)
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's userStake.

    // Fetching the token data and the user's userStake are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._startPollingData();
    this._getUnlockData();
    this._getProtocolInfo();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // When, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._insurance = new ethers.Contract(
      INSURANCE_ADDRESS,
      INSURANCE_ARTIFACT.abi,
      this._provider.getSigner(0)
    );

    this._strategyManager = new ethers.Contract(
      STRATEGY_MANAGER_ADDRESS,
      STRATEGY_MANAGER_ARTIFACT.abi,
      this._provider.getSigner(0)
    );

    this._aaveLendingPoolProvider = new ethers.Contract(
      AAVE_LENDING_POOL_PROVIDER_ADDRESS,
      AAVE_LENDING_POOL_PROVIDER_ABI,
      this._provider.getSigner(0)
    );

    this._aaveLendingPool = new ethers.Contract(
      AAVE_LENDING_POOL_ADDRESS,
      AAVE_LENDING_POOL_ABI,
      this._provider.getSigner(0)
    );

    this._aaveDai = new ethers.Contract(
      AAVE_DAI_ADDRESS,
      AAVE_DAI_ABI,
      this._provider.getSigner(0)
    );

    this._stakeToken = new ethers.Contract(
      STAKE_TOKEN_ADDRESS,
      STAKE_TOKEN_ABI,
      this._provider.getSigner(0)
    );
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getUnlockData() {
    const rawTimeLock = await this._insurance.timeLock();
    // translating from blocks to days
    const timeLock = Math.round(rawTimeLock / 24 / 60 / 4)

    var timeLeftForUnlock = undefined;
    var fundsForUnlock = undefined;
    const stakesWithdraw = await this._insurance.stakesWithdraw(this.state.selectedAddress);
    console.log(`stakesWithdraw is ${stakesWithdraw}`)
    if ( stakesWithdraw ) {
      // handle unlock stuff
      const withdrawStartBlock = stakesWithdraw[0];
      const currentBlock = await this._provider.getBlockNumber();
      if ((withdrawStartBlock + rawTimeLock) <= currentBlock) {
        timeLeftForUnlock = 0;
        fundsForUnlock = await this._insurance.stakesWithdraw(this.state.selectedAddress).stake;
      } else {
        console.log(`we get into the else part`)
        console.log(`currentBlock is ${currentBlock}`)
        console.log(`withdrawStartBlock is ${withdrawStartBlock}`)
        console.log(`rawTimeLock is ${rawTimeLock}`)
        timeLeftForUnlock = Math.round((((withdrawStartBlock*1) + (rawTimeLock*1)) - (currentBlock*1)) / 60 / 4);
      }
    }
    console.log(`timeLeftForUnlock is ${timeLeftForUnlock}`)
    this.setState({ timeLock, timeLeftForUnlock, fundsForUnlock });
  }

  async _getProtocolInfo() {

    // getting APY for Dai Aave staking
    const rawDaiAaveData = await this._aaveLendingPool.getReserveData(AAVE_DAI_ADDRESS);
    const aaveDaiRate = this._fromRaytoPercent(rawDaiAaveData.liquidityRate);


    // need a proper getter in Insurance contract for protocols
    // protocol info shouldn't change after initiation so putting it in _getProtocolInfo
    const numOfProtocols = await this._insurance.amountOfProtocolsCovered();
    // const numOfProtocols = 3;
    var protAddresses = [];
    var protCoveredFunds = [];
    var protAnnualPaymentArray = [];
    // looping through each protocol and populating data for frontend
    for (var i = 0; i < numOfProtocols; i++) {
      const singleProtAddress = (await this._insurance.protocols(i));
      protAddresses.push(singleProtAddress);
      const singleProtCoveredFunds = parseFloat(formatEther(await this._insurance.coveredFunds(singleProtAddress)));
      protCoveredFunds.push(singleProtCoveredFunds);
      const singleProtPremPerBlock = await this._insurance.premiumPerBlock(singleProtAddress);
      const singleProtAnnualPayment = this._weiToNormal(singleProtPremPerBlock*blocksPerYear);
      protAnnualPaymentArray.push(singleProtAnnualPayment);
    }
    const totalCoveredFunds = protCoveredFunds.reduce((a,b)=>a+b);

    console.log(`protAddresses are ${protAddresses}` )
    console.log(`protCoveredFunds are ${protCoveredFunds}` )
    console.log(`protAnnualPaymentArray is ${protAnnualPaymentArray}` )
    console.log(`totalCoveredFunds is ${totalCoveredFunds}` )

    this.setState({ protCoveredFunds, totalCoveredFunds, protAnnualPaymentArray, aaveDaiRate })
  }

  async _updateBalance() {
    const totalStakedFunds = parseFloat(formatEther(await this._insurance.getTotalStakedFunds()));
    const totalStakeTokenSupply = parseFloat(formatEther(await this._stakeToken.totalSupply()));
    const getFundsUserStake = parseFloat(formatEther(await this._insurance.getFunds(this.state.selectedAddress)));
    const rawStakesWithdrawUserStake = parseFloat(formatEther((await this._insurance.stakesWithdraw(this.state.selectedAddress))[1]));
    const stakesWithdrawUserStake = rawStakesWithdrawUserStake * totalStakedFunds / totalStakeTokenSupply;
    const userStake = getFundsUserStake + stakesWithdrawUserStake;


    // getting amount of funds in Dai Aave strategy
    const daiAaveStrategyFunds = this._weiToNormal(await this._strategyManager.balanceOf(AAVE_DAI_ADDRESS));

    // Calculating APY
    var totalAPY;
    if (this.state.protAnnualPaymentArray && this.state.aaveDaiRate) {
      const totalProtAnnualPayment = this.state.protAnnualPaymentArray.reduce((a,b)=>a+b);
      const protAPY = totalProtAnnualPayment / totalStakedFunds;
      const aaveDaiAPY = this.state.aaveDaiRate;
      totalAPY = protAPY + aaveDaiAPY;
    }
    // console.log(`totalAPY is ${totalAPY}`)

    // Calculating earningsPerMonth
    const earningsPerMonth = userStake * totalAPY / 12
    // console.log(`userStake is ${userStake}`)
    // console.log(`earningsPerMonth is ${earningsPerMonth}`)

    this.setState({ userStake, totalStakedFunds, totalAPY, daiAaveStrategyFunds, earningsPerMonth });
  }

  async _stakeFunds(amount) {

    try {
      // clear old errors
      this._dismissTransactionError();

      console.log(`presigning in _stakeFunds`)

      await this._aaveDai.approve(INSURANCE_ADDRESS, constants.MaxUint256);

      console.log(`postSigning in _stakeFunds`)

      const tx = await this._insurance.stakeFunds(parseEther(amount));
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateBalance();

    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  async _withdrawStake() {
    try {
      // clear old errors
      this._dismissTransactionError();

      await this._stakeToken.approve(INSURANCE_ADDRESS, constants.MaxUint256);
      const amount = await this._stakeToken.balanceOf(this.state.selectedAddress);

      const tx = await this._insurance.withdrawStake(amount);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._getUnlockData();
      await this._updateBalance();

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _cancelWithdraw() {
    try {
      // clear old errors
      this._dismissTransactionError();

      const tx = await this._insurance.cancelWithdraw();
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._getUnlockData();
      await this._updateBalance();

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _claimFunds() {
    try {
      // clear old errors
      this._dismissTransactionError();

      const tx = await this._insurance.claimFunds(this.state.selectedAddress);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._getUnlockData();
      await this._updateBalance();

    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545
  _checkNetwork() {

    if (parseInt(window.ethereum.chainId) === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({
      networkError: `Please switch your wallet to the Kovan network`
    });

    return false;
  }

  _setMenuTab = (event) => {
    console.log(`set to ${event.key}`)
    this.setState({ menuTab: event.key });

  }

  _fromRaytoPercent(num) {
    return num / (Math.pow(10, 27))
  }

  _weiToNormal(num) {
    return num / (Math.pow(10, 18))
  }

}
