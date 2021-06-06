import { Client, Channel } from "discord.js";
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

describe("Function Trigger", () => {
  const mockLogin = jest.fn();

  mockFirestore.mockImplementation(() => ({} as unknown as Firestore));
  mockStorage.mockImplementation(() => ({} as unknown as Storage));

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.DISCORD_TOKEN = "token";
  });

  describe("given all channels exist", () => {
    beforeEach(() => {
      const mockChannels = [
        {
          id: "1234",
        },
        {
          id: "5678",
        },
        {
          id: "9876",
        },
      ];
      mockClient.mockImplementation(() => ({
        login: mockLogin,
        //@ts-ignore
        channels: { cache: mockChannels },
      }));
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
      const mockChannels = [
        {
          id: "1234",
        },
        {
          id: "9876",
        },
      ];
      mockClient.mockImplementation(() => ({
        login: mockLogin,
        //@ts-ignore
        channels: { cache: mockChannels },
      }));
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
      const mockChannels = [
        {
          id: "9876",
        },
      ];
      mockClient.mockImplementation(() => ({
        login: mockLogin,
        //@ts-ignore
        channels: { cache: mockChannels },
      }));
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
