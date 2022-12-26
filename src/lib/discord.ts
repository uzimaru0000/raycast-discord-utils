import { getPreferenceValues, open } from "@raycast/api";
import { Channel, Guild } from "discord-rpc";
import { createServer } from "http";
import fetch from "node-fetch";
import html from "../assets/success";
import { createDaemon } from "./process";

const RPC_SERVER_FILE_PATH = "dist/server/index.js";

export const getPreference = () => {
  const { clientId, clientSecret, authorizePort } = getPreferenceValues<{
    clientId?: string;
    clientSecret?: string;
    authorizePort?: string;
  }>();

  if (!clientId || !clientSecret) {
    throw new Error("error");
  }

  return {
    clientId,
    clientSecret,
    authorizePort: authorizePort ?? "3000",
  };
};

export const authorize = async () => {
  const { clientId, clientSecret, authorizePort } = getPreference();

  const url = new URL("https://discord.com/api/oauth2/authorize");
  const sp = new URLSearchParams({
    client_id: clientId,
    redirect_url: `http://localhost:${authorizePort}`,
    response_type: "code",
    scope: "rpc",
  });
  url.search = sp.toString();

  try {
    const getCode = onceSentRequest(Number(authorizePort));

    await open(url.href);

    const code = await getCode;

    const params = new URLSearchParams({
      redirect_uri: "http://localhost:3000",
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: code,
    });

    const res = await fetch("https://discordapp.com/api/oauth2/token", {
      method: "POST",
      body: params,
    }).then((x) => x.json());

    return {
      accessToken: res.access_token as string,
      expiresIn: res.expires_in as number,
      refreshToken: res.refresh_token as string,
    } as const;
  } catch (e) {
    if (typeof e === "function") {
      e();
    } else {
      throw e;
    }
  }

  return {} as never;
};

export const refreshActivate = async (refreshToken: string) => {
  const { clientId, clientSecret } = getPreference();

  const params = new URLSearchParams({
    redirect_uri: "http://localhost:3000",
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://discordapp.com/api/oauth2/token", {
    method: "POST",
    body: params,
  }).then((x) => x.json());

  return {
    accessToken: res.access_token as string,
    expiresIn: res.expires_in as number,
    refreshToken: res.refresh_token as string,
  } as const;
};

export const createRPCClient = (clientId: string, clientSecret: string, accessToken: string) => {
  const port = Math.floor(Math.random() * (50000 - 3000) + 3000);

  return {
    pid: createDaemon(RPC_SERVER_FILE_PATH, {
      PORT: port.toString(),
      CLIENT_ID: clientId,
      CLIENT_SECRET: clientSecret,
      ACCESS_TOKEN: accessToken,
    }),
    port,
  };
};

export const healthCheck = async (port: number) => {
  try {
    const res = await fetch(`http://localhost:${port}/_/health`);
    return res.ok;
  } catch {
    return false;
  }
};

export const mute = async (port: number) => {
  try {
    const res = await fetch(`http://localhost:${port}/_/mute`, {
      method: "POST",
    }).then((x) => {
      if (x.ok) {
        return x.json();
      } else {
        throw new Error("failed");
      }
    });

    if (Object.keys(res).includes("mute")) {
      return res.mute as boolean;
    } else {
      throw new Error("failed");
    }
  } catch {
    throw new Error("failed");
  }
};

export const getServerList = async (port: number): Promise<Guild[]> => {
  try {
    const res = await fetch(`http://localhost:${port}/_/guilds`).then((x) => {
      if (x.ok) {
        return x.json();
      } else {
        throw new Error("failed");
      }
    });

    return res.guilds;
  } catch {
    throw new Error("failed");
  }
};

export const getChannelList = async (port: number, gid: string): Promise<Channel[]> => {
  try {
    const res = await fetch(`http://localhost:${port}/_/channels?gid=${gid}`).then((x) => {
      if (x.ok) {
        return x.json();
      } else {
        throw new Error("failed");
      }
    });

    return res;
  } catch {
    throw new Error("failed");
  }
};

export const join = async (port: number, id: string) => {
  try {
    const res = await fetch(`http://localhost:${port}/_/join?id=${id}`, {
      method: "POST",
    }).then((x) => {
      if (x.ok) {
        return x.json();
      } else {
        throw new Error("failed");
      }
    });

    return res;
  } catch {
    throw new Error("failed");
  }
};

export const exit = async (port: number) => {
  try {
    const res = await fetch(`http://localhost:${port}/_/exit`, {
      method: "POST",
    }).then((x) => {
      if (x.ok) {
        return x.json();
      } else {
        throw new Error("failed");
      }
    });

    return res;
  } catch {
    throw new Error("failed");
  }
};

const onceSentRequest = (port: number) => {
  return new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      res.statusCode = 200;
      res.write(html);
      res.end();

      try {
        const url = req.url;
        if (!url) {
          throw "error";
        }

        const params = new URL(url, `http://localhost:${port}`).searchParams;
        const code = params.get("code");

        if (code) {
          resolve(code);
        } else {
          throw "error";
        }
      } catch (e) {
        reject(server.close);
      } finally {
        req.socket.end();
        req.socket.destroy();
        server.close();
      }
    });

    server.listen(port).once("error", (err) => {
      reject(server.close);
    });
  });
};
