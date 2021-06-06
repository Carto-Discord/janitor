import type { Firestore } from "@google-cloud/firestore";
import type { Storage } from "@google-cloud/storage";
import { getChannelsInFirestore, getMapsInFirestore } from "./firestore";
import { ChannelData, Collections } from "./types";

/**
 * Deletes all data associated with a channel, including the images in Cloud Storage,
 * the map data in firestore, and finally the channel document itself.
 * @param firestore Firestore Client
 * @param storage Storage Client
 * @param channelId Channel ID to search on
 */
export const deleteChannelData = async (
  firestore: Firestore,
  storage: Storage,
  channelId: string
) => {
  const channelDoc = firestore.collection(Collections.CHANNELS).doc(channelId);
  const { base, current, history } = (
    await channelDoc.get()
  ).data() as ChannelData;

  // Deduping mapIds
  const mapIds = [...new Set([base, current, ...history])];

  const mapsCollection = firestore.collection(Collections.MAPS);
  const mapsBucket = storage.bucket(process.env.MAPS_BUCKET);

  await Promise.all(
    mapIds.map((id) => {
      mapsCollection.doc(id).delete();
      mapsBucket.file(`${id}.png`).delete();
    })
  );

  await channelDoc.delete();
};

/**
 * Finds all the map documents in Firestore that don't have a corresponding
 * image and erases those IDs from both the maps collection, and anywhere
 * in the channel history.
 * @param firestore Firestore Client
 * @param storage Storage Client
 */
export const deleteOrphanedMaps = async (
  firestore: Firestore,
  storage: Storage
) => {
  const maps = await getMapsInFirestore(firestore);
  const channels = await getChannelsInFirestore(firestore);

  const mapsCollection = firestore.collection(Collections.MAPS);
  const channelsCollection = firestore.collection(Collections.CHANNELS);
  const mapsBucket = storage.bucket(process.env.MAPS_BUCKET);

  const mapIdsToDelete = await Promise.all(
    maps
      .map(
        async (m) =>
          await mapsBucket
            .file(`${m}.png`)
            .exists()
            .then((exists) => (exists ? undefined : m))
      )
      .filter((v) => v)
  );

  await Promise.all([
    ...mapIdsToDelete.map((m) => mapsCollection.doc(m).delete()),
    ...channels.map(async (id) => {
      const channelDoc = channelsCollection.doc(id);
      const { base, current, history } = (
        await channelDoc.get()
      ).data() as ChannelData;

      if (mapIdsToDelete.includes(base) || mapIdsToDelete.includes(current)) {
        // Delete the whole channel document anyway, as this data
        // is now unrecoverable.
        return channelsCollection.doc(id).delete();
      } else if (mapIdsToDelete.some((id) => history.includes(id))) {
        // Only history is affected, so we can remove all the IDs safely.
        const newHistory = history.filter((id) => !mapIdsToDelete.includes(id));
        return channelsCollection.doc(id).update({ history: newHistory });
      }
    }),
  ]);
};