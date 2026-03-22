import { Card, Table } from "antd";

/**
 * Displays fetch operation timings in a table.
 * Shows each operation and its duration, plus a total.
 */
export default function TimingsTable({ timings, title = "Fetch Keys Timings", style = {} }) {
  if (!timings) return null;

  const dataSource = Object.entries(timings).map(([key, ms]) => ({
    key,
    operation: key,
    time: `${ms.toFixed(1)} ms`,
  }));

  dataSource.push({
    key: "total",
    operation: "Total",
    time: `${Object.values(timings).reduce((a, b) => a + b, 0).toFixed(1)} ms`,
  });

  return (
    <Card title={title} size="small" style={style}>
      <Table
        size="small"
        pagination={false}
        dataSource={dataSource}
        columns={[
          { title: "Operation", dataIndex: "operation", key: "operation" },
          { title: "Time", dataIndex: "time", key: "time" },
        ]}
      />
    </Card>
  );
}
