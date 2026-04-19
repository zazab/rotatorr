import Image from "next/image";
import { MarkUnwatchedButton } from "@/components/mark-unwatched-button";
import type { SeriesRotationItem } from "@/lib/types";
import { formatLastPlayedLabel } from "@/lib/rotation";

type SeriesRotationListProps = {
  items: SeriesRotationItem[];
};

export function SeriesRotationList({ items }: SeriesRotationListProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>No series found</h2>
        <p>
          The configured Plex collection is empty or no TV shows were returned from the collection
          endpoint.
        </p>
      </div>
    );
  }

  return (
    <div className="series-grid">
      {items.map((item, index) => (
        <article key={item.plexRatingKey} className="series-card">
          <div className="series-rank">{index + 1}</div>
          <div className="series-poster-wrap">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={`${item.title} poster`}
                className="series-poster"
                width={124}
                height={186}
                loading="lazy"
              />
            ) : (
              <div className="series-poster placeholder-poster">No poster</div>
            )}
          </div>
          <div className="series-content">
            <div className="series-heading">
              <h2>{item.title}</h2>
              <div className="series-meta">
                <p className="series-state">
                  {item.playState === "never_played" ? "Never played" : "In rotation"}
                </p>
                <p className="series-last-played">{formatLastPlayedLabel(item.lastPlayedAt)}</p>
              </div>
            </div>
            <dl className="series-metrics">
              <div>
                <dt>Total episodes</dt>
                <dd>{item.episodeCount ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Watched episodes</dt>
                <dd>{item.watchedEpisodeCount ?? "Unknown"}</dd>
              </div>
            </dl>
            <MarkUnwatchedButton ratingKey={item.plexRatingKey} title={item.title} />
          </div>
        </article>
      ))}
    </div>
  );
}
