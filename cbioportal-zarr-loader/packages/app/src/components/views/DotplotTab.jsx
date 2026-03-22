import { useEffect, useRef, useState } from "react";
import { Button, Card, Checkbox, Drawer, Input, Modal, Select, Tag, Typography, Spin, message } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { ParentSize } from "@visx/responsive";
import SearchableList from "../ui/SearchableList";
import TabLayout from "../layouts/TabLayout";
import Dotplot from "../charts/Dotplot";
import useAppStore from "../../store/useAppStore";
import { useDotplotData } from "../../hooks/useDotplotData";

const { Text } = Typography;

export default function DotplotTab() {
  const {
    metadata,
    dotplotGenes,
    dotplotGeneExpressions,
    dotplotGeneLoading,
    dotplotObsColumn,
    dotplotObsData,
    dotplotObsLoading,
    toggleDotplotGene,
    clearDotplotGenes,
    setDotplotObsColumn,
    clearDotplotObsColumn,
  } = useAppStore();

  const { geneNames, obsColumns } = metadata;

  // Auto-select defaults on first mount
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const defaultGenes = ["EGFR", "DAPL1"];
    for (const name of defaultGenes) {
      const match = geneNames.find((g) => g.toLowerCase() === name.toLowerCase());
      if (match && !dotplotGenes.includes(match)) toggleDotplotGene(match);
    }

    const obsMatch = obsColumns.find((c) => c.toLowerCase() === "cell_type");
    if (obsMatch && !dotplotObsColumn) setDotplotObsColumn(obsMatch);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [geneListText, setGeneListText] = useState(dotplotGenes.join("\n"));

  // Keep text area in sync with store gene list
  useEffect(() => {
    setGeneListText(dotplotGenes.join("\n"));
  }, [dotplotGenes]);

  const handleGeneSelect = async (geneName) => {
    const result = await toggleDotplotGene(geneName);
    if (result?.noExpression) {
      message.warning(`No expression data found for ${geneName}`);
    } else if (result?.error) {
      message.error(`Failed to fetch expression for ${geneName}`);
    }
  };

  const handleGeneListSubmit = () => {
    const names = geneListText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    setDrawerOpen(false);

    const notFound = [];
    const toAdd = [];
    for (const name of names) {
      const match = geneNames.find((g) => g.toLowerCase() === name.toLowerCase());
      if (!match) {
        notFound.push(name);
      } else if (!dotplotGenes.includes(match)) {
        toAdd.push(match);
      }
    }
    if (notFound.length > 0) message.warning(`Not found: ${notFound.join(", ")}`);

    // Fire off fetches in the background
    Promise.all(toAdd.map((g) => toggleDotplotGene(g))).then((results) => {
      const added = results.filter((r) => r?.added).length;
      if (added > 0) message.success(`Added ${added} gene${added > 1 ? "s" : ""}`);
    });
  };

  const { groups, dotplotData } = useDotplotData(dotplotGenes, dotplotGeneExpressions, dotplotObsData);

  const isLoading = dotplotGeneLoading || dotplotObsLoading;
  const [showLabels, setShowLabels] = useState(false);
  const [swapAxes, setSwapAxes] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [colorScaleName, setColorScaleName] = useState("viridis");

  // Size chart based on data dimensions, accounting for axis swap
  const xCount = swapAxes ? dotplotGenes.length : groups.length;
  const yCount = swapAxes ? groups.length : dotplotGenes.length;
  const xLabelsShown = showLabels && !swapAxes;
  const maxLabelLen = xLabelsShown && groups.length > 0 ? Math.max(...groups.map((g) => g.length)) : 0;
  const bottomMargin = xLabelsShown ? Math.max(40, maxLabelLen * 6 + 20) : 40;
  const leftMargin = swapAxes ? Math.max(120, (groups.length > 0 ? Math.max(...groups.map((g) => g.length)) * 6 + 20 : 120)) : 120;
  const chartWidth = xCount * (xLabelsShown ? 60 : 20) + leftMargin + 100;
  const chartHeight = yCount * 28 + 16 + bottomMargin;

  return (
    <TabLayout
      sidebar={
        <>
          <SearchableList
            title="Genes"
            items={geneNames}
            selected={dotplotGenes}
            onSelect={handleGeneSelect}
            onClear={clearDotplotGenes}
            loading={dotplotGeneLoading}
            multiSelect
            placeholder="Search genes..."
            height={350}
          />
          <SearchableList
            title="Obs Columns"
            items={obsColumns}
            selected={dotplotObsColumn}
            onSelect={setDotplotObsColumn}
            onClear={clearDotplotObsColumn}
            loading={dotplotObsLoading ? dotplotObsColumn : null}
            placeholder="Search obs columns..."
            height={350}
            style={{ marginTop: 16 }}
          />
        </>
      }
    >
      <Card
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            Dotplot
            {dotplotGenes.map((gene) => (
              <Tag key={gene} closable onClose={() => toggleDotplotGene(gene)} style={{ marginInlineEnd: 0 }}>
                {gene}
              </Tag>
            ))}
          </span>
        }
        extra={
          <Button size="small" onClick={() => setDrawerOpen(true)}>
            Gene List
          </Button>
        }
        size="small"
      >
        <Drawer
          title="Paste Gene List"
          placement="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={360}
          styles={{ mask: { background: "transparent" } }}
        >
          <Button
            size="small"
            style={{ marginBottom: 8 }}
            onClick={() => setGeneListText("DAPL1\nKRT17\nS100A9\nCXCL10\nISG15\nCOL1A1\nCOL3A1\nCASC1\nS100A4\nSST\nVEGFA\nCENPF\nPTTG1\nHIST1H4C\nTUBA1B\nC20orf85\nCAPS\nCETN2")}
          >
            Example
          </Button>
          <Input.TextArea
            rows={12}
            placeholder={"Paste gene names, one per line or comma-separated\ne.g.\nEGFR\nDAPL1\nTP53"}
            value={geneListText}
            onChange={(e) => setGeneListText(e.target.value)}
          />
          <Button
            type="primary"
            style={{ marginTop: 12, width: "100%" }}
            onClick={handleGeneListSubmit}
            disabled={!geneListText.trim()}
          >
            Add Genes
          </Button>
        </Drawer>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : dotplotData ? (
          <>
            <div style={{ marginBottom: 8, fontSize: 12, color: "#595959", display: "flex", alignItems: "center", gap: 12 }}>
              <span>
                {dotplotObsData.length.toLocaleString()} cells across {groups.length} groups
                {dotplotObsColumn && <> grouped by <strong>{dotplotObsColumn}</strong></>}
              </span>
              <Checkbox
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              >
                Show group labels
              </Checkbox>
              <Checkbox
                checked={swapAxes}
                onChange={(e) => setSwapAxes(e.target.checked)}
              >
                Swap axes
              </Checkbox>
              <Select
                size="small"
                value={colorScaleName}
                onChange={setColorScaleName}
                options={[
                  { value: "viridis", label: "Viridis" },
                  { value: "magma", label: "Magma" },
                ]}
                style={{ width: 90 }}
              />
              <Button
                size="small"
                icon={<ExpandOutlined />}
                onClick={() => setExpanded(true)}
              >
                Expand
              </Button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <Dotplot
                genes={dotplotGenes}
                groups={groups}
                data={dotplotData}
                width={chartWidth}
                height={chartHeight}
                showLabels={showLabels}
                swapAxes={swapAxes}
                colorScaleName={colorScaleName}
              />
            </div>
            <Modal
              open={expanded}
              onCancel={() => setExpanded(false)}
              footer={null}
              width="90vw"
              style={{ top: 20 }}
              styles={{ body: { height: "80vh", padding: 12 } }}
              destroyOnHidden
            >
              <div style={{ marginBottom: 8, fontSize: 12, color: "#595959", display: "flex", alignItems: "center", gap: 12 }}>
                <Checkbox
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                >
                  Show group labels
                </Checkbox>
                <Checkbox
                  checked={swapAxes}
                  onChange={(e) => setSwapAxes(e.target.checked)}
                >
                  Swap axes
                </Checkbox>
                <Select
                  size="small"
                  value={colorScaleName}
                  onChange={setColorScaleName}
                  options={[
                    { value: "viridis", label: "Viridis" },
                    { value: "magma", label: "Magma" },
                  ]}
                  style={{ width: 90 }}
                />
              </div>
              <div style={{ width: "100%", height: "calc(100% - 32px)", overflowX: "auto", overflowY: "auto" }}>
                <ParentSize>
                  {({ width: modalWidth, height: modalHeight }) => (
                    <Dotplot
                      genes={dotplotGenes}
                      groups={groups}
                      data={dotplotData}
                      width={Math.max(chartWidth, modalWidth)}
                      height={Math.max(chartHeight, modalHeight)}
                      showLabels={showLabels}
                      swapAxes={swapAxes}
                      colorScaleName={colorScaleName}
                    />
                  )}
                </ParentSize>
              </div>
            </Modal>
            <div style={{ marginTop: 12, fontSize: 11, color: "#595959", lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Group legend</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: 2 }}>
                  {groups.map((group, i) => (
                    <span key={group}><strong>{i + 1}</strong> = {group}</span>
                  ))}
                </div>
              </div>
              <div style={{ color: "#8c8c8c" }}>
                <p style={{ margin: "0 0 6px" }}>
                  Dotplot summarizes gene expression across cell groups from single-cell RNA-seq data.
                  Each dot represents one gene in one cell group.
                </p>
              </div>
            </div>
          </>
        ) : (
          <Text type="secondary">
            Select one or more genes and an obs column to view the dotplot.
          </Text>
        )}
      </Card>
    </TabLayout>
  );
}
