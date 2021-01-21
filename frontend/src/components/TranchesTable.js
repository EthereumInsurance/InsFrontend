import React from "react";
import { Table, Button } from "antd";


export function TranchesTable({ something }) {

  const dataSource = [
    {
      key: '1',
      type: 'Junior',
      yield: `${9.13}%`,
      lockup: '3 days',
      strategy: 'Aave V2',
      poolsize: '245.8',
      stake: <Button type="danger" ghost="true">Stake</Button>,
    },
    {
      key: '2',
      type: 'Mezzanine',
      yield: `${7.46}%`,
      lockup: '3 days',
      strategy: 'Aave V2',
      poolsize: '377.3',
      stake: <Button type="danger" ghost="true">Stake</Button>,
    },
    {
      key: '3',
      type: 'Senior',
      yield: `${5.34}%`,
      lockup: '3 days',
      strategy: 'Aave V2',
      poolsize: '412.0',
      stake: <Button type="danger" ghost="true">Stake</Button>,
    },
  ];

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Yield',
      dataIndex: 'yield',
      key: 'yield',
    },
    {
      title: 'Lockup',
      dataIndex: 'lockup',
      key: 'lockup',
    },
    {
      title: 'Strategy',
      dataIndex: 'strategy',
      key: 'strategy',
    },
    {
      title: 'Pool Size ($M)',
      dataIndex: 'poolsize',
      key: 'poolsize',
    },
    {
      title: '',
      dataIndex: 'stake',
      key: 'stake',
    },
  ];

  return (
    <div>
      <Table dataSource={dataSource} columns={columns} pagination={false} />;
    </div>
  );
}
