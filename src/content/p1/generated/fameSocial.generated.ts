import type { P1Catalog } from "../schema";

export const generatedFameActivities = [
  {
    id: "p1_fame_interview",
    labelKey: "p1.fame.interview.label",
    resultKey: "p1.fame.interview.result",
    requirements: { minAge: 16, minFame: 10, notInPrison: true },
    effects: { fame: 4, happiness: 1 },
    source: "generated:p1:fame-social"
  },
  {
    id: "p1_fame_ad",
    labelKey: "p1.fame.ad.label",
    resultKey: "p1.fame.ad.result",
    requirements: { minAge: 18, minFame: 20, notInPrison: true },
    effects: { cash: 2000, fame: 2 },
    source: "generated:p1:fame-social"
  },
  {
    id: "p1_fame_charity",
    labelKey: "p1.fame.charity.label",
    resultKey: "p1.fame.charity.result",
    requirements: { minAge: 16, minFame: 15, minCash: 500, notInPrison: true },
    effects: { cash: -500, fame: 5, happiness: 3 },
    source: "generated:p1:fame-social"
  },
  {
    id: "p1_fame_scandal_response",
    labelKey: "p1.fame.scandal_response.label",
    resultKey: "p1.fame.scandal_response.result",
    requirements: { minAge: 16, minFame: 10, notInPrison: true },
    effects: { fame: 1, happiness: -1 },
    source: "generated:p1:fame-social"
  }
] satisfies P1Catalog["fameActivities"];

export const generatedSocialPlatforms = [
  {
    id: "p1_social_short_video",
    nameKey: "p1.social.short_video.name",
    minAge: 13,
    source: "generated:p1:fame-social"
  },
  {
    id: "p1_social_photo_feed",
    nameKey: "p1.social.photo_feed.name",
    minAge: 13,
    source: "generated:p1:fame-social"
  },
  {
    id: "p1_social_streaming",
    nameKey: "p1.social.streaming.name",
    minAge: 16,
    source: "generated:p1:fame-social"
  }
] satisfies P1Catalog["socialPlatforms"];
