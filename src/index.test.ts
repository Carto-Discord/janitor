import { Client } from "discord.js";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { getChannelsInFirestore } from "./firestore";
import { deleteChannelData, deleteOrphanedMaps } from "./cleanup";
import { trigger } from ".";

jest.mock("discord.js");
jest.mock("@google-cloud/firestore");
jest.mock("@google-cloud/storage");
jest.mock("./firestore");
jest.mock("./cleanup");

const mockClient = Client as jest.MockedClass<typeof Client>;
const mockFirestore = Firestore as jest.MockedClass<typeof Firestore>;
const mockStorage = Storage as jest.MockedClass<typeof Storage>;
const mockGetChannelsInFirestore =
  getChannelsInFirestore as jest.MockedFunction<typeof getChannelsInFirestore>;
const mockDeleteChannelData = deleteChannelData as jest.MockedFunction<
  typeof deleteChannelData
>;
const mockDeleteOrphanedMaps = deleteOrphanedMaps as jest.MockedFunction<
  typeof deleteOrphanedMaps
>;

jest.spyOn(console, "log").mockImplementation(jest.fn());

describe("Function Trigger", () => {
  const mockLogin = jest.fn();
  const mockFetch = jest.fn();

  mockFirestore.mockImplementation(() => ({} as unknown as Firestore));
  mockStorage.mockImplementation(() => ({} as unknown as Storage));

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient.mockImplementation(() => ({
      login: mockLogin,
      //@ts-ignore
      channels: { fetch: mockFetch },
    }));

    process.env.DISCORD_TOKEN = "token";
  });

  describe("given all channels exist", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ id: "1234" });
      mockGetChannelsInFirestore.mockResolvedValue(["1234", "5678"]);
    });

    it("should not call deleteChannelData", async () => {
      await trigger({}, undefined);

      expect(mockLogin).toBeCalledWith("token");
      expect(mockGetChannelsInFirestore).toBeCalledTimes(1);
      expect(mockDeleteChannelData).not.toBeCalled();
      expect(mockDeleteOrphanedMaps).toBeCalledTimes(1);
    });
  });

  describe("given only some channels exist", () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({ id: "1234" })
        .mockRejectedValueOnce({ id: "5678" });
      mockGetChannelsInFirestore.mockResolvedValue(["1234", "5678"]);
    });

    it("should call deleteChannelData", async () => {
      await trigger({}, undefined);

      expect(mockLogin).toBeCalledWith("token");
      expect(mockGetChannelsInFirestore).toBeCalledTimes(1);
      expect(mockDeleteChannelData).toBeCalledTimes(1);
      expect(mockDeleteChannelData).toBeCalledWith({}, {}, "5678");
      expect(mockDeleteOrphanedMaps).toBeCalledTimes(1);
    });
  });

  describe("given none of the stored channels exist", () => {
    beforeEach(() => {
      mockFetch
        .mockRejectedValueOnce({ id: "1234" })
        .mockRejectedValueOnce({ id: "5678" });
      mockGetChannelsInFirestore.mockResolvedValue(["1234", "5678"]);
    });

    it("should call deleteChannelData", async () => {
      await trigger({}, undefined);

      expect(mockLogin).toBeCalledWith("token");
      expect(mockGetChannelsInFirestore).toBeCalledTimes(1);
      expect(mockDeleteChannelData).toBeCalledTimes(2);
      expect(mockDeleteChannelData).toBeCalledWith({}, {}, "1234");
      expect(mockDeleteChannelData).toBeCalledWith({}, {}, "5678");
      expect(mockDeleteOrphanedMaps).toBeCalledTimes(1);
    });
  });
});
