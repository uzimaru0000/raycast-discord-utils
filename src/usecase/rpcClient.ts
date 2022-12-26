import { authorize, getPreference, createRPCClient, healthCheck, refreshActivate } from "../lib/discord";
import { checkProcess } from "../lib/process";
import { getStore, removeStore, setStore } from "../lib/store";

export const activate = async (): Promise<boolean> => {
  const { clientId, clientSecret } = getPreference();
  const { PROCESS_ID, PORT, ACCESS_TOKEN, TOKEN_EXPIRE, REFRESH_TOKEN } = await getStore();

  // プロセスが立っていたら生きているか確認する
  if (PROCESS_ID && PORT) {
    if (Date.now() < (TOKEN_EXPIRE ?? 0)) {
      const isSave = await healthCheck(PORT);
      if (isSave) {
        return true;
      }
    } else if (REFRESH_TOKEN) {
      // Token の有効期限が切れてるので更新する
      const { accessToken, refreshToken, expiresIn } = await refreshActivate(REFRESH_TOKEN);

      await setStore({
        ACCESS_TOKEN: accessToken,
        REFRESH_TOKEN: refreshToken,
        TOKEN_EXPIRE: Date.now() + expiresIn * 1000,
      });

      return activate();
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

  const { accessToken, expiresIn, refreshToken } = await authorize();
  const { pid, port } = createRPCClient(clientId, clientSecret, accessToken);

  if (!pid) {
    return false;
  }

  await setStore({
    PROCESS_ID: pid,
    PORT: port,
    ACCESS_TOKEN: accessToken,
    REFRESH_TOKEN: refreshToken,
    TOKEN_EXPIRE: Date.now() + expiresIn * 1000,
  });

  return true;
};
