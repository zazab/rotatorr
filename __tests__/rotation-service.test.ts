import { getSeriesRotation } from "@/lib/rotation-service";

vi.mock("@/lib/plex", () => ({
  getCollectionItems: vi.fn()
}));

vi.mock("@/lib/tautulli", () => ({
  getLastPlayedMapForSeries: vi.fn()
}));

const { getCollectionItems } = await import("@/lib/plex");
const { getLastPlayedMapForSeries } = await import("@/lib/tautulli");

describe("getSeriesRotation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns sorted collection items with poster proxy URLs", async () => {
    vi.mocked(getCollectionItems).mockResolvedValue({
      title: "Rotation",
      items: [
        {
          ratingKey: "show-2",
          title: "Played More Recently",
          thumb: "/library/metadata/2/thumb/1",
          leafCount: 12,
          viewedLeafCount: 12,
          type: "show"
        },
        {
          ratingKey: "show-1",
          title: "Never Played",
          thumb: "/library/metadata/1/thumb/1",
          leafCount: 10,
          viewedLeafCount: 2,
          type: "show"
        }
      ]
    });

    vi.mocked(getLastPlayedMapForSeries).mockResolvedValue(
      new Map([["show-2", "2025-01-02T00:00:00.000Z"]])
    );

    const result = await getSeriesRotation();

    expect(result.collectionTitle).toBe("Rotation");
    expect(result.items.map((item) => item.title)).toEqual(["Never Played", "Played More Recently"]);
    expect(result.items[0]?.playState).toBe("never_played");
    expect(result.items[1]?.posterUrl).toBe(
      "/api/poster?path=%2Flibrary%2Fmetadata%2F2%2Fthumb%2F1"
    );
    expect(getLastPlayedMapForSeries).toHaveBeenCalledWith([
      { ratingKey: "show-2", title: "Played More Recently" },
      { ratingKey: "show-1", title: "Never Played" }
    ]);
  });

  it("keeps Plex results when Tautulli is unavailable", async () => {
    vi.mocked(getCollectionItems).mockResolvedValue({
      title: "Rotation",
      items: [
        {
          ratingKey: "show-1",
          title: "Fallback Show",
          type: "show"
        }
      ]
    });

    vi.mocked(getLastPlayedMapForSeries).mockRejectedValue(new Error("Tautulli offline"));

    const result = await getSeriesRotation();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.lastPlayedAt).toBeNull();
    expect(result.warnings[0]).toContain("Tautulli offline");
  });
});
