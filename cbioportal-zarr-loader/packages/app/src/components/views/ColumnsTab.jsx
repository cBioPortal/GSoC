import { useState } from "react";
import { Card, Button, Table } from "antd";
import ColumnExplorer from "../ui/ColumnExplorer";
import SearchableList from "../ui/SearchableList";
import TabLayout from "../layouts/TabLayout";
import useAppStore from "../../store/useAppStore";
import { useColumnsData } from "../../hooks/useColumnsData";

export default function ColumnsTab() {
  const {
    metadata,
    obsColumnsSelected,
    obsColumnsData,
    obsIndex,
    obsColumnLoading,
    obsColumnTime,
    toggleObsColumn,
    clearObsColumns,
    varColumnsSelected,
    varColumnsData,
    varIndex,
    varColumnLoading,
    varColumnTime,
    toggleVarColumn,
    clearVarColumns,
  } = useAppStore();

  const { obsColumns, varColumns } = metadata;
  const [activeGroup, setActiveGroup] = useState("obs");

  const isObs = activeGroup === "obs";
  const columns = isObs ? obsColumns : varColumns;
  const selectedColumns = isObs ? obsColumnsSelected : varColumnsSelected;
  const onToggle = isObs ? toggleObsColumn : toggleVarColumn;
  const onClear = isObs ? clearObsColumns : clearVarColumns;
  const loading = isObs ? obsColumnLoading : varColumnLoading;
  const columnsData = isObs ? obsColumnsData : varColumnsData;
  const selectedCount = selectedColumns.length;

  const lastSelected = selectedCount > 0
    ? selectedColumns[selectedCount - 1]
    : null;

  const { valueCounts } = useColumnsData(lastSelected, columnsData);

  return (
    <TabLayout
      sidebar={
        <>
        <Card
          size="small"
          title="Select"
          tabList={[
            { key: "obs", tab: `obs (${obsColumns.length})` },
            { key: "var", tab: `var (${varColumns.length})` },
          ]}
          activeTabKey={activeGroup}
          onTabChange={setActiveGroup}
          tabProps={{ size: "small" }}
          extra={onClear && selectedCount > 0 ? (
            <Button type="link" size="small" onClick={onClear} style={{ padding: 0 }}>
              Clear
            </Button>
          ) : null}
          style={{ height: 300, display: "flex", flexDirection: "column" }}
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
          <SearchableList
            bare
            items={columns}
            selected={selectedColumns}
            onSelect={onToggle}
            loading={loading}
            multiSelect
            placeholder="Search columns..."
          />
        </Card>
        {lastSelected && (
          <Card
            title={`Value Counts: ${lastSelected}`}
            size="small"
            style={{ marginTop: 16 }}
          >
            {loading === lastSelected ? null : (
              <Table
                size="small"
                pagination={false}
                style={{ maxHeight: 250, overflow: "auto" }}
                dataSource={valueCounts}
                columns={[
                  { title: "Value", dataIndex: "value", key: "value" },
                  { title: "Count", dataIndex: "count", key: "count" },
                ]}
              />
            )}
          </Card>
        )}
        </>
      }
    >
      <ColumnExplorer
        selectedColumns={selectedColumns}
        columnsData={columnsData}
        index={isObs ? obsIndex : varIndex}
        time={isObs ? obsColumnTime : varColumnTime}
      />
    </TabLayout>
  );
}
