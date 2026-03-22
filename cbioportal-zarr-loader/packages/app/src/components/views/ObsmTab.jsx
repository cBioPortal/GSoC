import { useEffect, useState } from "react";
import {
  Card,
  Drawer,
  Typography,
  Alert,
  Space,
  Button,
  Input,
  Select,
  Popover,
  message,
} from "antd";
import { ReloadOutlined, EditOutlined, CopyOutlined, InfoCircleOutlined } from "@ant-design/icons";
import EmbeddingScatterplotContainer from "../containers/EmbeddingScatterplotContainer";
import SearchableList from "../ui/SearchableList";
import ColorByPanel from "../ui/ColorByPanel";

import TabLayout from "../layouts/TabLayout";
import useAppStore from "../../store/useAppStore";

const { Text } = Typography;

const EXAMPLE_FILTER = JSON.stringify({
  defaults: { embedding_key: "X_umap50", active_tooltips: ["cell_type", "author_sample_id"], color_by: { type: "category", value: "cell_type" } },
  initial_view: "OV-070 by cell_type",
  saved_views: [
    {
      name: "OV-070 by cell_type",
      selection: { target: "donor_id", values: ["SPECTRUM-OV-070"] },
      active_tooltips: ["cell_type", "author_sample_id"],
      color_by: { type: "category", value: "cell_type" }
    },
    {
      name: "OV-090 & OV-022 by cell_type",
      selection: { target: "donor_id", values: ["SPECTRUM-OV-090", "SPECTRUM-OV-022"] },
      active_tooltips: ["cell_type", "author_sample_id", "Phase"],
      color_by: { type: "category", value: "cell_type" }
    },
    {
      selection: { target: "donor_id", values: ["SPECTRUM-OV-041"] },
      active_tooltips: ["cell_type", "author_sample_id", "Phase"],
      color_by: { type: "gene", value: "dapl1", color_scale: "magma" }
    }
  ]
}, null, 2);

export default function ObsmTab() {
  const {
    metadata,
    featureFlags,
    selectedObsm,
    obsmData,
    obsmLoading,
    obsmTime,
    fetchObsm,
    clearTooltipColumns,
    setSelectedPoints,
    setSelectionGeometry,
    setColorColumn,
    setSelectedGene,
    setColorScaleName,
    appliedSelections,
    activeSelectionIndex,
    applyView,
    applyFilterConfig,
    setActiveSelectionIndex,
    setAppliedSelections,
    filterJson,
    setFilterJson,
  } = useAppStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [childDrawerOpen, setChildDrawerOpen] = useState(false);
  const [viewJson, setViewJson] = useState("");

  const { obsmKeys } = metadata;
  const isEmbedding = selectedObsm && /umap|tsne|pca/i.test(selectedObsm) && obsmData?.shape?.[1] >= 2;

  useEffect(() => {
    if (obsmLoading) {
      message.open({
        key: "obsm-fetch",
        type: "loading",
        content: `Loading ${selectedObsm}...`,
        duration: 0,
      });
    } else if (obsmTime != null) {
      message.open({
        key: "obsm-fetch",
        type: "success",
        content: `Fetched ${selectedObsm} in ${obsmTime.toFixed(1)} ms`,
        duration: 5,
      });
    }
  }, [obsmLoading, obsmTime, selectedObsm]);

  // Auto-fetch UMAP embedding on mount
  useEffect(() => {
    if (!selectedObsm && obsmKeys.length > 0) {
      const umapKey = obsmKeys.find(k => /umap/i.test(k));
      if (umapKey) {
        fetchObsm(umapKey);
      }
    }
  }, [obsmKeys, selectedObsm, fetchObsm]);

  const handleFilterApply = async () => {
    let raw;
    try {
      raw = JSON.parse(filterJson);
    } catch {
      message.error("Invalid JSON");
      return;
    }

    const result = await applyFilterConfig(raw);
    if (!result.success) {
      message.error(result.error);
      return;
    }

    setChildDrawerOpen(false);
    setDrawerOpen(false);
  };

  const handleSaveSelection = () => {
    const geo = useAppStore.getState().selectionGeometry;
    if (!geo) {
      message.warning("No selection geometry to save.");
      return;
    }

    // Build a new view from current state
    const newView = {
      name: `${geo.type} selection`,
      selection: geo.type === "rectangle"
        ? { type: "rectangle", bounds: geo.bounds }
        : { type: "lasso", polygon: geo.polygon },
    };

    // Add embedding_key if set
    if (selectedObsm) {
      newView.embedding_key = selectedObsm;
    }

    // Add tooltips if set
    const currentTooltips = useAppStore.getState().tooltipColumns;
    if (currentTooltips.length > 0) {
      newView.active_tooltips = currentTooltips;
    }

    // Add color_by if set
    const currentColorCol = useAppStore.getState().colorColumn;
    const currentGene = useAppStore.getState().selectedGene;
    const currentScale = useAppStore.getState().colorScaleName;
    if (currentColorCol) {
      newView.color_by = { type: "category", value: currentColorCol };
    } else if (currentGene) {
      newView.color_by = { type: "gene", value: currentGene };
      if (currentScale !== "viridis") {
        newView.color_by.color_scale = currentScale;
      }
    }

    // Append to current filterJson config
    let config;
    try {
      config = JSON.parse(filterJson);
      if (!config.saved_views) config.saved_views = [];
    } catch {
      config = { initial_view: 0, saved_views: [] };
    }

    config.saved_views.push(newView);
    const updated = JSON.stringify(config, null, 2);
    setFilterJson(updated);

    // Update applied selections dropdown
    setAppliedSelections(config.saved_views);
    setActiveSelectionIndex(config.saved_views.length - 1);

    message.success("Selection saved to config");
  };

  const handleSelectionPick = async (index) => {
    if (index === undefined) return;
    setActiveSelectionIndex(index);
    await applyView(appliedSelections[index]);
  };

  return (
    <TabLayout
      sidebar={
        <>
          <SearchableList
            title="Keys"
            items={obsmKeys}
            selected={selectedObsm}
            onSelect={fetchObsm}
            loading={obsmLoading ? selectedObsm : null}
            placeholder="Search keys..."
            height={200}
          />
          <ColorByPanel height={300} style={{ marginTop: 16 }} />
        </>
      }
    >
      {selectedObsm ? (
        <>
          <Card
            title={`obsm: ${selectedObsm}`}
            size="small"
            extra={
              <Space>
                <Select
                  placeholder="No applied views"
                  size="small"
                  allowClear
                  style={{ width: 240 }}
                  onChange={handleSelectionPick}
                  onClear={() => {
                    setActiveSelectionIndex(undefined);
                    setSelectedPoints([]);
                    clearTooltipColumns();
                    setColorColumn(null);
                    setSelectedGene(null);
                    setColorScaleName("viridis");
                  }}
                  value={activeSelectionIndex}
                  options={appliedSelections.map((s, i) => ({
                    value: i,
                    label: `${i}: ${s.name || (s.selection.target ? `${s.selection.target}: ${s.selection.values.join(", ")}` : `${s.selection.type} selection`)}`,
                  }))}
                />
                <Popover
                  title="Current View"
                  trigger="click"
                  content={
                    <pre style={{ margin: 0, maxHeight: 300, overflow: "auto", fontSize: 12 }}>
                      {activeSelectionIndex != null
                        ? JSON.stringify(appliedSelections[activeSelectionIndex], null, 2)
                        : "No view selected"}
                    </pre>
                  }
                >
                  <Button
                    size="small"
                    icon={<InfoCircleOutlined />}
                    title="View current config"
                  />
                </Popover>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    if (activeSelectionIndex != null) {
                      setViewJson(JSON.stringify(appliedSelections[activeSelectionIndex], null, 2));
                    } else {
                      setViewJson("");
                    }
                    setDrawerOpen(true);
                  }}
                  title="Edit JSON config"
                />
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    activeSelectionIndex != null
                      ? applyView(appliedSelections[activeSelectionIndex])
                      : fetchObsm(selectedObsm)
                  }
                  title="Reload the current config"
                  loading={obsmLoading}
                />
              </Space>
            }
          >
            {obsmData?.error ? (
              <Alert type="error" message={obsmData.error} />
            ) : isEmbedding ? (
              <EmbeddingScatterplotContainer
                data={obsmData.data}
                shape={obsmData.shape}
                label={selectedObsm}
                onSaveSelection={handleSaveSelection}
                showHexbinToggle={!!featureFlags.hexbin}
              />
            ) : null}
          </Card>
          <Drawer
            title="Current View"
            placement="right"
            size={480}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            styles={{ mask: { background: "transparent" } }}
          >
            {activeSelectionIndex != null ? (
              <>
                <Input.TextArea
                  autoSize={{ minRows: 2 }}
                  value={viewJson}
                  onChange={e => setViewJson(e.target.value)}
                  placeholder='{"name": "my view", "selection": {...}, ...}'
                />
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(viewJson);
                        message.success("Copied to clipboard");
                      }}
                      disabled={!viewJson}
                      icon={<CopyOutlined />}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        try {
                          setViewJson(JSON.stringify(JSON.parse(viewJson), null, 2));
                        } catch {
                          message.error("Invalid JSON — cannot format");
                        }
                      }}
                    >
                      Format
                    </Button>
                  </Space>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => setChildDrawerOpen(true)}
                    >
                      Full Config
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => {
                        let parsed;
                        try {
                          parsed = JSON.parse(viewJson);
                        } catch {
                          message.error("Invalid JSON");
                          return;
                        }
                        // Update the view in appliedSelections
                        const updated = [...appliedSelections];
                        updated[activeSelectionIndex] = parsed;
                        setAppliedSelections(updated);
                        // Sync back to filterJson
                        try {
                          const config = JSON.parse(filterJson);
                          config.saved_views = updated;
                          setFilterJson(JSON.stringify(config, null, 2));
                        } catch {
                          // filterJson wasn't valid — rebuild
                          setFilterJson(JSON.stringify({ saved_views: updated }, null, 2));
                        }
                        setDrawerOpen(false);
                        applyView(parsed);
                        message.success("View updated");
                      }}
                    >
                      Save View
                    </Button>
                  </Space>
                </div>
              </>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text type="secondary">No view selected. Open the full config to edit.</Text>
                <Button onClick={() => setChildDrawerOpen(true)}>
                  Full Config
                </Button>
              </Space>
            )}

            <Drawer
              title="Full Config"
              placement="right"
              width={480}
              open={childDrawerOpen}
              onClose={() => setChildDrawerOpen(false)}
              styles={{ mask: { background: "transparent" } }}
            >
              <Input.TextArea
                autoSize={{ minRows: 2 }}
                value={filterJson}
                onChange={e => setFilterJson(e.target.value)}
                placeholder='{"initial_view": "my view", "saved_views": [{"name": "my view", ...}]}'
              />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(filterJson);
                      message.success("Copied to clipboard");
                    }}
                    disabled={!filterJson}
                    icon={<CopyOutlined />}
                  >
                    Copy
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      try {
                        setFilterJson(JSON.stringify(JSON.parse(filterJson), null, 2));
                      } catch {
                        message.error("Invalid JSON — cannot format");
                      }
                    }}
                  >
                    Format
                  </Button>
                </Space>
                <Space>
                  <Button
                    size="small"
                    onClick={() => setFilterJson(EXAMPLE_FILTER)}
                  >
                    Example
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    onClick={handleFilterApply}
                  >
                    Load Config
                  </Button>
                </Space>
              </div>
            </Drawer>
          </Drawer>
        </>
      ) : (
        <Card size="small">
          <Text type="secondary">Select a key to view its data</Text>
        </Card>
      )}
    </TabLayout>
  );
}
