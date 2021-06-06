import { mockGoogleCloudFirestore } from "firestore-jest-mock/mocks/googleCloudFirestore";
import { getChannelsInFirestore, getMapsInFirestore } from "./firestore";

describe("Get documents in Firestore", () => {
  mockGoogleCloudFirestore({
    database: {
      channels: [
        {
          id: "123",
          base: "123-456-789",
          current: "321-654-987",
          history: [],
        },
        {
          id: "456",
          base: "234-567-890",
          current: "432-765-098",
          history: [],
        },
      ],
      maps: [{ id: "321" }, { id: "654" }],
    },
  });

  const { Firestore } = require("@google-cloud/firestore");
  const firestore = new Firestore();

  describe("channels", () => {
    it("should return a list of document IDs", async () => {
      //@ts-ignore
      const result = await getChannelsInFirestore(firestore);

      expect(result).toEqual(["123", "456"]);
    });
  });

  describe("maps", () => {
    it("should return a list of document IDs", async () => {
      //@ts-ignore
      const result = await getMapsInFirestore(firestore);

      expect(result).toEqual(["321", "654"]);
    });
  });
});
