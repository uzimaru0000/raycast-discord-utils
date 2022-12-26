import {
  Action,
  ActionPanel,
  closeMainWindow,
  List,
  PopToRootType,
  showHUD,
  useNavigation,
  Icon,
  LocalStorage,
} from "@raycast/api";
import { Channel, Guild } from "discord-rpc";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
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
        <List.Section title="Latest select">
          <ServerListItem
            server={latestServer}
            onAction={() => {
              nav.push(<ShowChannelList port={port} gid={latestServer.id} />);
            }}
          />
        </List.Section>
      )}

      <List.Section title="Joined server">
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
      </List.Section>
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
  const [favoriteChannels, setFavoriteChannels] = useState<Channel[]>([]);
  const favoriteChannelMap = useMemo(() => {
    return Object.fromEntries(favoriteChannels.map((x) => [x.id, x]));
  }, [favoriteChannels]);
  const unfavoriteChannels = useMemo(() => {
    return channels.filter((x) => !favoriteChannelMap[x.id]);
  }, [favoriteChannelMap]);

  const joinChannel = useCallback(
    async (id: string) => {
      await join(port, id);
    },
    [port]
  );
  const favoriteChannel = useCallback(
    async (channel: Channel) => {
      const storedChannel = await LocalStorage.getItem(`${gid}-favorite-channel`).then((x) =>
        x ? JSON.parse(x as string) : []
      );
      const channels = [...storedChannel, channel];
      await LocalStorage.setItem(`${gid}-favorite-channel`, JSON.stringify(channels));

      setFavoriteChannels(channels);
    },
    [gid]
  );
  const removeFavoriteChannel = useCallback(
    async (channel: Channel) => {
      const storedChannel = (await LocalStorage.getItem(`${gid}-favorite-channel`).then((x) =>
        x ? JSON.parse(x as string) : []
      )) as Channel[];
      const channels = storedChannel.filter((x) => x.id !== channel.id);
      await LocalStorage.setItem(`${gid}-favorite-channel`, JSON.stringify(channels));

      setFavoriteChannels(channels);
    },
    [gid]
  );
  const Actions = useCallback(
    ({ channel }: { channel: Channel }) => {
      return (
        <ActionPanel>
          <Action
            title="Join this channel"
            onAction={() => {
              joinChannel(channel.id).then(async () => {
                await closeMainWindow({
                  clearRootSearch: true,
                  popToRootType: PopToRootType.Immediate,
                });
                await showHUD(`Join to ${channel.name}`);
              });
            }}
          />
          <Action
            title={favoriteChannelMap[channel.id] ? "Remove favorite" : "Favorite"}
            icon={favoriteChannelMap[channel.id] ? Icon.Star : Icon.StarDisabled}
            onAction={() => {
              if (favoriteChannelMap[channel.id]) {
                removeFavoriteChannel(channel);
              } else {
                favoriteChannel(channel);
              }
            }}
          />
        </ActionPanel>
      );
    },
    [joinChannel, favoriteChannelMap, removeFavoriteChannel, favoriteChannel]
  );

  useEffect(() => {
    const func = async () => {
      const channels = await getChannelList(port, gid);
      const storedChannel = (await LocalStorage.getItem(`${gid}-favorite-channel`).then((x) =>
        x ? JSON.parse(x as string) : []
      )) as Channel[];

      const mappedValue = channels.map((x) => {
        return {
          ...x,
          isFavorite: storedChannel.map((x) => x.id).includes(x.id),
        };
      });

      setChannels(mappedValue);
      setFavoriteChannels(storedChannel);
    };

    func();
  }, [port, gid]);

  return (
    <List>
      <List.Section title="Favorite channels">
        {favoriteChannels.map((x) => {
          return <List.Item key={x.id} title={x.name} actions={<Actions channel={x} />} />;
        })}
      </List.Section>
      <List.Section title="Channel list">
        {unfavoriteChannels.map((x) => {
          return <List.Item key={x.id} title={x.name} actions={<Actions channel={x} />} />;
        })}
      </List.Section>
    </List>
  );
};
