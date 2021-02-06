import React, { useState } from "react";
import { Card, Row, InputNumber, Select, Button, Space } from "antd";
import 'antd/dist/antd.css';
import './index.css';
import 'antd/lib/style/themes/default.less';


export function TwoCards({
  approveStakeFunds,
  stakeFunds,
  approveWithdrawStake,
  withdrawStake,
  cancelWithdraw,
  claimFunds,
  userStake,
  earningsPerMonth,
  totalStakedFunds,
  totalAPY,
  timeLock,
  timeLeftForUnlock,
  fundsForUnlock
})
{
  // console.log(`timeLeftForUnlock in TwoCards is ${timeLeftForUnlock}`)

  const { Option } = Select;
  const initialUnlockState = () => {
    if (timeLeftForUnlock > 0) {
      // 1 means it is during the waiting period
      return "1"
      // needs to be less than zero, otherwise will get called when it shouldn't
    } else if (timeLeftForUnlock < 0) {
      // 2 means funds are available to be withdrawn
      return "2"
    } else {
      // 0 means withdraw period has not begun
      return "0"
    }
  }

  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeToken, setStakeToken] = useState("DAI");
  const [unlockState, setUnlockState] = useState(initialUnlockState);

  function handleNumberChange(value) {
    setStakeAmount(value);
    console.log(`new amount to stake: ${value}`);
  };

  function handleTokenChange(value) {
    setStakeToken(value);
    console.log(`new Token to stake: ${value}`);
  };

  const handleStake = async () => {
    if (stakeAmount > 0) {
      const approvalStatus = await approveStakeFunds();
      if (approvalStatus === "success") {
        await stakeFunds(stakeAmount.toString());
      }
    }
  };

  const startUnlockProcess = async () => {
    const approvalStatus = await approveWithdrawStake();
    if (approvalStatus === "success") {
      const withdrawStatus = await withdrawStake();
      if (withdrawStatus === "success") {
        setUnlockState("1")
      } else {
        setUnlockState("0")
      }
    } else {
      setUnlockState("0")
    }
  };

  const cancelUnlockProcess = async () => {
    const cancelStatus = await cancelWithdraw();
    if (cancelStatus === "success") {
      setUnlockState("0");
    }
  };

  const claimFundsProcess = async () => {
    const claimFundsStatus = await claimFunds();
    if (claimFundsStatus === "success") {
      setUnlockState("0");
    }
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div>
        <Row>
          <Card
            className="leftCard"
            style={{ backgroundColor: '#f8f8ff' }}
            bordered={true}
          >
            <h4 style={{textAlign:'center'}}>Staking Pool</h4>
            <p style={{textAlign:'left', margin:40}}>
              <b>Current APY</b>
              <span style={{float:'right'}}>
                {(totalAPY*100).toFixed(2)}%
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Pool Size</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(totalStakedFunds.toFixed(2))}
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Lockup</b>
              <span style={{float:'right'}}>
                {timeLock} days
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 25}}>
              <InputNumber style={{ height: 32 }} min={0} defaultValue={0} onChange={handleNumberChange} />
              <Select defaultValue={stakeToken} style={{ width: 75}} onChange={handleTokenChange}>
                <Option value="DAI">DAI</Option>
              </Select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
              <Button
                type="primary"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  backgroundColor: '#99CCFF',
                  borderColor: '#99CCFF',
                  color: 'black'
                }}
                onClick={handleStake}
              >
                Stake
              </Button>
            </div>
          </Card>




          <Card
            className="rightCard"
            style={{ backgroundColor: '#f8f8ff' }}
            bordered={true}
          >
            <h4 style={{textAlign:'center'}}>Your Funds</h4>
            <p style={{textAlign:'left', margin:40}}>
              <b>Earnings Per Month</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(earningsPerMonth.toFixed(2))}
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Current APY</b>
              <span style={{float:'right'}}>
                {(totalAPY*100).toFixed(2)}%
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Funds Available to Claim</b>
              <span style={{float:'right'}}>
                $0.00
              </span>
            </p>
            <h5 style={{textAlign:'left', margin:40}}>
              <b>Total Funds</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(userStake.toFixed(2))}
              </span>
            </h5>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
              { unlockState==="0" &&
                <Button
                  type="primary"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: '#99CCFF',
                    borderColor: '#99CCFF',
                    color: 'black'
                  }}
                  onClick={startUnlockProcess}
                >
                  Start Unlock
                </Button>
              }
              { unlockState==="1" &&
                <>
                  <Space direction="vertical">
                    <p style={{ display: 'flex', justifyContent: 'center', }}>
                      {timeLeftForUnlock ? `${timeLeftForUnlock} hours` : "Calculating time"} remaining
                    </p>
                    <Button
                      type="danger"
                      style={{ display: 'flex', justifyContent: 'center', color: 'black',}}
                      onClick={cancelUnlockProcess}
                    >
                      Cancel Unlock
                    </Button>
                  </Space>
                </>
              }
              { unlockState==="2" &&
                <Button
                  type="primary"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: '#99CCFF',
                    borderColor: '#99CCFF',
                    color: 'black'
                  }}
                  onClick={claimFundsProcess}
                >
                  Claim Funds
                </Button>
              }

            </div>
          </Card>
        </Row>
    </div>
  );
}
