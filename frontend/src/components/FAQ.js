import React from "react";
import 'antd/dist/antd.css';
import { Collapse } from 'antd';

const { Panel } = Collapse;

export function FAQ() {

  const q1 = "How does it work?"
  const a1 = "Audits R Dead is an insurance platform designed to provide protocols with affordable, high-quality coverage against smart contract hacks. Anyone can stake in our insurance pool and we aim to offer the highest risk-adjusted return in DeFi. This is made possible by our expert security team, who reviews and prices insurance for every protocol we cover and has “skin-in-the-game” alongside our stakers. "

  const q2 = "How can I get insurance as a protocol?";
  const a2 = "We are currently in a closed beta with a select number of protocols. Please email us at email@email.com to join the waitlist.";

  const q3 = "How does staking work?";
  const a3 = "Stakers put their funds in our pool and receive a yield based on protocol insurance fees. These funds cover the risk of smart contract hacks among our partner protocols and can be slashed in the event of a hack. There is currently a 3 day “unlocking” period to withdraw funds from the pool. ";

  const jTwit = "https://twitter.com/jack__sanford";
  const eTwit = "https://twitter.com/Evert0x";
  const mMLink = "https://marketmake.ethglobal.co/";

  return (
    <>
      <h1 style={{textAlign:'center', marginTop: 30 }}><b>FAQ</b></h1>
      <Collapse defaultActiveKey={['1']} ghost>
        <Panel header=<b>{q1}</b> key="1" style={{fontSize: 16}}>
          <p>{a1}</p>
        </Panel>
        <Panel header=<b>{q2}</b> key="2" style={{fontSize: 16}}>
          <p>{a2}</p>
        </Panel>
        <Panel header=<b>{q3}</b> key="3" style={{fontSize: 16}}>
          <p>{a3}</p>
        </Panel>
      </Collapse>
      <p style={{textAlign:'center', fontSize: 12, marginTop: 100 }}>
        Created by <a href={jTwit}>Jack</a> and <a href={eTwit}>Evert</a> for the <a href={mMLink}>ETHGlobal MarketMake</a> hackathon.
      </p>
  </>
  );
}
