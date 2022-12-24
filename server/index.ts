import { Client } from "discord-rpc";
import Express from "express";
import { exit } from "process";

const PORT = process.env.PORT;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

if (!ACCESS_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("必要な引数がありません");
  exit(1);
}

const port = PORT && !isNaN(parseInt(PORT, 10)) ? parseInt(PORT, 10) : 30000;

const getClient = (() => {
  let client: Client | null = null;

  return async () => {
    if (client) {
      return client;
    }

    client = new Client({ transport: "ipc" });

    await client.login({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      accessToken: ACCESS_TOKEN,
      redirectUri: `http://localhost:3000`,
      scopes: ["rpc"],
    });

    return client;
  };
})();

const app = Express();
app
  .get("/_/health", async (req, res) => {
    try {
      const client = await getClient();

      if (client.user) {
        res.status(200).send(client.user.id);
        return;
      } else {
        res.status(500).send("failed");
        return;
      }
    } catch (e) {
      res.status(500).json(e);
      return;
    }
  })
  .post("/_/mute", async (_, res) => {
    try {
      const client = await getClient();

      const setting = await client.getVoiceSettings();

      setting.mute = !setting.mute;

      client.setVoiceSettings(setting);

      res.status(200).json({ mute: setting.mute });
    } catch (e) {
      res.status(500).json({ error: e });
    }
  });

app.listen(port);
