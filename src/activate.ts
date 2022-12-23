import { LocalStorage, showHUD } from "@raycast/api";
import { authorize, createRPCClient, KEYS } from "./lib/discord";
import { checkProcess, generatePort } from "./lib/process";

export default async function main() {
  const storedProcessId = await LocalStorage.getItem<number>(KEYS.PROCESS_ID);

  if (storedProcessId) {
    if ((await checkProcess(storedProcessId)).length > 0) {
      await showHUD("Already activated");
      return;
    } else {
      const { pid, port } = createRPCClient();

      if (!pid) {
        await LocalStorage.removeItem(KEYS.PROCESS_ID);
        await showHUD("ERROR: Please retry 🙏");
        return;
      }

      await LocalStorage.setItem(KEYS.PROCESS_ID, pid);
      await LocalStorage.setItem(KEYS.PORT, port);

      await showHUD("Already activated");
      return;
    }
  }

  const storedAccessToken = await LocalStorage.getItem<string>(KEYS.ACCESS_TOKEN);

  if (storedAccessToken) {
    const { pid, port } = createRPCClient();

    if (!pid) {
      await LocalStorage.removeItem(KEYS.PROCESS_ID);
      await showHUD("ERROR: Please retry 🙏");
      return;
    }

    await LocalStorage.setItem(KEYS.PROCESS_ID, pid);
    await LocalStorage.setItem(KEYS.PORT, port);

    await showHUD("Already activated");
    return;
  }

  const accessToken = await authorize();

  const { pid, port } = createRPCClient();

  if (!pid) {
    await showHUD("ERROR: Please retry 🙏");
    return;
  }

  await LocalStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
  await LocalStorage.setItem(KEYS.PROCESS_ID, pid);
  await LocalStorage.setItem(KEYS.PORT, port);

  await showHUD("Success!!");
}
