import "server-only";
import { CATEGORY_GROUPS } from "./categoryMasterData.core";

export async function loadCategoryMasterData(db) {
  const entries = await Promise.all(Object.entries(CATEGORY_GROUPS).map(async ([key, config]) => {
    const result = await db.from(config.table).select("*").order("sort_order", { ascending: true });
    return [key, result];
  }));
  return Object.fromEntries(entries);
}
