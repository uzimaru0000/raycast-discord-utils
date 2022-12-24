import { showHUD } from "@raycast/api";
import { mute } from "./lib/discord";
import { getStore } from "./lib/store";

export default async function main() {
  const { PORT } = await getStore();

  if (!PORT) {
    await showHUD('Error: Execute "activate"');
    return;
  }

  try {
    const muteState = await mute(PORT);
    await showHUD(muteState ? "mute" : "unmute");
  } catch {
    await showHUD('Error: Execute "activate" 5');
  }
}
