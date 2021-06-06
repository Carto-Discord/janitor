import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { Client } from "discord.js";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { getChannelsInFirestore } from "./firestore";
import { deleteChannelData, deleteOrphanedMaps } from "./cleanup";

export const trigger: EventFunction = async (_data, _context) => {
  const client = new Client();
  const firestore = new Firestore();
  const storage = new Storage();

  client.login(process.env.DISCORD_TOKEN);

  const channelsToFind = await getChannelsInFirestore(firestore);

  await Promise.all(
    channelsToFind.map((channelId) => {
      const channelExists = client.channels.cache.find(
        (channel) => channel.id === channelId
      );

      if (!channelExists) {
        return deleteChannelData(firestore, storage, channelId);
      }
    })
  );

  await deleteOrphanedMaps(firestore, storage);
};
