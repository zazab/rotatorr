import { RefreshButton } from "@/components/refresh-button";
import { formatDateTime } from "@/lib/rotation";
import { SeriesRotationList } from "@/components/series-rotation-list";
import { getSeriesRotation } from "@/lib/rotation-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, warnings, collectionTitle, refreshedAt } = await getSeriesRotation();

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero">
          <div>
            <p className="eyebrow">TV Rotation</p>
            <h1>{collectionTitle ?? "Configured Plex Collection"}</h1>
            <p className="muted">
              Новые сверху, остальное отсортировано по дате последнего просмотра,
              старые сверху.
            </p>
          </div>
          <div className="hero-actions">
            <RefreshButton />
            <p className="timestamp">Last refreshed: {formatDateTime(refreshedAt)}</p>
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="warning-banner" role="status">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}

        <SeriesRotationList items={items} />
      </section>
    </main>
  );
}
