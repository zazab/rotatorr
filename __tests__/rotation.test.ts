import { aggregateHistoryBySeries, buildSeriesLookup, sortSeriesRotation } from "@/lib/rotation";
import type { SeriesRotationItem, TautulliHistoryEntry } from "@/lib/types";

describe("sortSeriesRotation", () => {
  it("puts never-played items before played items", () => {
    const items: SeriesRotationItem[] = [
      {
        plexRatingKey: "2",
        title: "Played",
        lastPlayedAt: "2025-01-01T00:00:00.000Z",
        playState: "played"
      },
      {
        plexRatingKey: "1",
        title: "Never",
        lastPlayedAt: null,
        playState: "never_played"
      }
    ];

    expect(sortSeriesRotation(items).map((item) => item.title)).toEqual(["Never", "Played"]);
  });

  it("orders played items by the oldest last-played timestamp first", () => {
    const items: SeriesRotationItem[] = [
      {
        plexRatingKey: "1",
        title: "Recent",
        lastPlayedAt: "2025-01-03T00:00:00.000Z",
        playState: "played"
      },
      {
        plexRatingKey: "2",
        title: "Older",
        lastPlayedAt: "2025-01-01T00:00:00.000Z",
        playState: "played"
      }
    ];

    expect(sortSeriesRotation(items).map((item) => item.title)).toEqual(["Older", "Recent"]);
  });

  it("stays stable when timestamps are equal by falling back to title", () => {
    const items: SeriesRotationItem[] = [
      {
        plexRatingKey: "1",
        title: "Zulu",
        lastPlayedAt: "2025-01-01T00:00:00.000Z",
        playState: "played"
      },
      {
        plexRatingKey: "2",
        title: "Alpha",
        lastPlayedAt: "2025-01-01T00:00:00.000Z",
        playState: "played"
      }
    ];

    expect(sortSeriesRotation(items).map((item) => item.title)).toEqual(["Alpha", "Zulu"]);
  });
});

describe("aggregateHistoryBySeries", () => {
  it("collapses multiple entries into the latest timestamp for each series", () => {
    const entries: TautulliHistoryEntry[] = [
      { grandparent_rating_key: "show-1", date: 100 },
      { grandparent_rating_key: "show-1", date: 150 },
      { grandparent_rating_key: "show-2", date: 120 }
    ];

    const aggregated = aggregateHistoryBySeries(
      entries,
      buildSeriesLookup([
        { ratingKey: "show-1", title: "Show One" },
        { ratingKey: "show-2", title: "Show Two" }
      ])
    );

    expect(aggregated.get("show-1")).toBe("1970-01-01T00:02:30.000Z");
    expect(aggregated.get("show-2")).toBe("1970-01-01T00:02:00.000Z");
  });

  it("ignores entries that cannot be matched to a known series", () => {
    const entries: TautulliHistoryEntry[] = [{ grandparent_rating_key: "unknown", date: 100 }];

    const aggregated = aggregateHistoryBySeries(
      entries,
      buildSeriesLookup([{ ratingKey: "show-1", title: "Show One" }])
    );

    expect(aggregated.get("show-1")).toBeUndefined();
  });

  it("matches by title when rating keys do not line up", () => {
    const entries: TautulliHistoryEntry[] = [
      { grandparent_rating_key: "999", grandparent_title: "Show One", date: 150 }
    ];

    const aggregated = aggregateHistoryBySeries(
      entries,
      buildSeriesLookup([{ ratingKey: "show-1", title: "Show One" }])
    );

    expect(aggregated.get("show-1")).toBe("1970-01-01T00:02:30.000Z");
  });
});
