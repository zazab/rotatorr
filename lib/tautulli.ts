import { getEnv } from "@/lib/env";
import { aggregateHistoryBySeries, buildSeriesLookup } from "@/lib/rotation";
import type { TautulliHistoryEntry } from "@/lib/types";

type TautulliHistoryResponse = {
  response?: {
    result?: string;
    data?: {
      data?: TautulliHistoryEntry[];
      recordsFiltered?: number;
      recordsTotal?: number;
    };
    message?: string;
  };
};

const PAGE_SIZE = 200;
const MAX_PAGES = 10;
const DIRECT_LOOKUP_BATCH_SIZE = 5;

export async function getLastPlayedMapForSeries(
  series: Array<{
    ratingKey: string;
    title: string;
  }>
) {
  const env = getEnv();
  const seriesLookup = buildSeriesLookup(series);
  const directMatches = await getDirectHistoryMatches(series, env);
  const unresolvedSeries = series.filter((item) => !directMatches.has(item.ratingKey));

  if (unresolvedSeries.length === 0) {
    return directMatches;
  }

  const historyEntries: TautulliHistoryEntry[] = [];
  const foundKeys = new Set<string>(directMatches.keys());

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const pageEntries = await fetchHistoryPage({
      env,
      start: page * PAGE_SIZE,
      length: PAGE_SIZE
    });
    historyEntries.push(...pageEntries);

    const aggregatedPage = aggregateHistoryBySeries(pageEntries, seriesLookup);
    for (const key of aggregatedPage.keys()) {
      foundKeys.add(key);
    }

    if (pageEntries.length < PAGE_SIZE || foundKeys.size === seriesLookup.ratingKeys.size) {
      break;
    }
  }

  const fallbackMatches = aggregateHistoryBySeries(historyEntries, seriesLookup);

  return new Map([...fallbackMatches, ...directMatches]);
}

async function getDirectHistoryMatches(
  series: Array<{
    ratingKey: string;
    title: string;
  }>,
  env: ReturnType<typeof getEnv>
) {
  const matches = new Map<string, string>();

  for (let index = 0; index < series.length; index += DIRECT_LOOKUP_BATCH_SIZE) {
    const batch = series.slice(index, index + DIRECT_LOOKUP_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const entries = await fetchHistoryPage({
          env,
          length: 1,
          grandparentRatingKey: item.ratingKey
        });

        const entry = entries[0];
        if (!entry) {
          return null;
        }

        return [item.ratingKey, normalizeHistoryDate(entry.date)] as const;
      })
    );

    for (const result of batchResults) {
      if (!result) {
        continue;
      }

      matches.set(result[0], result[1]);
    }
  }

  return matches;
}

async function fetchHistoryPage({
  env,
  start,
  length,
  ratingKey,
  grandparentRatingKey
}: {
  env: ReturnType<typeof getEnv>;
  start?: number;
  length: number;
  ratingKey?: string;
  grandparentRatingKey?: string;
}) {
  const url = new URL(`${env.TAUTULLI_BASE_URL}/api/v2`);
  url.searchParams.set("apikey", env.TAUTULLI_API_KEY);
  url.searchParams.set("cmd", "get_history");
  url.searchParams.set("media_type", "episode");
  url.searchParams.set("length", String(length));
  url.searchParams.set("order_column", "date");
  url.searchParams.set("order_dir", "desc");

  if (start !== undefined) {
    url.searchParams.set("start", String(start));
  }

  if (ratingKey) {
    url.searchParams.set("rating_key", ratingKey);
  }

  if (grandparentRatingKey) {
    url.searchParams.set("grandparent_rating_key", grandparentRatingKey);
  }

  if (env.PLEX_TV_LIBRARY_SECTION_ID) {
    url.searchParams.set("section_id", env.PLEX_TV_LIBRARY_SECTION_ID);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Tautulli history request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as TautulliHistoryResponse;

  if (payload.response?.result !== "success") {
    throw new Error(payload.response?.message ?? "Tautulli returned an unsuccessful response.");
  }

  return payload.response?.data?.data ?? [];
}

function normalizeHistoryDate(date: number | string) {
  const numeric = typeof date === "string" ? Number(date) : date;
  return new Date(numeric * 1000).toISOString();
}
