import { getLastPlayedMapForSeries } from "@/lib/tautulli";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    PLEX_BASE_URL: "http://plex.local",
    PLEX_TOKEN: "token",
    PLEX_TV_LIBRARY_SECTION_ID: "2",
    PLEX_COLLECTION_RATING_KEY: "123",
    TAUTULLI_BASE_URL: "http://tautulli.local",
    TAUTULLI_API_KEY: "apikey"
  })
}));

describe("getLastPlayedMapForSeries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queries direct series history by grandparent_rating_key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            result: "success",
            data: {
              data: [{ date: 1713480000, grandparent_rating_key: "4310" }]
            }
          }
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getLastPlayedMapForSeries([
      { ratingKey: "4310", title: "Rosemary & Thyme" }
    ]);

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));

    expect(requestUrl.searchParams.get("grandparent_rating_key")).toBe("4310");
    expect(requestUrl.searchParams.get("rating_key")).toBeNull();
    expect(result.get("4310")).toBe("2024-04-18T22:40:00.000Z");
  });
});
