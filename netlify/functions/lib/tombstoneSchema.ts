import { z } from "zod";

export const tombstoneInputSchema = z.object({
  seed: z.string().min(1).max(128),
  ageAtDeath: z.number().int().min(0).max(130),
  causeOfDeath: z.string().min(1).max(80),
  summary: z.string().min(1).max(500),
  tags: z.array(z.string().min(1).max(40)).max(8),
  score: z.number().int().min(0).max(1000000),
  stats: z.object({
    happiness: z.number().min(0).max(100),
    health: z.number().min(0).max(100),
    smarts: z.number().min(0).max(100),
    looks: z.number().min(0).max(100)
  }),
  netWorth: z.number().int().min(-1000000).max(100000000),
  careerTitle: z.string().max(80).optional(),
  highestEducation: z.string().max(80).optional(),
  displayName: z.string().min(1).max(32).optional()
});

export type TombstoneInput = z.infer<typeof tombstoneInputSchema>;

export function computeTombstoneScore(input: TombstoneInput): number {
  const averageStats = (input.stats.happiness + input.stats.health + input.stats.smarts + input.stats.looks) / 4;
  const ageScore = input.ageAtDeath * 10;
  const statsScore = averageStats * 8;
  const netWorthScore = Math.min(2000, Math.max(0, input.netWorth) / 625);

  return Math.round(ageScore + statsScore + netWorthScore);
}

export interface PublicTombstone extends TombstoneInput {
  id: string;
  createdAt: string;
}
