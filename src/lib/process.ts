import { environment } from "@raycast/api";
import { spawn } from "child_process";
import ps from "ps-tree";
import { promisify } from "util";

export const generatePort = () => {
  return Math.floor(Math.random() * (50000 - 3000) + 3000);
};

export const createDaemon = (script: string, env?: Record<string, string>) => {
  const node = process.argv[0];
  const root = environment.assetsPath;

  const child = spawn(node, ["-e", `require('${root}/${script}')`], {
    detached: true,
    env,
  });
  child.unref();

  return child.pid;
};

export const checkProcess = (pid: number) => {
  return promisify(ps)(pid);
};
