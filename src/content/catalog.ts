import { achievements } from "./achievements";
import { activities } from "./activities";
import { careers } from "./careers";
import { countries } from "./countries";
import { diseases } from "./diseases";
import { events } from "./events";
import { locales } from "./locales";
import { p1Catalog } from "./p1/catalog";
import type { GameCatalog } from "./schema";

export const catalog: GameCatalog = {
  locales,
  countries,
  activities,
  events,
  careers,
  diseases,
  achievements,
  p1: p1Catalog
};
