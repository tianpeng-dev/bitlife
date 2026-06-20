import type { P1Catalog } from "../schema";

export const generatedCountryLaw = [
  {
    countryId: "us",
    gamblingLegal: true,
    prisonSeverity: 1.25,
    immigrationDifficulty: 0.65,
    marriageAge: 18,
    assetCostMultiplier: 1.1
  },
  {
    countryId: "cn",
    gamblingLegal: false,
    prisonSeverity: 1.45,
    immigrationDifficulty: 0.7,
    marriageAge: 20,
    assetCostMultiplier: 0.9
  },
  {
    countryId: "jp",
    gamblingLegal: true,
    prisonSeverity: 1.1,
    immigrationDifficulty: 0.75,
    marriageAge: 18,
    assetCostMultiplier: 1.25
  },
  {
    countryId: "br",
    gamblingLegal: true,
    prisonSeverity: 1.35,
    immigrationDifficulty: 0.5,
    marriageAge: 16,
    assetCostMultiplier: 0.75
  },
  {
    countryId: "se",
    gamblingLegal: true,
    prisonSeverity: 0.85,
    immigrationDifficulty: 0.6,
    marriageAge: 18,
    assetCostMultiplier: 1.35
  }
] satisfies P1Catalog["countryLaw"];
