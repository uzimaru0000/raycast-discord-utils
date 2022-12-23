import { LocalStorage, showHUD } from "@raycast/api";
import { KEYS } from "./lib/discord";
import { checkProcess, createDaemon } from "./lib/process";

export default async () => {
  const items = await LocalStorage.allItems();

  console.log(items);

  console.log(await checkProcess(items[KEYS.PROCESS_ID]));
};
