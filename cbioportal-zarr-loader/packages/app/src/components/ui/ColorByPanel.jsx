import { useState } from "react";
import { Card, Button } from "antd";
import useAppStore from "../../store/useAppStore";
import SearchableList from "./SearchableList";

export default function ColorByPanel({ height = 300, width = 220, style = {} }) {
  const {
    metadata,
    colorColumn,
    colorLoading,
    setColorColumn,
    selectedGene,
    setSelectedGene,
    clearGeneSelection,
  } = useAppStore();

  const { obsColumns, geneNames } = metadata || {};
  const [activeTab, setActiveTab] = useState("columns");

  const isColumns = activeTab === "columns";
  const selected = isColumns ? colorColumn : selectedGene;
  const onClear = isColumns ? () => setColorColumn(null) : clearGeneSelection;
  const selectedCount = selected ? 1 : 0;

  return (
    <Card
      size="small"
      tabList={[
        { key: "columns", tab: "Columns" },
        { key: "genes", tab: "Genes" },
      ]}
      title="Color By"
      activeTabKey={activeTab}
      onTabChange={setActiveTab}
      tabProps={{ size: "small" }}
      extra={onClear && selectedCount > 0 ? (
        <Button type="link" size="small" onClick={onClear} style={{ padding: 0 }}>
          Clear
        </Button>
      ) : null}
      style={{ width, height, display: "flex", flexDirection: "column", ...style }}
      styles={{
        body: {
          padding: 0,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {isColumns ? (
        <SearchableList
          bare
          items={obsColumns}
          selected={colorColumn}
          onSelect={setColorColumn}
          loading={colorLoading ? colorColumn : null}
          placeholder="Search columns..."
        />
      ) : (
        <SearchableList
          bare
          items={geneNames}
          selected={selectedGene}
          onSelect={setSelectedGene}
          placeholder="Search genes..."
        />
      )}
    </Card>
  );
}
