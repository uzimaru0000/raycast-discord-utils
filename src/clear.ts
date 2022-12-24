import { showHUD } from "@raycast/api";
import { getStore, removeStore } from "./lib/store";

export default async () => {
  const { PROCESS_ID } = await getStore();

  if (PROCESS_ID) {
    process.kill(PROCESS_ID, 9);
  }

  await removeStore("ACCESS_TOKEN", "PORT", "PROCESS_ID");
  await showHUD("clear");
};
