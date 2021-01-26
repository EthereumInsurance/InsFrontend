import React, { PureComponent } from 'react';
import {
  PieChart, Pie, Sector, Cell, ResponsiveContainer,
} from 'recharts';

const protocolData = [
  { name: 'Aave', value: 513.8 },
  { name: 'Compound', value: 327.7 },
  { name: 'Maker', value: 289.1 },
  { name: 'PieDao', value: 11.3 },
];

const poolData = [
  { name: 'Aave V2', value: 435.1 },
  { name: 'Aave Gov', value: 273.3 },
];

const images = {
    Aave: "/AaveLogo.png",
    Compound: "/CompoundLogo.png",
    Maker: "/MakerLogo.png",
    PieDao: "/PieDaoLogo.png",
    'Aave V2': "/AaveLogo.png",
    'Aave Gov': "/AaveLogo.png"
  }

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, name, value, index,
}) => {
  const outsideRadius = innerRadius + (outerRadius - innerRadius) * 1.1;
  const outsideX = cx + outsideRadius * Math.cos(-midAngle * RADIAN);
  // adjust based on text length
  const adjOutsideX = outsideX > cx ? outsideX - 15 : outsideX - 100;
  const outsideY = cy + outsideRadius * Math.sin(-midAngle * RADIAN);
  // adjust based on text length
  const adjOutsideY = outsideY > cy ? outsideY : outsideY - 20;
  const insideRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const insideX = cx + insideRadius * Math.cos(-midAngle * RADIAN);
  const insideY = cy + insideRadius * Math.sin(-midAngle * RADIAN);

  return (
    <>
      <foreignObject x={adjOutsideX} y={adjOutsideY} width={500} height={500}>
        <div display="flex" alignItems="center" flexDirection="row">
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

  render() {
    return (
    <>
      <h2 style={{ marginLeft: '13%', float: 'left' }}>Covered Protocols</h2>
      <h2 style={{ marginRight: '16%', float: 'right' }}>Pool Strategies</h2>
      <ResponsiveContainer width='99%' aspect={2}>
        <PieChart >
          <Pie
            data={protocolData}
            cx="25%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="70%"
            fill="#8884d8"
            dataKey="value"
          >
            {
              protocolData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
            }
          </Pie>





          <Pie
            data={poolData}
            cx="75%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="70%"
            fill="#8884d8"
            dataKey="value"
          >
            {
              poolData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
            }
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </>
    );
  }
}
