import { environment } from "@raycast/api";
import { spawn } from "child_process";
import * as ps from "ps-node";
import { promisify } from "util";

export const generatePort = () => {
  return Math.floor(Math.random() * (50000 - 3000) + 3000);
};

export const createDaemon = (script: string, env?: Record<string, string>) => {
  const node = process.argv[0];
  const root = environment.assetsPath;

  const child = spawn(node, ["-e", `require("${root}/${script}")`], {
    env,
    detached: true,
  });
  child.unref();

  return child.pid;
};

export const checkProcess = async (pid: number) => {
  const procList = await promisify(ps.lookup)({ pid });
  const process = procList[0];

  return process ? process.command !== "<defunct>" : false;
};
