import { serve } from "@honojs/node-server";
import { Client } from "discord-rpc";
import { Hono } from "hono";

const PORT = process.env.PORT;
const port = PORT && !isNaN(parseInt(PORT, 10)) ? parseInt(PORT, 10) : 30000;

const client: Client = new Client({ transport: "ipc" });
const checkLogin = async (accessToken: string, clientId: string, clientSecret: string, redirectUri: string) => {
  if (!client.user) {
    await client.login({ clientId, clientSecret, accessToken, redirectUri, scopes: ["rcp"] });
  }
};

const app = new Hono();
app
  .get("/_/health", (c) => {
    return c.text("ok");
  })
  .post("/_/mute", async (c) => {
    try {
      const { accessToken, clientId, clientSecret } = await c.req.json<{
        accessToken: string;
        clientId: string;
        clientSecret: string;
      }>();

      await checkLogin(accessToken, clientId, clientSecret, c.req.header()["host"]);

      const setting = await client.getVoiceSettings();
      client.setVoiceSettings({
        ...setting,
        mute: !setting.mute,
      });

      return c.json({ mute: !setting.mute });
    } catch (e) {
      console.log(e);
    }
  });

serve({
  port,
  fetch: app.fetch,
});
