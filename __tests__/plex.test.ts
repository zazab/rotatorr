import { getCollectionItems } from "@/lib/plex";

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(() => ({
    PLEX_BASE_URL: "http://plex.test:32400",
    PLEX_TOKEN: "plex-token",
    PLEX_COLLECTION_RATING_KEY: "12345",
    TAUTULLI_BASE_URL: "http://tautulli.test:8181",
    TAUTULLI_API_KEY: "tautulli-token"
  }))
}));

describe("getCollectionItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers collection metadata over children response titles", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            title1: "TV Shows",
            title2: "Children Response Title",
            Metadata: [
              {
                ratingKey: "show-1",
                title: "Example Show",
                type: "show"
              }
            ]
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            Metadata: [
              {
                ratingKey: "12345",
                title: "Rotation"
              }
            ]
          }
        })
      } as Response);

    const result = await getCollectionItems();

    expect(result.title).toBe("Rotation");
    expect(result.items).toEqual([
      {
        ratingKey: "show-1",
        title: "Example Show",
        thumb: undefined,
        leafCount: undefined,
        viewedLeafCount: undefined,
        type: "show"
      }
    ]);
  });

  it("falls back to children response titles when metadata lookup fails", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            title1: "TV Shows",
            title2: "Rotation",
            Metadata: []
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: false
      } as Response);

    const result = await getCollectionItems();

    expect(result.title).toBe("Rotation");
  });

  it("falls back to children response titles when metadata lookup rejects", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            title1: "TV Shows",
            title2: "Rotation",
            Metadata: []
          }
        })
      } as Response)
      .mockRejectedValueOnce(new Error("Plex metadata unavailable"));

    const result = await getCollectionItems();

    expect(result.title).toBe("Rotation");
  });

  it("falls back to children response titles when metadata response is malformed", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            title1: "TV Shows",
            title2: "Rotation",
            Metadata: []
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        }
      } as unknown as Response);

    const result = await getCollectionItems();

    expect(result.title).toBe("Rotation");
  });

  it("falls back to collection metadata when the children response has no title", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            Metadata: [
              {
                ratingKey: "show-1",
                title: "Example Show",
                type: "show"
              }
            ]
          }
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          MediaContainer: {
            Metadata: [
              {
                ratingKey: "12345",
                title: "Rotation"
              }
            ]
          }
        })
      } as Response);

    const result = await getCollectionItems();

    expect(result.title).toBe("Rotation");
  });
});
