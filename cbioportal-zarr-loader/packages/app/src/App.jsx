import { useEffect, useMemo } from "react";
import { Routes, Route } from "react-router";
import {
  Layout,
  Spin,
  Alert,
  Tabs,
} from "antd";
import { GithubOutlined } from "@ant-design/icons";
import ColumnsTab from "./components/views/ColumnsTab";
import InfoTab from "./components/views/InfoTab";
import ObsmTab from "./components/views/ObsmTab";
import PlotsTab from "./components/views/PlotsTab";
import DotplotTab from "./components/views/DotplotTab";

import useAppStore from "./store/useAppStore";
import usePostMessage from "./hooks/usePostMessage";
import useIframeResize from "./hooks/useIframeResize";

const isEmbedded = window.self !== window.top || new URLSearchParams(window.location.search).has("embedded");

const { Header, Content } = Layout;

const URL = "https://cbioportal-public-imaging.assets.cbioportal.org/msk_spectrum_tme_2022/zarr/spectrum_all_cells.zarr";

export default function App() {
  const {
    loading,
    error,
    metadata,
    featureFlags,
    initialize,
  } = useAppStore();

  useEffect(() => {
    initialize(URL);
  }, [initialize]);

  const postMessageHandlers = useMemo(() => ({
    applyConfig: async (payload) => {
      const result = await useAppStore.getState().applyFilterConfig(payload);
      if (!result.success) console.error("[CZL:postMessage] applyConfig failed:", result.error);
    },
  }), []);

  usePostMessage(postMessageHandlers, import.meta.env.VITE_POSTMESSAGE_ORIGIN || "*");
  useIframeResize();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading AnnData from {URL}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Error loading AnnData"
          description={
            <>
              <p>{error}</p>
              <p>Make sure the Zarr store is being served at {URL}</p>
            </>
          }
        />
      </div>
    );
  }

  const { obsColumns, varColumns } = metadata;

  const tabItems = [
    {
      key: "explorer",
      label: "Explore",
      children: <ObsmTab />,
    },
    {
      key: "columns",
      label: `Data (${obsColumns.length + varColumns.length})`,
      children: <ColumnsTab />,
    },
    {
      key: "plots",
      label: "Plots",
      children: <PlotsTab />,
    },
    ...(featureFlags.dotplot ? [{ key: "dotplot", label: "Dotplot", children: <DotplotTab /> }] : []),
    {
      key: "info",
      label: "Info",
      children: <InfoTab />,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isEmbedded && (
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600 }}>
            cBioportal ZExplorer
          </span>
          <nav style={{ display: "flex", gap: 16 }}>
            <a
              href="https://github.com/cbioportal/cbioportal-zarr-loader"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubOutlined style={{ fontSize: 20 }} />
            </a>
          </nav>
        </Header>
      )}
      <Content style={{ background: "#fff" }}>
        <Routes>
          <Route
            path="/*"
            element={
              <div style={{ padding: isEmbedded ? "0 24px 24px" : 24 }}>
                <Tabs items={tabItems} defaultActiveKey={import.meta.env.VITE_DEFAULT_TAB || "explorer"} />
              </div>
            }
          />
        </Routes>
      </Content>
    </Layout>
  );
}
