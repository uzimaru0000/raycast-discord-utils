import { getStore } from "./lib/store";

export default async () => {
  const items = await getStore();

  console.log(items);
};
