import { validate as validateUuid, version as uuidVersion } from "@std/uuid";

/** Canonical lowercase UUID, any version. Version 7 is what `new` mints. */
export function isId(s: string): boolean {
  return s === s.toLowerCase() && validateUuid(s);
}

export function isV7(s: string): boolean {
  return isId(s) && uuidVersion(s) === 7;
}
