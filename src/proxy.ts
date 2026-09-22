import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DIACRITICS_PATTERN = /[̀-ͯ]/g;
const TRAILING_SLASHES_PATTERN = /\/+$/;

const ROOM_ALIAS_PREFIX = "/sala/";
const ROOM_PREFIX = "/room/";

const PATH_ALIASES: Record<string, string> = {
  "/historico": "/history",
  "/ranking": "/history",
  "/partidas": "/history",
  "/inicio": "/",
  "/home": "/",
};

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function removeDiacritics(pathname: string): string {
  return pathname.normalize("NFD").replace(DIACRITICS_PATTERN, "");
}

function removeTrailingSlash(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }
  return pathname.replace(TRAILING_SLASHES_PATTERN, "") || "/";
}

function normalizePathname(pathname: string): string {
  const decoded = decodePathname(pathname);
  const plain = removeDiacritics(decoded).toLowerCase();
  return removeTrailingSlash(plain);
}

function resolveAlias(pathname: string): string {
  if (pathname.startsWith(ROOM_ALIAS_PREFIX)) {
    return `${ROOM_PREFIX}${pathname.slice(ROOM_ALIAS_PREFIX.length)}`;
  }
  return PATH_ALIASES[pathname] ?? pathname;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const target = resolveAlias(normalizePathname(pathname));

  if (target === decodePathname(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
