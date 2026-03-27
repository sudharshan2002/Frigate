#!/usr/bin/env node

import { FrigateClient, FrigateError } from "./index.js";

function printHelp() {
  console.log(`Frigate CLI

Usage:
  frigate <command> [options]

Commands:
  health
  generate --prompt "..." [--mode text|image] [--source composer|what-if|api]
  what-if --original "..." --modified "..." [--mode text|image]
  explain --prompt "..." --output "..."
  sessions [--limit 10]
  dashboard
  metrics

Global options:
  --base-url <url>     Override the backend URL. Defaults to FRIGATE_API_URL or http://127.0.0.1:8000
  --api-prefix <path>  Override the API prefix. Defaults to /api
  --json               Print raw JSON
  --help               Show this help
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const result = {
    _: [],
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token) {
      continue;
    }

    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }

    const key = token.slice(2);
    if (key === "json" || key === "help") {
      result[key] = true;
      continue;
    }

    const value = args.shift();
    if (value === undefined) {
      throw new Error(`Missing value for --${key}`);
    }
    result[key] = value;
  }

  return result;
}

function ensure(flagValue, message) {
  if (!flagValue) {
    throw new Error(message);
  }
  return flagValue;
}

function maybeReference(options, prefix = "") {
  const url = options[`${prefix}reference-url`];
  const dataUrl = options[`${prefix}reference-data-url`];

  if (!url && !dataUrl) {
    return null;
  }

  return {
    url: url || null,
    data_url: dataUrl || null,
    mime_type: options[`${prefix}reference-mime-type`] || null,
    name: options[`${prefix}reference-name`] || null,
  };
}

function printResult(data, asJson) {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (typeof data === "string") {
    console.log(data);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const command = options._[0];

  if (!command || options.help) {
    printHelp();
    return;
  }

  const client = new FrigateClient({
    baseUrl: options["base-url"] || process.env.FRIGATE_API_URL || "http://127.0.0.1:8000",
    apiPrefix: options["api-prefix"] || "/api",
  });

  let result;

  switch (command) {
    case "health":
      result = await client.health();
      break;
    case "generate":
      result = await client.generate({
        prompt: ensure(options.prompt, "The generate command requires --prompt."),
        mode: options.mode || "text",
        source: options.source || "api",
        reference_image: maybeReference(options),
      });
      break;
    case "what-if":
      result = await client.whatIf({
        original_prompt: ensure(options.original, "The what-if command requires --original."),
        modified_prompt: ensure(options.modified, "The what-if command requires --modified."),
        mode: options.mode || "text",
        original_reference_image: maybeReference(options, "original-"),
        modified_reference_image: maybeReference(options, "modified-"),
      });
      break;
    case "explain":
      result = await client.explain({
        prompt: ensure(options.prompt, "The explain command requires --prompt."),
        output: ensure(options.output, "The explain command requires --output."),
      });
      break;
    case "sessions":
      result = await client.listSessions({
        limit: options.limit ? Number(options.limit) : undefined,
      });
      break;
    case "dashboard":
      result = await client.getDashboard();
      break;
    case "metrics":
      result = await client.getMetrics();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  printResult(result, Boolean(options.json));
}

main().catch((error) => {
  if (error instanceof FrigateError) {
    console.error(`Frigate API error${error.status ? ` (${error.status})` : ""}: ${error.message}`);
    if (error.data) {
      console.error(JSON.stringify(error.data, null, 2));
    }
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});
