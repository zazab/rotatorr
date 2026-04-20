import { getConfig } from "@/lib/config";
import type { PlexCollectionItem } from "@/lib/types";

type PlexMetadataResponse = {
  MediaContainer?: {
    Metadata?: Array<{
      ratingKey?: string;
      title?: string;
      thumb?: string;
      leafCount?: number;
      viewedLeafCount?: number;
      type?: string;
    }>;
    title1?: string;
    title2?: string;
  };
};

export function plexHeaders() {
  const config = getConfig();

  return {
    Accept: "application/json",
    "X-Plex-Token": config.PLEX_TOKEN
  };
}

export function toPlexUrl(path: string) {
  return `${getConfig().PLEX_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getCollectionItems() {
  const config = getConfig();
  const response = await fetch(
    toPlexUrl(`/library/collections/${config.PLEX_COLLECTION_RATING_KEY}/children?includeGuids=1`),
    {
      headers: plexHeaders(),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Plex collection request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as PlexMetadataResponse;
  const metadata = payload.MediaContainer?.Metadata ?? [];
  const collectionTitle =
    (await getCollectionTitle(config.PLEX_COLLECTION_RATING_KEY)) ??
    payload.MediaContainer?.title2 ??
    payload.MediaContainer?.title1 ??
    null;

  const items: PlexCollectionItem[] = metadata
    .filter((item) => item.type === "show" && item.ratingKey && item.title)
    .map((item) => ({
      ratingKey: item.ratingKey!,
      title: item.title!,
      thumb: item.thumb,
      leafCount: item.leafCount,
      viewedLeafCount: item.viewedLeafCount,
      type: item.type ?? "show"
    }));

  return {
    title: collectionTitle,
    items
  };
}

async function getCollectionTitle(ratingKey: string) {
  try {
    const response = await fetch(toPlexUrl(`/library/metadata/${ratingKey}`), {
      headers: plexHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as PlexMetadataResponse;

    return payload.MediaContainer?.Metadata?.[0]?.title ?? null;
  } catch {
    return null;
  }
}

export async function markSeriesUnwatched(ratingKey: string) {
  const response = await fetch(
    toPlexUrl(`/:/unscrobble?key=${encodeURIComponent(ratingKey)}&identifier=com.plexapp.plugins.library`),
    {
      method: "GET",
      headers: plexHeaders(),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Plex unscrobble failed with status ${response.status}.`);
  }
}
