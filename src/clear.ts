import { showHUD } from "@raycast/api";
import { removeStore } from "./lib/store";

export default async () => {
  await removeStore("ACCESS_TOKEN", "PORT", "PROCESS_ID");
  await showHUD("clear");
};
