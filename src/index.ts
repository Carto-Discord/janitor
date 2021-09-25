import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { Client, Intents } from "discord.js";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { getChannelsInFirestore } from "./firestore";
import { deleteChannelData, deleteOrphanedMaps } from "./cleanup";

export const test: EventFunction = async (_data, _context) => {
  const firestore = new Firestore();
  const storage = new Storage();

  await firestore
    .collection("channels")
    .doc("new-doc")
    .create({ hello: "world" });

  console.log(await getChannelsInFirestore(firestore));

  const mapsBucket = storage.bucket("carto-bot-map-uploads");
  console.log(await mapsBucket.file("test.png").getMetadata());
};

export const trigger: EventFunction = async (_data, _context) => {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
  const firestore = new Firestore();
  const storage = new Storage();

  client.login(process.env.DISCORD_TOKEN);

  const channelsToFind = await getChannelsInFirestore(firestore);

  await Promise.all(
    channelsToFind.map(async (channelId) => {
      try {
        await client.channels.fetch(channelId);
      } catch (e) {
        console.log(`Deleting data for ${channelId} - determined not to exist`);
        return deleteChannelData(firestore, storage, channelId);
      }
    })
  );

  console.log("Deleting orphaned maps");
  await deleteOrphanedMaps(firestore, storage);
};
