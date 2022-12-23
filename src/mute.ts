import { LocalStorage, showHUD } from "@raycast/api";
import fetch from "node-fetch";
import { clientId, clientSecret, createRPCClient, healthCheck, KEYS } from "./lib/discord";
import { generatePort } from "./lib/process";

export default async function main() {
  const accessToken = await LocalStorage.getItem<string>(KEYS.ACCESS_TOKEN);
  if (!accessToken) {
    await showHUD('Error: Execute "activate" 1');
    return;
  }

  const pid = await LocalStorage.getItem<number>(KEYS.PROCESS_ID);
  if (!pid) {
    await LocalStorage.removeItem(KEYS.PROCESS_ID);

    const { pid, port } = createRPCClient();

    if (!pid) {
      await showHUD('Error: Execute "activate" 2');
      return;
    }

    await LocalStorage.setItem(KEYS.PORT, port);
    await LocalStorage.setItem(KEYS.PROCESS_ID, pid);
  }

  let port = await LocalStorage.getItem<number>(KEYS.PORT);

  if (!port || !(await healthCheck(port))) {
    const { port, pid } = createRPCClient();

    if (!pid) {
      await LocalStorage.removeItem(KEYS.PROCESS_ID);
      await showHUD('Error: Execute "activate" 3');
      return;
    }

    await LocalStorage.setItem(KEYS.PORT, port);
    await LocalStorage.setItem(KEYS.PROCESS_ID, pid);
  }

  port = await LocalStorage.getItem<number>(KEYS.PORT);

  if (!port) {
    await LocalStorage.removeItem(KEYS.PORT);
    await showHUD('Error: Execute "activate" 4');
    return;
  }

  try {
    const res = await fetch(`http://localhost:${port}/_/mute`, {
      method: "POST",
      body: JSON.stringify({
        accessToken,
        clientId: clientId,
        clientSecret: clientSecret,
      }),
    }).then((x) => {
      if (x.ok) {
        return x.json();
      } else {
        throw new Error("failed");
      }
    });

    await showHUD(res.mute ? "mute" : "unmute");
  } catch {
    await showHUD('Error: Execute "activate" 5');
  }
}
