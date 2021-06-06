export const enum Collections {
  CHANNELS = "channels",
  MAPS = "maps",
}

export type ChannelData = {
  base: string;
  current: string;
  history: string[];
};
