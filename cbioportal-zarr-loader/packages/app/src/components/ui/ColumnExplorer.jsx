import { useMemo } from "react";
import {
  Card,
  Typography,
  Table,
  Space,
} from "antd";

const { Text } = Typography;

export default function ColumnExplorer({
  selectedColumns,
  columnsData,
  index,
  time,
}) {
  const tableColumns = useMemo(() => {
    const cols = [{ title: "Index", dataIndex: "index", key: "index" }];
    for (const col of selectedColumns) {
      cols.push({ title: col, dataIndex: col, key: col });
    }
    return cols;
  }, [selectedColumns]);

  const tableData = useMemo(() => {
    if (!index) return [];
    return index.map((id, i) => {
      const row = { key: id, index: id };
      for (const col of selectedColumns) {
        row[col] = columnsData[col] ? String(columnsData[col][i]) : "";
      }
      return row;
    });
  }, [index, selectedColumns, columnsData]);

  return (
    <Card title="Data" size="small">
      <Space style={{ marginBottom: 16 }}>
        <Text>Rows: {index?.length?.toLocaleString() ?? 0}</Text>
        {time != null && (
          <>
            <Text type="secondary">|</Text>
            <Text>Last fetch: {time.toFixed(1)} ms</Text>
          </>
        )}
      </Space>
      <Table
        size="small"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
        }}
        dataSource={tableData}
        columns={tableColumns}
      />
    </Card>
  );
}
