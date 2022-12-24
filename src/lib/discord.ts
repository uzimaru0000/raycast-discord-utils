import { getPreferenceValues, open } from "@raycast/api";
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

  await open(url.href);

  const getCode = onceSentRequest(Number(authorizePort));
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

  return res.access_token as string;
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

const onceSentRequest = async (port: number) => {
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
        reject(e);
      } finally {
        req.socket.end();
        req.socket.destroy();
        server.close();
      }
    });

    server
      .listen(port)
      .once("listening", () => {
        console.log("listen");
      })
      .once("error", (err) => {
        reject(err);
      })
      .once("close", () => {
        console.log("close");
      });
  });
};
