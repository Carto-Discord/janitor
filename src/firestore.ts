import type { Firestore } from "@google-cloud/firestore";
import { Collections } from "./types";

const getDocsInFirestore = async (firestore: Firestore, collection: string) => {
  const channelsCollection = firestore.collection(collection);

  const docRefs = await channelsCollection.listDocuments();
  return docRefs.map((doc) => doc.id);
};

export const getChannelsInFirestore = async (firestore: Firestore) =>
  getDocsInFirestore(firestore, Collections.CHANNELS);

export const getMapsInFirestore = async (firestore: Firestore) =>
  getDocsInFirestore(firestore, Collections.MAPS);
