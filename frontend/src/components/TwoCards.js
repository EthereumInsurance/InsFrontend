import React, { useState } from "react";
import { Card, Col, Row } from "antd";
import 'antd/dist/antd.css';
import './index.css';


export function TwoCards({ something }) {

  return (
    <div>
        <Row>
          <Card
            className="card"
            style={{ backgroundColor: '#DCDCDC' }}
            title="Normal Title"
            bordered={true}
          >
            Card content
          </Card>
          <Card
            className="card"
            style={{ backgroundColor: '#DCDCDC' }}
            title="Card title"
            bordered={true}
          >
            Card content
          </Card>
        </Row>
    </div>
  );
}
