import { getCollectionItems } from "@/lib/plex";
import { sortSeriesRotation } from "@/lib/rotation";
import { getLastPlayedMapForSeries } from "@/lib/tautulli";
import type { SeriesRotationItem } from "@/lib/types";

export async function getSeriesRotation() {
  const warnings: string[] = [];
  const collection = await getCollectionItems();
  let lastPlayedMap = new Map<string, string>();
  const seriesKeys = collection.items.map((item) => item.ratingKey);

  if (seriesKeys.length > 0) {
    try {
      lastPlayedMap = await getLastPlayedMapForSeries(
        collection.items.map((item) => ({
          ratingKey: item.ratingKey,
          title: item.title
        }))
      );
    } catch (error) {
      warnings.push(
        error instanceof Error
          ? `Tautulli history is unavailable right now: ${error.message}`
          : "Tautulli history is unavailable right now."
      );
    }
  }

  const items = sortSeriesRotation(
    collection.items.map<SeriesRotationItem>((item) => {
      const lastPlayedAt = lastPlayedMap.get(item.ratingKey) ?? null;
      const posterUrl = item.thumb
        ? `/api/poster?path=${encodeURIComponent(item.thumb)}`
        : undefined;

      return {
        plexRatingKey: item.ratingKey,
        title: item.title,
        posterUrl,
        lastPlayedAt,
        playState: lastPlayedAt ? "played" : "never_played",
        episodeCount: item.leafCount,
        watchedEpisodeCount: item.viewedLeafCount
      };
    })
  );

  return {
    items,
    warnings,
    collectionTitle: collection.title,
    refreshedAt: new Date().toISOString()
  };
}
