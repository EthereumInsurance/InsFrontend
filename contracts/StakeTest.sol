pragma solidity ^0.7.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

contract StakeTest {
  using SafeMath for uint256;

  uint256 public poolFunds = 0;
  uint256 public userInitialStake = 0;
  uint256 public userStakeValue = 0;
  uint256 public poolRate = 5;

  function stakeFunds(uint256 _amount) external {

    userInitialStake = userInitialStake.add(_amount);
    userStakeValue = userStakeValue.add(_amount);
    poolFunds = poolFunds.add(_amount);
  }

}
