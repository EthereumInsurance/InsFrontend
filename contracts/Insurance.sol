//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/IPayOut.sol";
import "./interfaces/IStake.sol";

contract Insurance is Ownable {
    using SafeMath for uint256;

    IERC20 public token;
    IStake public stakeToken;

    struct ProtocolProfile {
        // translated to the value of the native erc20 of the pool
        uint256 maxFundsCovered;
        // percentage of funds covered
        uint256 percentagePremiumPerBlock;
    }

    struct StakeWithdraw {
        uint256 blockInitiated;
        uint256 stake;
    }

    mapping(bytes32 => ProtocolProfile) public profiles;
    mapping(bytes32 => uint256) public profileBalances;
    mapping(bytes32 => uint256) public profilePremiumLastPaid;

    mapping(address => StakeWithdraw) public stakesWithdraw;
    // in case of apy on funds. this will be added to total funds
    uint256 public totalStakedFunds;
    // time lock for withdraw period in blocks
    uint256 public timeLock;

    constructor(address _token, address _stakeToken) public {
        token = IERC20(_token);
        stakeToken = IStake(_stakeToken);
    }

    function setTimeLock(uint256 _timeLock) external onlyOwner {
        timeLock = _timeLock;
    }

    // a governing contract will call the update profiles
    // protocols can do a insurance request against this contract
    function updateProfiles(
        bytes32 _protocol,
        uint256 _maxFundsCovered,
        uint256 _percentagePremiumPerBlock,
        uint256 _premiumLastPaid
    ) external onlyOwner {
        require(_protocol != bytes32(0), "INVALID_PROTOCOL");
        require(_maxFundsCovered != 0, "INVALID_FUND");
        require(_percentagePremiumPerBlock != 0, "INVALID_RISK");
        profiles[_protocol] = ProtocolProfile(
            _maxFundsCovered,
            _percentagePremiumPerBlock
        );

        if (_premiumLastPaid == 0) {
            // dont update
            require(profilePremiumLastPaid[_protocol] > 0, "INVALID_LAST_PAID");
            return;
        }
        // TODO if percentagePremiumPerBlock is changing. Call payOffDebt to get the debt for the old percentagePremiumPerBlock
        if (_premiumLastPaid == uint256(-1)) {
            profilePremiumLastPaid[_protocol] = block.number;
        } else {
            profilePremiumLastPaid[_protocol] = _premiumLastPaid;
        }
    }

    function insurancePayout(
        bytes32 _protocol,
        uint256 _amount,
        address _payout
    ) external onlyOwner {
        require(coveredFunds(_protocol) >= _amount, "INSUFFICIENT_COVERAGE");
        require(token.approve(_payout, _amount), "INSUFFICIENT_FUNDS");
        IPayOut payout = IPayOut(_payout);
        payout.insurancePaid(address(token), _amount);
        totalStakedFunds = totalStakedFunds.sub(_amount);
    }

    function stakeFunds(uint256 _amount) external {
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "INSUFFICIENT_FUNDS"
        );
        // TODO, test this calculation with multiple scenarios
        uint256 totalStake = stakeToken.totalSupply();
        uint256 stake;
        if (totalStake == 0) {
            // mint initial stake
            stake = _amount;
        } else {
            // mint stake based on funds in pool
            stake = _amount.mul(totalStake).div(totalStakedFunds);
        }
        totalStakedFunds = totalStakedFunds.add(_amount);
        stakeToken.mint(msg.sender, stake);
    }

    //@ todo, add view stake
    function getFunds(address _staker) external view returns (uint256) {
        return
            stakeToken.balanceOf(_staker).mul(totalStakedFunds).div(
                stakeToken.totalSupply()
            );
    }

    // to withdraw funds, add them to a vesting schedule
    function withdrawStake(uint256 _amount) external {
        require(
            stakesWithdraw[msg.sender].blockInitiated == 0,
            "WITHDRAW_ACTIVE"
        );
        require(
            stakeToken.transferFrom(msg.sender, address(this), _amount),
            "TRANSFER_FAILED"
        );
        // totalStake sub? no right
        stakesWithdraw[msg.sender] = StakeWithdraw(block.number, _amount);
    }

    function cancelWithdraw() external {
        StakeWithdraw memory withdraw = stakesWithdraw[msg.sender];
        require(withdraw.blockInitiated != 0, "WITHDRAW_NOT_ACTIVE");
        require(
            withdraw.blockInitiated.add(timeLock) > block.number,
            "TIMELOCK_EXPIRED"
        );
        // if this one fails, contract is broken
        stakeToken.transfer(msg.sender, withdraw.stake);
        delete stakesWithdraw[msg.sender];
    }

    // to claim the withdrawed funds, if the vesting period is ended

    // everyone can execute a claim for any staker
    // this fights the game design where people call withdraw to skip the timeLock.
    // And only claim when a hack occurs.
    function claimFunds(address _staker) external {
        StakeWithdraw memory withdraw = stakesWithdraw[_staker];
        require(withdraw.blockInitiated != 0, "WITHDRAW_NOT_ACTIVE");
        require(
            withdraw.blockInitiated.add(timeLock) <= block.number,
            "TIMELOCK_ACTIVE"
        );
        uint256 funds = withdraw.stake.mul(totalStakedFunds).div(
            stakeToken.totalSupply()
        );
        // if this one fails, contract is broken
        token.transfer(_staker, funds);
        stakeToken.burn(address(this), withdraw.stake);
        delete stakesWithdraw[msg.sender];
    }

    function addProfileBalance(bytes32 _protocol, uint256 _amount) external {
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "INSUFFICIENT_FUNDS"
        );
        profileBalances[_protocol] = profileBalances[_protocol].add(_amount);
    }

    function payOffDebt(bytes32 _protocol) external {
        uint256 debt = accruedDebt(_protocol);
        // will throw an error if the balance is insufficient
        profileBalances[_protocol] = profileBalances[_protocol].sub(debt);
        // move funds to the staker pool
        totalStakedFunds = totalStakedFunds.add(debt);
        profilePremiumLastPaid[_protocol] = block.number;
    }

    function accruedDebt(bytes32 _protocol) public view returns (uint256) {
        return
            block.number.sub(profilePremiumLastPaid[_protocol]).mul(
                premiumPerBlock(_protocol)
            );
    }

    function premiumPerBlock(bytes32 _protocol) public view returns (uint256) {
        ProtocolProfile memory p = profiles[_protocol];
        return
            coveredFunds(_protocol).mul(p.percentagePremiumPerBlock).div(
                10**18
            );
    }

    function coveredFunds(bytes32 _protocol) public view returns (uint256) {
        ProtocolProfile memory p = profiles[_protocol];
        require(p.maxFundsCovered > 0, "PROFILE_NOT_FOUND");
        if (totalStakedFunds > p.maxFundsCovered) {
            return p.maxFundsCovered;
        }
        return totalStakedFunds;
    }
}
