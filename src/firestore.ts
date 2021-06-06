import type { Firestore } from "@google-cloud/firestore";
import { Collections } from "./types";

const getDocsInFirestore = async (firestore: Firestore, collection: string) => {
  const channelsCollection = await firestore.collection(collection).get();

  let docIds: string[] = [];
  channelsCollection.forEach((doc) => docIds.push(doc.id));

  return docIds;
};

export const getChannelsInFirestore = async (firestore: Firestore) =>
  getDocsInFirestore(firestore, Collections.CHANNELS);

export const getMapsInFirestore = async (firestore: Firestore) =>
  getDocsInFirestore(firestore, Collections.MAPS);
