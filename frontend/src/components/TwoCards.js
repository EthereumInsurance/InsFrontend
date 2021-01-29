import React, { useState } from "react";
import { ethers } from "ethers";
import { Card, Col, Row, InputNumber, Select, Button, Space } from "antd";
import 'antd/dist/antd.css';
import './index.css';
import 'antd/lib/style/themes/default.less';


export function TwoCards({
  stakeFunds,
  userStake,
  earningsOnStake,
  totalPoolFunds,
  userTotalFunds
})
{

  const { Option } = Select;

  const [stakeAmount, setStakeAmount] = useState(0);
  const [stakeToken, setStakeToken] = useState("DAI");
  const [unlockStarted, setUnlockStarted] = useState(false);

  function handleNumberChange(value) {
    setStakeAmount(value);
    console.log(`new amount to stake: ${value}`);
  };

  function handleTokenChange(value) {
    setStakeToken(value);
    console.log(`new Token to stake: ${value}`);
  };

  const handleStake = () => {
    if (stakeAmount > 0) {
      stakeFunds(stakeAmount.toString())
    }
  };

  const startUnlockProcess = () => {
    setUnlockStarted(true);
  };

  const cancelUnlockProcess = () => {
    setUnlockStarted(false);
  };

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <div>
        <Row>
          <Card
            className="card"
            style={{ backgroundColor: '#f8f8ff' }}
            bordered={true}
          >
            <h4 style={{textAlign:'center'}}>Staking Pool</h4>
            <p style={{textAlign:'left', margin:40}}>
              <b>Current APY</b>
              <span style={{float:'right'}}>
                7.46%
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Pool Size</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(totalPoolFunds.toFixed(2))}
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Lockup</b>
              <span style={{float:'right'}}>
                3 days
              </span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 25}}>
              <InputNumber style={{ height: 32 }} min={0} defaultValue={0} onChange={handleNumberChange} />
              <Select defaultValue="DAI" style={{ width: 75}} onChange={handleTokenChange}>
                <Option value="DAI">DAI</Option>
                <Option value="ETH">ETH</Option>
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
            className="card"
            style={{ backgroundColor: '#f8f8ff' }}
            bordered={true}
          >
            <h4 style={{textAlign:'center'}}>Your Funds</h4>
            <p style={{textAlign:'left', margin:40}}>
              <b>Initial Stake</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(userStake.toFixed(2))}
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Current APY</b>
              <span style={{float:'right'}}>
                7.46%
              </span>
            </p>
            <p style={{textAlign:'left', margin:40}}>
              <b>Total Earnings</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(earningsOnStake.toFixed(2))}
              </span>
            </p>
            <h5 style={{textAlign:'left', margin:40}}>
              <b>Total Funds</b>
              <span style={{float:'right'}}>
                ${numberWithCommas(userTotalFunds.toFixed(2))}
              </span>
            </h5>
            <div style={{ display: 'flex', justifyContent: 'center'}}>
              {!unlockStarted&&
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
              {unlockStarted&&
                <>
                  <Space direction="vertical">
                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      72 hours remaining
                    </p>
                    <Button
                      type="danger"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        color: 'black',
                      }}
                      onClick={cancelUnlockProcess}
                    >
                      Cancel Unlock
                    </Button>
                  </Space>
                </>

              }

            </div>
          </Card>
        </Row>
    </div>
  );
}
