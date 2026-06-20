import type { GameCatalog } from "../../content/schema";
import { clampStat } from "../clamp";
import { createRng } from "../rng";
import type { LifeLogEntry, LifeState, SocialAccountState } from "../types";
import { ensureP1State } from "./defaultState";

function log(life: LifeState, messageKey: string, params?: Record<string, string | number>): LifeLogEntry {
  return { id: `${life.age}-${messageKey}-${life.log.length + 1}`, age: life.age, messageKey, params };
}

export function unlockFame({ life, source }: { life: LifeState; source: string }) {
  const ready = ensureP1State(life);
  const next = {
    ...ready,
    fame: {
      ...ready.fame,
      source,
      score: Math.max(10, ready.fame.score)
    }
  };
  const entry = log(next, "p1.log.fame.unlock", { source });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function createSocialAccount({ life, catalog, platformId }: { life: LifeState; catalog: GameCatalog; platformId: string }) {
  const ready = ensureP1State(life);
  const platform = catalog.p1.socialPlatforms.find((candidate) => candidate.id === platformId);
  if (!platform) throw new Error(`social.platform_missing:${platformId}`);
  if (ready.age < platform.minAge) throw new Error("activity.too_young");
  if (ready.socialAccounts.some((account) => account.platformId === platformId)) throw new Error("social.account_exists");

  const rng = createRng(`${ready.seed}:p1:social:create:${platformId}:${ready.age}:${ready.socialAccounts.length}`);
  const account: SocialAccountState = {
    id: `social-${ready.age}-${platformId}-${rng.int(1000, 9999)}`,
    platformId,
    followers: 0,
    verified: false,
    monetized: false,
    banned: false
  };
  const next = { ...ready, socialAccounts: [...ready.socialAccounts, account] };
  const entry = log(next, "p1.log.social.create", { platformId });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function postToSocial({ life, catalog, accountId }: { life: LifeState; catalog: GameCatalog; accountId: string }) {
  const ready = ensureP1State(life);
  const account = ready.socialAccounts.find((candidate) => candidate.id === accountId);
  if (!account) throw new Error(`social.account_missing:${accountId}`);
  if (account.banned) throw new Error("social.account_banned");
  if (!catalog.p1.socialPlatforms.some((platform) => platform.id === account.platformId)) {
    throw new Error(`social.platform_missing:${account.platformId}`);
  }

  const rng = createRng(`${ready.seed}:p1:social:post:${accountId}:${ready.age}:${ready.log.length}`);
  const followerGain = Math.max(1, rng.int(5, 30) + Math.floor(ready.fame.score / 2));
  const socialAccounts = ready.socialAccounts.map((candidate) =>
    candidate.id === accountId
      ? {
          ...candidate,
          followers: candidate.followers + followerGain,
          verified: candidate.verified || candidate.followers + followerGain >= 100000,
          monetized: candidate.monetized || candidate.followers + followerGain >= 10000
        }
      : candidate
  );
  const next = {
    ...ready,
    socialAccounts,
    fame: { ...ready.fame, score: clampStat(ready.fame.score + (ready.fame.score > 0 ? rng.int(0, 2) : 0)) }
  };
  const entry = log(next, "p1.log.social.post", { accountId, followers: followerGain });
  return { life: { ...next, log: [...next.log, entry] }, logs: [entry] };
}

export function tickFameSocial({ life }: { life: LifeState; catalog: GameCatalog }) {
  const ready = ensureP1State(life);
  return {
    life: {
      ...ready,
      fame: {
        ...ready.fame,
        score: ready.fame.score > 0 ? clampStat(ready.fame.score - 1) : 0
      }
    },
    logs: [] as LifeLogEntry[]
  };
}
