import { EventFunction } from "@google-cloud/functions-framework/build/src/functions";
import { Client } from "discord.js";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";

const firestore = new Firestore();

const getChannelsInFirestore = async () => {
  const channelsCollection = firestore.collection("channels");

  const docRefs = await channelsCollection.listDocuments();
  return docRefs.map((doc) => doc.id);
};

const deleteDataInFirestoreAndStorage = async (channelId: string) => {
  const storage = new Storage();

  const channelDoc = firestore.collection("channels").doc(channelId);

  const { base, current, history } = (await channelDoc.get()).data();
  const mapIds = [base, current, ...history];

  const mapsCollection = firestore.collection("maps");
  const mapsBucket = storage.bucket(process.env.MAPS_BUCKET);

  await Promise.all(
    mapIds.map((id) => {
      mapsCollection.doc(id).delete();
      mapsBucket.file(id).delete();
    })
  );

  await channelDoc.delete();
};

export const trigger: EventFunction = async (_data, _context) => {
  const client = new Client();
  client.login(process.env.DISCORD_TOKEN);

  const channelsToFind = await getChannelsInFirestore();
  channelsToFind.forEach(async (channelId) => {
    const channel = await client.channels.fetch(channelId);

    if (channel.deleted) {
      await deleteDataInFirestoreAndStorage(channelId);
    }
  });
};
