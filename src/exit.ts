import { showHUD } from "@raycast/api";
import { exit } from "./lib/discord";
import { getStore } from "./lib/store";

export default async function main() {
  const { PORT } = await getStore();

  if (!PORT) {
    await showHUD('Error: Execute "activate"');
    return;
  }

  try {
    await exit(PORT);
    await showHUD("exit");
  } catch {
    await showHUD('Error: Execute "activate"');
  }
}
