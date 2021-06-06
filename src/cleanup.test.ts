import type { Firestore } from "@google-cloud/firestore";
import { mockGoogleCloudFirestore } from "firestore-jest-mock/mocks/googleCloudFirestore";
import {
  mockDelete,
  mockDoc,
  mockUpdate,
} from "firestore-jest-mock/mocks/firestore";
import { deleteChannelData, deleteOrphanedMaps } from "./cleanup";

mockGoogleCloudFirestore({
  database: {
    channels: [
      {
        id: "123",
        base: "123-456-789",
        current: "321-654-987",
        history: ["1", "2", "3"],
      },
      {
        id: "456",
        base: "234-567-890",
        current: "432-765-098",
        history: ["4", "5", "6", "5"],
      },
    ],
    maps: [
      { id: "123-456-789" },
      { id: "321-654-987" },
      { id: "234-567-890" },
      { id: "432-765-098" },
      { id: "1" },
      { id: "7" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
      { id: "5" },
      { id: "6" },
    ],
  },
});

describe("Delete Channel Data", () => {
  const { Firestore } = require("@google-cloud/firestore");
  const firestore = new Firestore();

  const mockStorageDelete = jest.fn();
  const mockGetFile = jest.fn().mockReturnValue({ delete: mockStorageDelete });
  const mockStorage = {
    bucket: jest.fn().mockReturnValue({ file: mockGetFile }),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should delete all firestore documents relating to the channel", async () => {
    //@ts-ignore
    await deleteChannelData(firestore, mockStorage, "456");

    expect(mockDoc).toBeCalledWith("456");
    expect(mockDoc).toBeCalledWith("234-567-890");
    expect(mockDoc).toBeCalledWith("432-765-098");
    expect(mockDoc).toBeCalledWith("4");
    expect(mockDoc).toBeCalledWith("5");
    expect(mockDoc).toBeCalledWith("6");
    expect(mockDelete).toBeCalledTimes(6);
  });

  it("should delete all storage files relating to the channel", async () => {
    //@ts-ignore
    await deleteChannelData(firestore, mockStorage, "456");

    expect(mockGetFile).toBeCalledWith("234-567-890.png");
    expect(mockGetFile).toBeCalledWith("432-765-098.png");
    expect(mockGetFile).toBeCalledWith("4.png");
    expect(mockGetFile).toBeCalledWith("5.png");
    expect(mockGetFile).toBeCalledWith("6.png");
    expect(mockStorageDelete).toBeCalledTimes(5);
  });
});

describe("Delete Orphaned Maps", () => {
  const { Firestore } = require("@google-cloud/firestore");
  const firestore = new Firestore();

  const mockExists = jest.fn();
  const mockStorageDelete = jest.fn();
  const mockGetFile = jest
    .fn()
    .mockReturnValue({ exists: mockExists, delete: mockStorageDelete });
  const mockStorage = {
    bucket: jest.fn().mockReturnValue({ file: mockGetFile }),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("given one of the map IDs is a base image", () => {
    beforeEach(() => {
      mockExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false) // 234-567-890.png doesn't exist
        .mockResolvedValue(true);
    });

    it("should delete the whole channel document", async () => {
      //@ts-ignore
      await deleteOrphanedMaps(firestore, mockStorage);

      // This one is deleted twice, but this isn't an issue.
      expect(mockDoc).toBeCalledWith("234-567-890");

      expect(mockDoc).toBeCalledWith("456");
      expect(mockDoc).toBeCalledWith("432-765-098");
      expect(mockDoc).toBeCalledWith("4");
      expect(mockDoc).toBeCalledWith("5");
      expect(mockDoc).toBeCalledWith("6");

      expect(mockDelete).toBeCalledTimes(7);

      expect(mockStorageDelete).toBeCalledTimes(5);
    });
  });

  describe("given one of the map IDs is the current image", () => {
    beforeEach(() => {
      mockExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false) // 432-765-098.png doesn't exist
        .mockResolvedValue(true);
    });

    it("should delete the whole channel document", async () => {
      //@ts-ignore
      await deleteOrphanedMaps(firestore, mockStorage);

      // This one is deleted twice, but this isn't an issue.
      expect(mockDoc).toBeCalledWith("432-765-098");

      expect(mockDoc).toBeCalledWith("456");
      expect(mockDoc).toBeCalledWith("234-567-890");
      expect(mockDoc).toBeCalledWith("4");
      expect(mockDoc).toBeCalledWith("5");
      expect(mockDoc).toBeCalledWith("6");

      expect(mockDelete).toBeCalledTimes(7);

      expect(mockStorageDelete).toBeCalledTimes(5);
    });
  });

  describe("given any of the map IDs is in the history", () => {
    beforeEach(() => {
      mockExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false) // 1.png doesn't exist
        .mockResolvedValue(true);
    });

    it("should update the history in the document", async () => {
      //@ts-ignore
      await deleteOrphanedMaps(firestore, mockStorage);

      expect(mockDoc).toBeCalledWith("1");
      expect(mockUpdate).toBeCalledWith({ history: ["2", "3"] });

      expect(mockDelete).toBeCalledTimes(1);
      expect(mockStorageDelete).not.toBeCalled();
    });
  });

  describe("given none of the map IDs are in a channel document", () => {
    beforeEach(() => {
      mockExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false) // 7.png doesn't exist
        .mockResolvedValue(true);
    });

    it("should only delete the map document", async () => {
      //@ts-ignore
      await deleteOrphanedMaps(firestore, mockStorage);

      expect(mockDoc).toBeCalledWith("7");
      expect(mockDelete).toBeCalledTimes(1);
      expect(mockStorageDelete).not.toBeCalled();
    });
  });
});
