import { showHUD } from "@raycast/api";
import { activate } from "./usecase/rpcClient";

export default async function main() {
  const result = await activate();

  if (result) {
    await showHUD("success");
  } else {
    await showHUD("Failed: Please retry 🙏");
  }
}
