import { RefreshButton } from "@/components/refresh-button";
import { formatDateTime } from "@/lib/rotation";
import { SeriesRotationList } from "@/components/series-rotation-list";
import { getSeriesRotation } from "@/lib/rotation-service";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { items, warnings, collectionTitle, refreshedAt } = await getSeriesRotation();

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero">
          <div className="hero-top-row">
            <p className="eyebrow">rotatorr</p>
            <div className="hero-action-row">
              <ThemeToggle />
              <RefreshButton />
            </div>
          </div>
          <div className="hero-copy">
            <h1>{collectionTitle ?? "Configured Plex Collection"}</h1>
            <p className="muted">
              Новые сверху, остальное отсортировано по дате последнего просмотра,
              старые сверху.
            </p>
          </div>
          <div className="hero-actions">
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
