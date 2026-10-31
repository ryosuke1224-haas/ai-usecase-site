import { loadEnvConfig } from "@next/env";

const silentLog = {
  info() {},
  error() {},
};

export type LoadedLocalEnv = {
  loadedFileNames: string[];
};

/**
 * Load the same Next.js env files a local `next dev` process would see.
 * Existing process.env values win. File contents and secret values are never logged.
 */
export function loadAtlasLocalEnv(input: { dir?: string; forceReload?: boolean } = {}): LoadedLocalEnv {
  const result = loadEnvConfig(input.dir ?? process.cwd(), true, silentLog, Boolean(input.forceReload));
  return {
    loadedFileNames: result.loadedEnvFiles.map((file) => file.path),
  };
}
