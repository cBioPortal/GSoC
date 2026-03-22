import { Card, Typography, Descriptions } from "antd";
import useAppStore from "../../store/useAppStore";

const { Text } = Typography;

export default function InfoTab() {
  const { url, adata, metadata } = useAppStore();
  const { chunks } = metadata;

  return (
    <Card title="Dataset" size="small">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Shape">
          {adata.nObs.toLocaleString()} obs × {adata.nVar.toLocaleString()} var
        </Descriptions.Item>
        <Descriptions.Item label="Chunk size">
          {chunks ? chunks.join(" × ") : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Encoding">
          {adata.attrs["encoding-type"]} v{adata.attrs["encoding-version"]}
        </Descriptions.Item>
        <Descriptions.Item label="URL">
          <Text copyable style={{ fontSize: 12 }}>{url}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
