import { getChannelsInFirestore, getMapsInFirestore } from "./firestore";

describe("Get documents in Firestore", () => {
  const mockListChannels = jest
    .fn()
    .mockResolvedValue([{ id: "123" }, { id: "456" }]);

  const mockListMaps = jest
    .fn()
    .mockResolvedValue([{ id: "321" }, { id: "654" }]);

  const mockFirestore = {
    collection: (name: string) => {
      if (name === "channels") {
        return {
          listDocuments: mockListChannels,
        };
      } else {
        return {
          listDocuments: mockListMaps,
        };
      }
    },
  };

  beforeEach(() => {});

  describe("channels", () => {
    it("should return a list of document IDs", async () => {
      //@ts-ignore
      const result = await getChannelsInFirestore(mockFirestore);

      expect(result).toEqual(["123", "456"]);
    });
  });

  describe("maps", () => {
    it("should return a list of document IDs", async () => {
      //@ts-ignore
      const result = await getMapsInFirestore(mockFirestore);

      expect(result).toEqual(["321", "654"]);
    });
  });
});
