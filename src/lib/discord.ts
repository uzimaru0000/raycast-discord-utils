import { open } from "@raycast/api";
import { createServer } from "http";
import fetch from "node-fetch";
import html from "../assets/success";
import { createDaemon } from "./process";

const RPC_SERVER_FILE_PATH = "dist/server/index.js";

export const KEYS = {
  ACCESS_TOKEN: "discord-utils-access-token",
  PROCESS_ID: "discord-utils-process-id",
  PORT: "discord-utils-port",
} as const;

export const clientId = "";
export const clientSecret = "";

export const authorize = async () => {
  const url =
    "https://discord.com/api/oauth2/authorize?client_id=1055502721433743491&redirect_uri=http%3A%2F%2Flocalhost%3A3000&response_type=code&scope=rpc";

  await open(url);

  const getCode = onceSentRequest();
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

export const createRPCClient = () => {
  const port = Math.floor(Math.random() * (50000 - 3000) + 3000);

  return {
    pid: createDaemon(RPC_SERVER_FILE_PATH, { PORT: port.toString() }),
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

const onceSentRequest = async () => {
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

        const params = new URL(url, "http://localhost:3000").searchParams;
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
      .listen(3000)
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
