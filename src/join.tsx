import { Action, ActionPanel, closeMainWindow, List, PopToRootType, showHUD, useNavigation } from "@raycast/api";
import { Channel, Guild } from "discord-rpc";
import { FC, useCallback, useEffect, useState } from "react";
import { getChannelList, getServerList, join } from "./lib/discord";
import { getStore, setStore, Store } from "./lib/store";

export default function main() {
  const [{ PORT, LATEST_SERVER }, setStore] = useState<Partial<Store>>({
    ACCESS_TOKEN: undefined,
    PORT: undefined,
    PROCESS_ID: undefined,
    LATEST_SERVER: undefined,
  });

  useEffect(() => {
    getStore().then((x) => setStore(x));
  }, []);

  if (!PORT) {
    return null;
  }

  return <ShowServerList port={PORT} latestServer={LATEST_SERVER} />;
}

const ShowServerList: FC<{ port: number; latestServer?: Guild }> = ({ port, latestServer }) => {
  const nav = useNavigation();
  const [guilds, setGuilds] = useState<Guild[]>([]);

  const setLatestServer = useCallback((guild: Guild) => {
    setStore({
      LATEST_SERVER: guild,
    });
  }, []);

  useEffect(() => {
    getServerList(port).then((x) => setGuilds(x));
  }, [port]);

  return (
    <List>
      {latestServer && (
        <ServerListItem
          server={latestServer}
          onAction={() => {
            nav.push(<ShowChannelList port={port} gid={latestServer.id} />);
          }}
        />
      )}
      {guilds.map((x) => {
        return (
          <ServerListItem
            key={x.id}
            server={x}
            onAction={() => {
              setLatestServer(x);
              nav.push(<ShowChannelList port={port} gid={x.id} />);
            }}
          />
        );
      })}
    </List>
  );
};

const ServerListItem: FC<{ server: Guild; onAction: () => void }> = ({ server, onAction }) => {
  return (
    <List.Item
      icon={server.icon_url}
      title={server.name}
      actions={
        <ActionPanel>
          <Action title="Select Server" onAction={onAction} />
        </ActionPanel>
      }
    />
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
                    joinChannel(x.id).then(async () => {
                      await closeMainWindow({
                        clearRootSearch: true,
                        popToRootType: PopToRootType.Immediate,
                      });
                      await showHUD(`Join to ${x.name}`);
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
