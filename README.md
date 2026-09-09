# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Grafana embedding

The SHMS Grafana page embeds the dashboard at `http://localhost:3000`. Enable anonymous viewer access and iframe embedding in Grafana's `grafana.ini`:

```ini
[security]
allow_embedding = true

[auth.anonymous]
enabled = true
org_role = Viewer

[server]
domain = localhost
root_url = http://localhost:3000/
```

Restart Grafana after changing these settings. The React app obtains the dashboard `/d/ad5x2s5/shms` URL from `/api/grafana/embed-url` and adds the selected server and time range as URL parameters.

## Windows Exporter process collector

The dashboard's Top CPU Consuming Processes panel requires the Windows Exporter `process` collector. Reinstall or update the Windows Exporter service with:

```powershell
windows_exporter.exe --collectors.enabled="cpu,cs,logical_disk,memory,net,os,service,system,process"
```

Restart the service, then verify the collector in Prometheus:

```promql
windows_exporter_collector_success{collector="process"}
{__name__=~"windows_process.*"}
```

The first query should return `1`. The second should return process metrics including `windows_process_cpu_time_total`.
