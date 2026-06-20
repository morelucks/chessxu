/**
 * Dune Analytics API Service
 *
 * Lightweight client for executing and fetching Dune query results.
 * Used by the AnalyticsDashboard to display live metrics alongside
 * the embedded Dune iframe.
 *
 * Environment variable: VITE_DUNE_API_KEY
 *
 * @see https://docs.dune.com/api-reference/overview
 * @see https://github.com/morelucks/chessxu/issues/163
 */

const DUNE_API_BASE = 'https://api.dune.com/api/v1';

/**
 * Returns the Dune API key from the environment, or null if unset.
 */
function getApiKey(): string | null {
  return import.meta.env.VITE_DUNE_API_KEY ?? null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DuneExecutionResult<T = Record<string, unknown>> {
  execution_id: string;
  query_id: number;
  state: 'QUERY_STATE_PENDING' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_FAILED';
  result?: {
    rows: T[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
    };
  };
}

export interface DuneQueryStatus {
  execution_id: string;
  state: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function duneRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'VITE_DUNE_API_KEY is not set. Add it to your .env file to use the Dune API.',
    );
  }

  const res = await fetch(`${DUNE_API_BASE}${path}`, {
    ...options,
    headers: {
      'X-Dune-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Dune API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Execute a saved Dune query and return the execution ID.
 * Results are fetched separately via `getQueryResults`.
 */
export async function executeQuery(
  queryId: number,
  params?: Record<string, string | number>,
): Promise<string> {
  const body = params ? { query_parameters: params } : undefined;

  const data = await duneRequest<{ execution_id: string }>(
    `/query/${queryId}/execute`,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  return data.execution_id;
}

/**
 * Poll until the execution is complete and return the result rows.
 */
export async function getQueryResults<T = Record<string, unknown>>(
  executionId: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<DuneExecutionResult<T>> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const data = await duneRequest<DuneExecutionResult<T>>(
      `/execution/${executionId}/results`,
    );

    if (
      data.state === 'QUERY_STATE_COMPLETED' ||
      data.state === 'QUERY_STATE_FAILED'
    ) {
      return data;
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Dune query execution ${executionId} timed out after ${maxAttempts} attempts.`);
}

/**
 * Convenience wrapper: execute a query and wait for results.
 */
export async function executeAndFetch<T = Record<string, unknown>>(
  queryId: number,
  params?: Record<string, string | number>,
): Promise<T[]> {
  const executionId = await executeQuery(queryId, params);
  const result = await getQueryResults<T>(executionId);

  if (result.state === 'QUERY_STATE_FAILED') {
    throw new Error(`Dune query ${queryId} failed.`);
  }

  return result.result?.rows ?? [];
}

/**
 * Fetch the latest cached results without re-executing the query.
 * This is faster and does not consume execution credits.
 */
export async function getLatestResults<T = Record<string, unknown>>(
  queryId: number,
): Promise<T[]> {
  const data = await duneRequest<DuneExecutionResult<T>>(
    `/query/${queryId}/results`,
  );

  return data.result?.rows ?? [];
}
