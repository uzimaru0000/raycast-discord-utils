import { LocalStorage } from "@raycast/api";
import { Guild } from "discord-rpc";

export type Store = {
  ACCESS_TOKEN: string;
  PROCESS_ID: number;
  PORT: number;
  LATEST_SERVER: Guild;
};

export const KEYS: { [key in keyof Store]: string } = {
  ACCESS_TOKEN: "discord-utils-access-token",
  PROCESS_ID: "discord-utils-process-id",
  PORT: "discord-utils-port",
  LATEST_SERVER: "discord-utils-latest-server",
} as const;

export const getStore = async (): Promise<Partial<Store>> => {
  const pid = await LocalStorage.getItem<number>(KEYS.PROCESS_ID);
  const accessToken = await LocalStorage.getItem<string>(KEYS.ACCESS_TOKEN);
  const port = await LocalStorage.getItem<number>(KEYS.PORT);
  const latestServer = await LocalStorage.getItem<string>(KEYS.LATEST_SERVER);

  return {
    ACCESS_TOKEN: accessToken,
    PROCESS_ID: pid,
    PORT: port,
    LATEST_SERVER: latestServer ? JSON.parse(latestServer) : undefined,
  };
};

export const setStore = async (items: Partial<Store>) => {
  const setter = Object.entries(items).flatMap(([k, v]: [string, string | number | Guild | undefined]) => {
    if (v) {
      if (typeof v === "object") {
        return [LocalStorage.setItem(KEYS[k as keyof Store], JSON.stringify(v))];
      } else {
        return [LocalStorage.setItem(KEYS[k as keyof Store], v)];
      }
    } else {
      return [];
    }
  });

  await Promise.all(setter);
};

export const removeStore = async (...keys: (keyof Store)[]) => {
  await Promise.all(
    keys.map((x) => {
      return LocalStorage.removeItem(KEYS[x]);
    })
  );
};
