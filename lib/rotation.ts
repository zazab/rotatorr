import type { SeriesRotationItem, TautulliHistoryEntry } from "@/lib/types";

type SeriesLookup = {
  ratingKeys: Set<string>;
  titleToRatingKey: Map<string, string>;
};

export function sortSeriesRotation(items: SeriesRotationItem[]) {
  return [...items].sort((left, right) => {
    if (left.playState !== right.playState) {
      return left.playState === "never_played" ? -1 : 1;
    }

    if (left.lastPlayedAt === right.lastPlayedAt) {
      return left.title.localeCompare(right.title);
    }

    if (!left.lastPlayedAt) {
      return -1;
    }

    if (!right.lastPlayedAt) {
      return 1;
    }

    return new Date(left.lastPlayedAt).getTime() - new Date(right.lastPlayedAt).getTime();
  });
}

export function formatLastPlayedLabel(lastPlayedAt: string | null) {
  if (!lastPlayedAt) {
    return "Never played";
  }

  return `Last played ${new Date(lastPlayedAt).toLocaleString()}`;
}

export function aggregateHistoryBySeries(
  entries: TautulliHistoryEntry[],
  seriesLookup: SeriesLookup
) {
  const latestBySeries = new Map<string, string>();

  for (const entry of entries) {
    const seriesKey = resolveSeriesKey(entry, seriesLookup);
    if (!seriesKey) {
      continue;
    }

    const isoTimestamp = normalizeHistoryDate(entry.date);
    const previous = latestBySeries.get(seriesKey);

    if (!previous || new Date(isoTimestamp).getTime() > new Date(previous).getTime()) {
      latestBySeries.set(seriesKey, isoTimestamp);
    }
  }

  return latestBySeries;
}

export function buildSeriesLookup(
  series: Array<{
    ratingKey: string;
    title: string;
  }>
) {
  const ratingKeys = new Set<string>();
  const titleToRatingKey = new Map<string, string>();

  for (const item of series) {
    const normalizedRatingKey = normalizeIdentifier(item.ratingKey);
    const normalizedTitle = normalizeTitle(item.title);

    if (!normalizedRatingKey || !normalizedTitle) {
      continue;
    }

    ratingKeys.add(normalizedRatingKey);
    titleToRatingKey.set(normalizedTitle, normalizedRatingKey);
  }

  return {
    ratingKeys,
    titleToRatingKey
  };
}

function resolveSeriesKey(entry: TautulliHistoryEntry, seriesLookup: SeriesLookup) {
  const candidates = [entry.grandparent_rating_key, entry.parent_rating_key, entry.rating_key];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeIdentifier(candidate);
    if (normalizedCandidate && seriesLookup.ratingKeys.has(normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  const titleCandidates = [entry.grandparent_title, entry.original_title, entry.title];

  for (const candidate of titleCandidates) {
    const normalizedTitle = normalizeTitle(candidate);
    if (!normalizedTitle) {
      continue;
    }

    const ratingKey = seriesLookup.titleToRatingKey.get(normalizedTitle);
    if (ratingKey) {
      return ratingKey;
    }
  }

  return undefined;
}

function normalizeHistoryDate(date: number | string) {
  const numeric = typeof date === "string" ? Number(date) : date;
  return new Date(numeric * 1000).toISOString();
}

function normalizeIdentifier(value: string | number | undefined) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function normalizeTitle(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value.trim().toLocaleLowerCase();
}
