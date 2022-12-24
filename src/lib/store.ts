import { LocalStorage } from "@raycast/api";

type Store = {
  ACCESS_TOKEN: string;
  PROCESS_ID: number;
  PORT: number;
};

export const KEYS: { [key in keyof Store]: string } = {
  ACCESS_TOKEN: "discord-utils-access-token",
  PROCESS_ID: "discord-utils-process-id",
  PORT: "discord-utils-port",
} as const;

export const getStore = async (): Promise<Partial<Store>> => {
  const pid = await LocalStorage.getItem<number>(KEYS.PROCESS_ID);
  const accessToken = await LocalStorage.getItem<string>(KEYS.ACCESS_TOKEN);
  const port = await LocalStorage.getItem<number>(KEYS.PORT);

  return {
    ACCESS_TOKEN: accessToken,
    PROCESS_ID: pid,
    PORT: port,
  };
};

export const setStore = async (items: Partial<Store>) => {
  const setter = Object.entries(items).flatMap(([k, v]: [string, string | number | undefined]) => {
    if (v) {
      return [LocalStorage.setItem(KEYS[k as keyof Store], v)];
    } else {
      return [];
    }
  });

  await Promise.all(setter);
};

export const removeStore = async (...keys: (keyof Store)[]) => {
  await Promise.all(
    keys.map((x) => {
      return LocalStorage.removeItem(KEYS[x]).then(() => console.log(x));
    })
  );
};
