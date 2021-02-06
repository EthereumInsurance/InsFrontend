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

  const q4 = "Why are audits dead?";
  const a4 = "A major reason many protocols pay for expensive audits is to prevent user funds from being stolen. Over the last few months, it has become increasingly clear that audits are not a perfect solution for preventing hacks. We don’t think there is a perfect solution to preventing hacks. Instead, we think the risk of loss should be shifted from unsuspecting users to investors who are looking for a favorable risk-adjusted return. That’s why we built this protocol. ";

  const q5 = "How are you different from other insurance protocols?";
  const a5 = "We think existing insurance is unpopular for two major reasons: 1) Poor user experience and 2) high prices. 1) Nobody likes buying insurance which is why we don’t make you do it. We cover protocols wholesale so users don’t need to worry about it. 2) Existing protocols outsource pricing by either making users decide which protocols are safe or by relying on old audits. We have a team of expert smart contract security analysts who price our insurance and have “skin in the game” alongside our stakers.";

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
        <Panel header=<b>{q4}</b> key="4" style={{fontSize: 16}}>
          <p>{a4}</p>
        </Panel>
        <Panel header=<b>{q5}</b> key="5" style={{fontSize: 16}}>
          <p>{a5}</p>
        </Panel>
      </Collapse>
      <p style={{textAlign:'center', fontSize: 12, marginTop: 100 }}>
        Created by <a href={jTwit}>Jack</a> and <a href={eTwit}>Evert</a> for the <a href={mMLink}>ETHGlobal MarketMake</a> hackathon.
      </p>
  </>
  );
}
