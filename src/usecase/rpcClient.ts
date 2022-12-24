import { authorize, getPreference, createRPCClient, healthCheck } from "../lib/discord";
import { checkProcess } from "../lib/process";
import { getStore, removeStore, setStore } from "../lib/store";

export const activate = async () => {
  const { clientId, clientSecret } = getPreference();
  const { PROCESS_ID, PORT, ACCESS_TOKEN } = await getStore();

  // プロセスが立っていたら生きているか確認する
  if (PROCESS_ID && PORT) {
    const isSave = await healthCheck(PORT);
    if (isSave) {
      return true;
    }
  }

  try {
    if (PROCESS_ID && (await checkProcess(PROCESS_ID))) {
      process.kill(PROCESS_ID, 9);
    }
  } finally {
    await removeStore("PROCESS_ID", "PORT");
  }

  // アクセストークンがあったらプロセスを作る
  if (ACCESS_TOKEN) {
    const { pid, port } = createRPCClient(clientId, clientSecret, ACCESS_TOKEN);

    if (!pid) {
      return false;
    }

    await setStore({ PROCESS_ID: pid, PORT: port });

    return true;
  }

  const accessToken = await authorize();
  const { pid, port } = createRPCClient(clientId, clientSecret, accessToken);

  if (!pid) {
    return false;
  }

  await setStore({ PROCESS_ID: pid, PORT: port, ACCESS_TOKEN: accessToken });

  return true;
};
