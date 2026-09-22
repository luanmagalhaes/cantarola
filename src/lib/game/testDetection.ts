const browserHints = [
  "mozilla",
  "applewebkit",
  "chrome",
  "safari",
  "firefox",
  "edge",
];

export function looksLikeRobot(request: Request): boolean {
  const agent = (request.headers.get("user-agent") ?? "").toLowerCase();

  if (agent.length === 0) {
    return true;
  }

  return !browserHints.some((hint) => agent.includes(hint));
}
