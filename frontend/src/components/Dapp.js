// TODO: update React to useState, etc.
import React from "react";
import { ethers } from "ethers";

import InsuranceArtifact from "../contracts/Insurance.json";
import insuranceAddress from "../contracts/Insurance-address.json";
import StakeArtifact from "../contracts/Stake.json";
import stakeAddress from "../contracts/Stake-address.json";
import StrategyManagerArtifact from "../contracts/StrategyManager.json";
import strategyManagerAddress from "../contracts/StrategyManager-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { TwoCards } from "./TwoCards";
import Charts from "./Charts";

import { Radio, Divider, Space, Menu } from "antd";

// This is the Hardhat Network id, you might change it in the hardhat.config.js
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = '1337';

const { parseEther, formatEther } = require("ethers/lib/utils");
const erc20 = require("@studydefi/money-legos/erc20");

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's a useful example.
    this.initialState = {
      // The user's address and balance
      selectedAddress: undefined,
      userStake: undefined,
      totalStakedFunds: undefined,
      earningsOnStake: 0.0,
      totalPoolFunds: undefined,
      userTotalFunds: 0.0,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      insuranceData: undefined,
      menuTab: "1",
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

    // If the token data or the user's userStake hasn't loaded yet, we show
    // a loading component.
    // console.log(`totalStakedFunds is ${this.state.totalStakedFunds}`);
    // console.log(`userStake is ${this.state.userStake}`);
    // console.log(`insuranceData is ${JSON.stringify(this.state.insuranceData)}`);


    if (!this.state.insuranceData || !this.state.totalStakedFunds) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1 style={{ marginBottom: 25 }} >
              Ethereum Insurance
            </h1>
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
        {this.state.menuTab == "1" &&
          <>
            <TwoCards
              stakeFunds={(amount) =>
                this._stakeFunds(amount)
              }
              userStake={this.state.userStake}
              earningsOnStake={this.state.earningsOnStake}
              totalPoolFunds={this.state.totalPoolFunds}
              userTotalFunds={this.state.userTotalFunds}
            />
          </>
        }
        {this.state.menuTab == "2" &&
          <>
            <Charts
              totalPoolFunds={this.state.totalPoolFunds}
            />
          </>
        }

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
    this._intializeEthers();
    this._startPollingData();
    this._getInsuranceData()
  }

  async _intializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // When, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._insurance = new ethers.Contract(
      insuranceAddress.Insurance,
      InsuranceArtifact.abi,
      this._provider.getSigner(0)
    );

    // const defaultAccount = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    // const daiABI = erc20.dai.abi;
    // const daiAddress = erc20.dai.address;
    // this.daiContract = await new ethers.Contract(daiAddress, daiABI, this._provider.getSigner(0));
    // console.log(`insurance address is ${this._insurance.address}`)
    // console.log(`this.state.selectedAddress is ${this.state.selectedAddress}`)
    // console.log(`allowance for insurance address is ${await this.daiContract.allowance(defaultAccount, this._insurance.address)}`)
    // this.daiContract = await new ethers.Contract(daiAddress, daiABI, this._provider.getSigner(0));
    // await this.daiContract.approve(this._insurance.address, ethers.constants.MaxUint256);
    // console.log(`allowance for insurance address is ${await this.daiContract.allowance(this.state.selectedAddress, this._insurance.address)}`)
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
  async _getInsuranceData() {
    const timeLock = await this._insurance.timeLock();
    console.log(`timeLock is ${timeLock}`)

    this.setState({ insuranceData: { timeLock } });
  }

  async _updateBalance() {
    const userStake = parseFloat(formatEther(await this._insurance.getFunds(this.state.selectedAddress)));
    console.log(`userStake is ${userStake}`)
    const totalStakedFunds = parseFloat(formatEther(await this._insurance.getTotalStakedFunds()));

    // calc'ing yield per second without using backend (need to fix)
    const hardcodeAPY = .0746
    const yieldPerSecond = hardcodeAPY / 365 / 24 / 60 / 60;

    // calc'ing user earningsOnStake without using backend (need to fix)
    const localEarnings = this.state.earningsOnStake ? this.state.earningsOnStake : 0.0;
    const principalForEarnings = (userStake - this.state.userStake + localEarnings) + this.state.userStake;
    const tempEarningsOnStake = (principalForEarnings*yieldPerSecond) + localEarnings
    const earningsOnStake = tempEarningsOnStake ? tempEarningsOnStake : 0.0;

    // calc'ing userTotalFunds without using backend (need to fix)
    const userTotalFunds = earningsOnStake + userStake;

    // calc'ing total poolBalance without using backend (need to fix)
    const totalPoolFunds = this.state.totalPoolFunds ?
      ((this.state.totalPoolFunds + (totalStakedFunds - this.state.totalStakedFunds)) * (1 + yieldPerSecond))
       :
      (totalStakedFunds * (1 + yieldPerSecond))


    this.setState({ userStake, totalStakedFunds, earningsOnStake, totalPoolFunds, userTotalFunds });
  }

  async _stakeFunds(amount) {

    try {
      // clear old errors
      this._dismissTransactionError();

      const tx = await this._insurance.stakeFunds(parseEther(amount));
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

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

    if (window.ethereum.chainId === HARDHAT_NETWORK_ID || 1) {
      return true;
    }

    this.setState({
      networkError: `${window.ethereum.networkVersion} NetworkVersion Error!!!`
    });

    return false;
  }

  _setMenuTab = (event) => {
    console.log(`set to ${event.key}`)
    this.setState({ menuTab: event.key });

  }
}
