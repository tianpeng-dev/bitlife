const forbiddenExpressions = ["BitLife", "God Mode", "Bitlife Marketplace"];

export function scanForbiddenSimilarity(text: string): string[] {
  return forbiddenExpressions.filter((expression) => text.includes(expression));
}
