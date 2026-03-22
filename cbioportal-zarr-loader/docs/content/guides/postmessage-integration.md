---
title: postMessage Integration
sidebar_position: 0
---

# postMessage Integration Guide

## Overview

The cbioportal-zarr-loader app can be embedded in an iframe and controlled by a parent application using the standard [`window.postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API. This allows external applications to programmatically configure the viewer's state, including:

- Loading specific embeddings (e.g., UMAP, t-SNE)
- Selecting subsets of data points (by category, rectangle, or lasso)
- Configuring tooltips and color schemes
- Defining multiple saved views for quick navigation

Use this integration when you want to embed the zarr viewer in another web application and control it dynamically based on user interactions or application state.

## Quick Start

### 1. Embed the App in an Iframe

```html
<iframe
  id="zarr-viewer"
  src="https://your-zarr-viewer-origin.com"
  width="100%"
  height="600px"
  allow="cross-origin-isolated"
></iframe>
```

### 2. Send a Configuration Message

```js
const iframe = document.getElementById("zarr-viewer");

iframe.contentWindow.postMessage({
  type: "applyConfig",
  payload: {
    defaults: {
      embedding_key: "X_umap50",
      active_tooltips: ["cell_type"]
    },
    initial_view: 0,
    saved_views: [
      {
        name: "My First View",
        selection: {
          target: "donor_id",
          values: ["SPECTRUM-OV-070"]
        }
      }
    ]
  }
}, "https://your-zarr-viewer-origin.com");
```

This minimal example will load the `X_umap50` embedding, select all points where `donor_id` equals `"SPECTRUM-OV-070"`, and display `cell_type` in the tooltip.

## Timing & Queuing

The app needs to load its dataset before it can apply a config. If a `postMessage` arrives before the data has finished loading, the config is automatically queued and applied once initialization completes. This means the parent can fire-and-forget without waiting for the iframe to be ready.

The flow:

1. Parent sends `postMessage` with `applyConfig` — iframe may still be loading data
2. The app queues the config and logs: `[CZL:postMessage] Store not ready, queuing config for after initialization`
3. Once the dataset finishes loading, the queued config is applied automatically and logs: `[CZL:postMessage] Applying queued config after initialization`

If the message arrives after the app has already initialized, it is applied immediately.

:::note
If multiple configs are sent while the app is loading, only the **last one** is kept. Earlier configs are overwritten in the queue.
:::

## Message Format

All messages sent to the iframe must use the following envelope format:

```js
{
  type: string,      // Message type identifier
  payload: any       // Type-specific payload
}
```

### Supported Message Types

| Type | Description | Payload Type |
|------|-------------|--------------|
| `applyConfig` | Apply a filter configuration to the viewer | `FilterSchema` object |

Additional message types may be added in future versions.

## Config Schema Reference

The `applyConfig` message accepts a payload conforming to the `FilterSchema`:

```typescript
FilterSchema = {
  defaults?: DefaultsSchema,
  initial_view: string | number,
  saved_views: ViewSchema[]
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `defaults` | `DefaultsSchema` | No | Default settings applied to all views unless overridden |
| `initial_view` | `string \| number` | Yes | Name or index of the view to display on load. Use `0` for first view, `1` for second, etc., or the view's `name` string |
| `saved_views` | `ViewSchema[]` | Yes | Array of view configurations. Must contain at least one view |

### DefaultsSchema

Defines default settings that apply to all views unless explicitly overridden at the view level.

```typescript
DefaultsSchema = {
  embedding_key?: string,
  active_tooltips?: string[],
  color_by?: ColorBySchema
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `embedding_key` | `string` | No | Default embedding to display (e.g., `"X_umap50"`, `"X_tsne"`) |
| `active_tooltips` | `string[]` | No | Array of observation column names to display in tooltips when hovering over points |
| `color_by` | `ColorBySchema` | No | Default coloring scheme for points |

### ViewSchema

Defines a single view configuration. Each view represents a specific state of the visualization.

```typescript
ViewSchema = {
  name?: string,
  embedding_key?: string,
  selection: SelectionSchema,
  active_tooltips?: string[],
  color_by?: ColorBySchema
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Human-readable label for the view (displayed in UI) |
| `embedding_key` | `string` | No | Embedding to use for this view. Overrides `defaults.embedding_key` |
| `selection` | `SelectionSchema` | Yes | Defines which points are selected in this view |
| `active_tooltips` | `string[]` | No | Tooltip columns for this view. Overrides `defaults.active_tooltips` |
| `color_by` | `ColorBySchema` | No | Coloring scheme for this view. Overrides `defaults.color_by` |

### ColorBySchema

Defines how points should be colored in the visualization.

```typescript
ColorBySchema = {
  type: "category" | "gene",
  value: string,
  color_scale?: "viridis" | "magma"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"category" \| "gene"` | Yes | Color by a categorical observation column or by gene expression |
| `value` | `string` | Yes | Column name (for category) or gene name (for gene) |
| `color_scale` | `"viridis" \| "magma"` | No | Color scale for gene expression. Only applicable when `type: "gene"`. Defaults to `"viridis"` |

**Examples:**

```js
// Color by categorical column
{ type: "category", value: "cell_type" }

// Color by gene expression with magma color scale
{ type: "gene", value: "dapl1", color_scale: "magma" }
```

## Selection Types

The `selection` field in a `ViewSchema` defines which data points are selected. Three selection types are supported:

### Category Selection (default)

Select points based on categorical values in an observation column.

```typescript
{
  type: "category",  // Optional - this is the default
  target: string,    // Column name
  values: (string | number)[]  // Array of values to select
}
```

**Example:**

```js
{
  target: "donor_id",
  values: ["SPECTRUM-OV-070", "SPECTRUM-OV-090"]
}
```

This selects all points where the `donor_id` column contains either `"SPECTRUM-OV-070"` or `"SPECTRUM-OV-090"`.

### Rectangle Selection

Select points within a rectangular bounding box defined by min/max coordinates.

```typescript
{
  type: "rectangle",
  bounds: [minX, minY, maxX, maxY]
}
```

**Example:**

```js
{
  type: "rectangle",
  bounds: [-10.5, -8.2, 5.3, 12.7]
}
```

This selects all points where:
- X coordinate is between -10.5 and 5.3
- Y coordinate is between -8.2 and 12.7

### Lasso Selection

Select points within an arbitrary polygonal region.

```typescript
{
  type: "lasso",
  polygon: [[x1, y1], [x2, y2], [x3, y3], ...]
}
```

**Example:**

```js
{
  type: "lasso",
  polygon: [
    [0, 0],
    [10, 5],
    [8, 15],
    [-2, 12]
  ]
}
```

This selects all points inside the polygon defined by the given vertices. The polygon is automatically closed (no need to repeat the first point at the end).

## Origin Security

To prevent unauthorized applications from controlling the viewer, the app validates the origin of incoming postMessage events.

### Configuration

The allowed origin is set via the `VITE_POSTMESSAGE_ORIGIN` environment variable:

| Environment | Configuration | Allowed Origins |
|-------------|--------------|-----------------|
| **Development** | Set in `packages/app/.env` | `*` (all origins accepted) |
| **Production** | Set in build environment (e.g., GitHub Actions workflow) | Specific origin like `https://www.cbioportal.org` |

### Development Setup

The default `.env` file in `packages/app/` contains:

```
VITE_POSTMESSAGE_ORIGIN=*
```

This allows messages from any origin during local development.

### Production Setup

For production builds, set the environment variable to restrict to a specific origin. For example, in your CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
env:
  VITE_POSTMESSAGE_ORIGIN: https://www.cbioportal.org
```

Then when calling `postMessage` from the parent application, use the same origin as the third parameter:

```js
iframe.contentWindow.postMessage(
  { type: "applyConfig", payload: config },
  "https://www.cbioportal.org"  // Must match VITE_POSTMESSAGE_ORIGIN
);
```

### Security Best Practices

- Always set `VITE_POSTMESSAGE_ORIGIN` to a specific origin in production
- Never use `"*"` in production environments
- Ensure the origin parameter in `postMessage` matches the configured allowed origin

## Error Handling

The app handles invalid input gracefully without crashing:

| Error Condition | Behavior |
|----------------|----------|
| Invalid schema (payload doesn't match `FilterSchema`) | Error logged: `[CZL:postMessage] applyConfig failed: <error>` |
| Unknown message type | Warning logged: `[CZL:postMessage] No handler for message type: <type>` |
| Message from unauthorized origin | Warning logged: `[CZL:postMessage] Rejected message from origin: <origin>` |
| Missing required fields | Validation error logged to console |
| Message arrives before data is loaded | Config is queued and applied after initialization (see [Timing & Queuing](#timing--queuing)) |

The viewer will continue to function normally after receiving invalid messages. Check the browser console for error messages if your configuration isn't being applied.

### Debugging Tips

All log messages from this app are prefixed with `[CZL:postMessage]`. Filter your browser console with **CZL** to see only relevant messages.

| Log Message | Meaning |
|-------------|---------|
| `Listener registered, allowedOrigin: ...` | Hook is mounted and listening |
| `Received message: { type, origin, payload }` | A valid envelope was received |
| `Store not ready, queuing config for after initialization` | Config arrived before data loaded — it will be applied automatically |
| `Applying queued config after initialization` | Queued config is now being applied |
| `applyConfig failed: ...` | Config was rejected (check the error message for details) |
| `Rejected message from origin: ...` | Origin didn't match `VITE_POSTMESSAGE_ORIGIN` |
| `No handler for message type: ...` | Received an unrecognized message type |

1. Open the browser console in the iframe's window
2. Filter by `CZL` to see only messages from this app
3. Verify the payload structure matches the schema exactly
4. Check that string values match column/gene names in your data
5. Ensure numeric indices are non-negative integers

## Full Example

Here's a complete HTML page demonstrating how to embed the viewer and send multiple configurations:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cBioPortal Zarr Viewer Integration</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    #zarr-viewer {
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .controls {
      margin-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      margin-right: 10px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>cBioPortal Zarr Viewer Integration Example</h1>

  <div class="controls">
    <button onclick="loadConfig1()">Load Config 1: OV-070</button>
    <button onclick="loadConfig2()">Load Config 2: Multiple Donors</button>
    <button onclick="loadConfig3()">Load Config 3: Gene Expression</button>
  </div>

  <iframe
    id="zarr-viewer"
    src="https://your-zarr-viewer-origin.com"
    width="100%"
    height="600px"
    allow="cross-origin-isolated"
  ></iframe>

  <script>
    const VIEWER_ORIGIN = "https://your-zarr-viewer-origin.com";

    function sendConfig(config) {
      const iframe = document.getElementById("zarr-viewer");
      iframe.contentWindow.postMessage({
        type: "applyConfig",
        payload: config
      }, VIEWER_ORIGIN);
    }

    function loadConfig1() {
      sendConfig({
        defaults: {
          embedding_key: "X_umap50",
          active_tooltips: ["cell_type", "author_sample_id"],
          color_by: { type: "category", value: "cell_type" }
        },
        initial_view: "OV-070 by cell_type",
        saved_views: [
          {
            name: "OV-070 by cell_type",
            selection: {
              target: "donor_id",
              values: ["SPECTRUM-OV-070"]
            }
          }
        ]
      });
    }

    function loadConfig2() {
      sendConfig({
        defaults: {
          embedding_key: "X_umap50",
          active_tooltips: ["cell_type", "author_sample_id", "Phase"]
        },
        initial_view: 0,
        saved_views: [
          {
            name: "OV-090 & OV-022",
            selection: {
              target: "donor_id",
              values: ["SPECTRUM-OV-090", "SPECTRUM-OV-022"]
            },
            color_by: { type: "category", value: "cell_type" }
          },
          {
            name: "OV-041",
            selection: {
              target: "donor_id",
              values: ["SPECTRUM-OV-041"]
            },
            color_by: { type: "category", value: "Phase" }
          }
        ]
      });
    }

    function loadConfig3() {
      sendConfig({
        defaults: {
          embedding_key: "X_umap50",
          active_tooltips: ["cell_type"]
        },
        initial_view: 0,
        saved_views: [
          {
            name: "dapl1 expression (magma)",
            selection: {
              target: "donor_id",
              values: ["SPECTRUM-OV-041"]
            },
            color_by: {
              type: "gene",
              value: "dapl1",
              color_scale: "magma"
            }
          },
          {
            name: "Different region (rectangle)",
            selection: {
              type: "rectangle",
              bounds: [-5, -5, 5, 5]
            },
            color_by: {
              type: "gene",
              value: "dapl1",
              color_scale: "viridis"
            }
          }
        ]
      });
    }

    // Wait for iframe to load before sending initial config
    window.addEventListener('load', function() {
      setTimeout(loadConfig1, 1000);
    });
  </script>
</body>
</html>
```

### Key Points in This Example

1. **Origin Configuration**: The `VIEWER_ORIGIN` constant must match the iframe's `src` and the `VITE_POSTMESSAGE_ORIGIN` environment variable used when building the viewer app.

2. **Multiple Saved Views**: Config 2 demonstrates how to define multiple views that users can switch between in the UI.

3. **Different Selection Types**: Config 3 shows both category-based and rectangle-based selections.

4. **Gene Expression Coloring**: Config 3 demonstrates coloring by gene expression with different color scales.

5. **Timing**: The example waits 1 second after page load before sending the initial config, giving the iframe time to fully initialize. In production, you may want to implement a more robust handshake mechanism.
