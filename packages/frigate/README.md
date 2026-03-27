# frigate-sdk

Official JavaScript SDK and CLI for the Frigate explainable AI platform.

## Install

Install in a project:

```bash
npm install frigate-sdk
```

Install globally:

```bash
npm install -g frigate-sdk
```

## Quick start

```js
import { FrigateClient } from "frigate-sdk";

const frigate = new FrigateClient({
  baseUrl: "http://127.0.0.1:8000",
});

const run = await frigate.generate({
  prompt: "Write a crisp launch note for Frigate.",
  mode: "text",
});

console.log(run.output);
```

## CLI

```bash
frigate health
frigate generate --prompt "Design a cockpit dashboard for prompt tracing" --mode image
frigate what-if --original "Write a calm launch note" --modified "Write a sharper enterprise launch note"
frigate sessions --limit 5
frigate dashboard
```

Use `FRIGATE_API_URL` to point the CLI or SDK at a different backend:

```bash
FRIGATE_API_URL=https://your-frigate-api.example.com frigate health
```

## Supported methods

- `health()`
- `generate(payload)`
- `whatIf(payload)`
- `explain(payload)`
- `createMetric(payload)`
- `getMetrics()`
- `listSessions({ limit })`
- `getDashboard()`
