import { Table, Typography } from "antd";

const { Title } = Typography;

/**
 * Displays a preview of matrix data in a table format.
 * Shows the first N rows with index and column values.
 */
export default function MatrixPreviewTable({
  data,
  shape,
  index,
  title = "First 10 rows",
  rowCount = 10,
}) {
  if (!data || !shape || !index) return null;

  const dataSource = index.slice(0, rowCount).map((id, i) => {
    const row = { key: id, index: id };
    for (let j = 0; j < shape[1]; j++) {
      row[`col${j}`] = data[i * shape[1] + j]?.toFixed(4);
    }
    return row;
  });

  const columns = [
    { title: "Index", dataIndex: "index", key: "index", fixed: "left" },
    ...Array.from({ length: shape[1] || 0 }, (_, j) => ({
      title: String(j),
      dataIndex: `col${j}`,
      key: `col${j}`,
    })),
  ];

  return (
    <>
      {title && <Title level={5}>{title}</Title>}
      <Table
        size="small"
        pagination={false}
        scroll={{ x: true }}
        dataSource={dataSource}
        columns={columns}
      />
    </>
  );
}
