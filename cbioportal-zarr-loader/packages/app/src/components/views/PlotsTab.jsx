import { useCallback, useEffect, useState, useTransition } from "react";
import { Alert, Card, Checkbox, Typography, Spin, Select } from "antd";
import SearchableList from "../ui/SearchableList";
import TabLayout from "../layouts/TabLayout";
import useAppStore from "../../store/useAppStore";
import { usePlotsData } from "../../hooks/usePlotsData";
import ViolinPlot from "../charts/ViolinPlot";
import RaincloudPlot from "../charts/RaincloudPlot";

const { Text } = Typography;

export default function PlotsTab() {
  const {
    metadata,
    featureFlags,
    plotGene,
    plotGeneExpression,
    plotGeneLoading,
    plotObsColumn,
    plotObsData,
    plotObsLoading,
    setPlotGene,
    clearPlotGene,
    setPlotObsColumn,
    clearPlotObsColumn,
  } = useAppStore();

  const { geneNames, obsColumns } = metadata;
  const [filterExpression, setFilterExpression] = useState(null);
  const [isPending, startTransition] = useTransition();
  const handleFilterChange = (val) => {
    startTransition(() => setFilterExpression(val ?? null));
  };
  const [raincloudHorizontal, setRaincloudHorizontal] = useState(true);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useCallback((node) => {
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(node);
    setContainerWidth(node.clientWidth);
  }, []);

  // Dev defaults: auto-select gene and obs column on first mount
  useEffect(() => {
    if (!plotGene && geneNames?.includes("CETN2")) setPlotGene("CETN2");
    if (!plotObsColumn && obsColumns?.includes("cell_type")) setPlotObsColumn("cell_type");
  }, []);

  const { frequentValues, data, categoryCount, tooManyCategories, boxplotData, violinData, MAX_CATEGORIES } =
    usePlotsData(plotGeneExpression, plotObsData, plotObsColumn, plotGene, filterExpression);

  // Reset filter when gene changes
  useEffect(() => {
    setFilterExpression(null);
  }, [plotGene]);

  const isLoading = plotGeneLoading || plotObsLoading;
  const hasSelections = plotGene && plotObsColumn;

  return (
    <TabLayout
      sidebar={
        <>
          <SearchableList
            title="Genes"
            items={geneNames}
            selected={plotGene}
            onSelect={setPlotGene}
            onClear={clearPlotGene}
            loading={plotGeneLoading ? plotGene : null}
            placeholder="Search genes..."
            height={350}
          />
          <SearchableList
            title="Obs Columns"
            items={obsColumns}
            selected={plotObsColumn}
            onSelect={setPlotObsColumn}
            onClear={clearPlotObsColumn}
            loading={plotObsLoading ? plotObsColumn : null}
            placeholder="Search obs columns..."
            height={350}
            style={{ marginTop: 16 }}
          />
        </>
      }
    >
      <Card
        title={hasSelections ? `${plotGene} by ${plotObsColumn}` : "Box Plot"}
        size="small"
      >
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : data ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <Text>
                {data.length.toLocaleString()} points,{" "}
                {categoryCount} categories
              </Text>
              <Text style={{ marginLeft: 16 }}>
                Exclude expression:{" "}
              </Text>
              <Select
                size="small"
                allowClear
                placeholder="Select value to exclude"
                value={filterExpression}
                onChange={handleFilterChange}
                options={frequentValues}
                style={{ width: 200 }}
              />
              {isPending && <Spin size="small" style={{ marginLeft: 8 }} />}
            </div>
            {tooManyCategories && (
              <Alert
                type="warning"
                showIcon
                message={`Too many categories (${categoryCount})`}
                description={`Violin and box plots are not rendered for obs columns with more than ${MAX_CATEGORIES} categories. Choose an obs column with fewer unique values.`}
                style={{ marginBottom: 12 }}
              />
            )}
            <div ref={containerRef}>
              {violinData && (
                <ViolinPlot
                  groups={violinData.groups}
                  violins={violinData.violins}
                  boxplotStats={boxplotData?.stats}
                  showBoxplot
                  containerWidth={containerWidth}
                  height={500}
                  xLabel={plotObsColumn}
                  yLabel={plotGene}
                />
              )}
              {featureFlags.raincloud && violinData && (
                <>
                  <Checkbox
                    checked={raincloudHorizontal}
                    onChange={(e) => setRaincloudHorizontal(e.target.checked)}
                    style={{ marginTop: 12, marginBottom: 4 }}
                  >
                    Horizontal
                  </Checkbox>
                  <RaincloudPlot
                    groups={violinData.groups}
                    violins={violinData.violins}
                    boxplotStats={boxplotData?.stats}
                    data={data}
                    categoryField={plotObsColumn}
                    valueField={plotGene}
                    horizontal={raincloudHorizontal}
                    containerWidth={containerWidth}
                    height={500}
                    xLabel={raincloudHorizontal ? plotGene : plotObsColumn}
                    yLabel={raincloudHorizontal ? plotObsColumn : plotGene}
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <Text type="secondary">
            Select a gene and an obs column to view the box plot.
          </Text>
        )}
      </Card>
    </TabLayout>
  );
}
