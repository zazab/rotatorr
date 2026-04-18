export type SeriesRotationItem = {
  plexRatingKey: string;
  title: string;
  posterUrl?: string;
  lastPlayedAt: string | null;
  playState: "never_played" | "played";
  episodeCount?: number;
  watchedEpisodeCount?: number;
};

export type PlexCollectionItem = {
  ratingKey: string;
  title: string;
  thumb?: string;
  leafCount?: number;
  viewedLeafCount?: number;
  type: string;
};

export type TautulliHistoryEntry = {
  date: number | string;
  grandparent_rating_key?: string | number;
  parent_rating_key?: string | number;
  rating_key?: string | number;
  media_type?: string;
  title?: string;
  grandparent_title?: string;
  original_title?: string;
};
