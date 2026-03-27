const DEFAULT_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_API_PREFIX = "/api";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function trimLeadingSlash(value) {
  return value.replace(/^\/+/, "");
}

function buildFetch(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch === "function") {
    return fetch.bind(globalThis);
  }

  throw new Error("Frigate requires a fetch implementation. Use Node.js 18+ or pass fetch in the client options.");
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(raw);
  }

  return raw;
}

export class FrigateError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "FrigateError";
    this.status = options.status ?? null;
    this.data = options.data ?? null;
  }
}

export class FrigateClient {
  constructor(options = {}) {
    this.baseUrl = trimTrailingSlash(options.baseUrl || DEFAULT_BASE_URL);
    this.apiPrefix = options.apiPrefix || DEFAULT_API_PREFIX;
    this.fetch = buildFetch(options.fetch);
    this.headers = { ...(options.headers || {}) };
  }

  buildUrl(path, useApiPrefix = true) {
    const normalizedPath = trimLeadingSlash(path);
    const prefix = useApiPrefix ? trimTrailingSlash(this.apiPrefix) : "";
    return `${this.baseUrl}${prefix ? `/${trimLeadingSlash(prefix)}` : ""}/${normalizedPath}`;
  }

  async request(path, options = {}) {
    const {
      useApiPrefix = true,
      method = "GET",
      query,
      body,
      headers,
    } = options;

    const url = new URL(this.buildUrl(path, useApiPrefix));
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const requestHeaders = {
      ...this.headers,
      ...(headers || {}),
    };

    const init = {
      method,
      headers: requestHeaders,
    };

    if (body !== undefined) {
      if (!("Content-Type" in requestHeaders) && !("content-type" in requestHeaders)) {
        requestHeaders["Content-Type"] = "application/json";
      }
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await this.fetch(url, init);
    const data = await parseResponse(response);

    if (!response.ok) {
      const message =
        typeof data === "string"
          ? data
          : data?.detail || `Frigate request failed with status ${response.status}`;
      throw new FrigateError(message, {
        status: response.status,
        data,
      });
    }

    return data;
  }

  health() {
    return this.request("health", { useApiPrefix: false });
  }

  generate(payload) {
    return this.request("generate", {
      method: "POST",
      body: payload,
    });
  }

  whatIf(payload) {
    return this.request("what-if", {
      method: "POST",
      body: payload,
    });
  }

  explain(payload) {
    return this.request("explain", {
      method: "POST",
      body: payload,
    });
  }

  createMetric(payload) {
    return this.request("metrics", {
      method: "POST",
      body: payload,
    });
  }

  getMetrics() {
    return this.request("metrics");
  }

  listSessions(options = {}) {
    return this.request("sessions", {
      query: {
        limit: options.limit,
      },
    });
  }

  sessions(options = {}) {
    return this.listSessions(options);
  }

  getDashboard() {
    return this.request("dashboard");
  }

  dashboard() {
    return this.getDashboard();
  }
}

export function createFrigateClient(options = {}) {
  return new FrigateClient(options);
}

export default FrigateClient;
