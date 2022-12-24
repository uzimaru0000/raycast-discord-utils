import { Action, ActionPanel, List, showHUD, useNavigation } from "@raycast/api";
import { Channel, Guild } from "discord-rpc";
import { FC, useCallback, useEffect, useState } from "react";
import { getChannelList, getServerList, join } from "./lib/discord";
import { getStore, Store } from "./lib/store";

export default function main() {
  const [{ PORT }, setStore] = useState<Partial<Store>>({
    ACCESS_TOKEN: undefined,
    PORT: undefined,
    PROCESS_ID: undefined,
  });

  useEffect(() => {
    getStore().then((x) => setStore(x));
  }, []);

  if (!PORT) {
    return null;
  }

  return <ShowServerList port={PORT} />;
}

const ShowServerList: FC<{ port: number }> = ({ port }) => {
  const nav = useNavigation();
  const [guilds, setGuilds] = useState<Guild[]>([]);

  useEffect(() => {
    getServerList(port).then((x) => setGuilds(x));
  }, [port]);

  return (
    <List>
      {guilds.map((x) => {
        return (
          <List.Item
            key={x.id}
            icon={x.icon_url}
            title={x.name}
            actions={
              <ActionPanel>
                <Action
                  title="Select Server"
                  onAction={() => {
                    nav.push(<ShowChannelList port={port} gid={x.id} />);
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
};

const ShowChannelList: FC<{ port: number; gid: string }> = ({ port, gid }) => {
  const [channels, setChannels] = useState<Channel[]>([]);

  const joinChannel = useCallback(
    async (id: string) => {
      await join(port, id);
    },
    [port]
  );
  useEffect(() => {
    getChannelList(port, gid).then((x) => setChannels(x));
  }, [port, gid]);

  return (
    <List>
      {channels.map((x) => {
        return (
          <List.Item
            key={x.id}
            title={x.name}
            actions={
              <ActionPanel>
                <Action
                  title="Join this channel"
                  onAction={() => {
                    joinChannel(x.id).then(() => {
                      showHUD(`Join to ${x.name}`);
                    });
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
};
