import React, { PureComponent } from 'react';
import { ethers } from "ethers";
import {
  PieChart, Pie, Sector, Cell, ResponsiveContainer,
} from 'recharts';
import { Loading } from "./Loading";

const images = {
    Aave: "/AaveLogo.png",
    Compound: "/CompoundLogo.png",
    Maker: "/MakerLogo.png",
    PieDao: "/PieDaoLogo.png",
    'Aave V2': "/AaveLogo.png",
    'Aave Gov': "/AaveLogo.png",
    Yearn: "/YearnLogo.png",
  }

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, name, value, index,
}) => {
  const outsideRadius = innerRadius + (outerRadius - innerRadius) * 1.1;
  const outsideX = cx + outsideRadius * Math.cos(-midAngle * RADIAN);
  // adjust based on text length
  const adjOutsideX = outsideX > cx ? outsideX - 15 : outsideX - 70;
  const outsideY = cy + outsideRadius * Math.sin(-midAngle * RADIAN);
  // adjust based on text length
  const adjOutsideY = outsideY > cy ? outsideY : outsideY - 20;
  const insideRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const insideX = cx + insideRadius * Math.cos(-midAngle * RADIAN);
  const insideY = cy + insideRadius * Math.sin(-midAngle * RADIAN);

  return (
    <>
      <foreignObject x={adjOutsideX} y={adjOutsideY} width={500} height={500}>
        <div display="flex" alignitems="center" flexdirection="row">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <img xmlns="http://www.w3.org/1999/xhtml" src={images[name]} alt="image" />
            {` ${name}`}
          </div>
        </div>
      </foreignObject>

      <text x={insideX} y={insideY} fill="black" textAnchor={insideX > cx ? 'start' : 'end'} dominantBaseline="central">
        {`$${value}M`}
      </text>
    </>
  );
};

export default class Charts extends PureComponent {
  constructor(props) {
    super(props);

    this.protocolData = [
      { name: 'Yearn', value: this.props.protCoveredFunds[1]/1000000 },
      { name: 'Maker', value: this.props.protCoveredFunds[2]/1000000 },
      { name: 'PieDao', value: this.props.protCoveredFunds[0]/1000000 },
    ];

    this.poolData = [
      { name: 'Aave V2', value: parseFloat(((this.props.totalPoolFunds/1000000)*.6).toFixed(0)) },
      { name: 'Compound', value: parseFloat(((this.props.totalPoolFunds/1000000)*.4).toFixed(0)) },
    ];
  }
  render() {

    if (!this.props.totalPoolFunds || !this.props.totalCoveredFunds) {
      return <Loading />;
    }

    return (
    <>
      <h2 style={{ marginLeft: '13%', float: 'left' }}>Covered Protocols</h2>
      <h2 style={{ marginRight: '16%', float: 'right' }}>Pool Strategies</h2>
      <ResponsiveContainer width='99%' aspect={2.2}>
        <PieChart style={{ marginBottom: "50px" }}>
          <Pie
            data={this.protocolData}
            cx="25%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="75%"
            fill="#8884d8"
            dataKey="value"
          >
            {
              this.protocolData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
            }
          </Pie>





          <Pie
            data={this.poolData}
            cx="75%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="75%"
            fill="#8884d8"
            dataKey="value"
          >
            {
              this.poolData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
            }
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginLeft: '13%', float: 'left', whiteSpace: 'nowrap' }}>
        <h5 style={{ display: "inline-block"}}>Total Covered:</h5>
        <span style={{ display: "inline-block", marginLeft: "10%"}}>
          ${(this.props.totalCoveredFunds/1000000).toFixed(0).toString()}M
        </span>
      </div>
      <div style={{ marginRight: '16%', float: 'right', whiteSpace: 'nowrap' }}>
        <h5 style={{ display: "inline-block"}}>Total Locked:</h5>
        <span style={{ display: "inline-block", marginLeft: "10%"}}>
          ${(this.props.totalPoolFunds/1000000).toFixed(0).toString()}M
        </span>
      </div>
    </>
    );
  }
}
