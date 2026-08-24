import type { SupabaseFunctionName } from 'shared/contracts/backend';

export interface SupabaseFunctionManifest {
  readonly name: SupabaseFunctionName;
  readonly path: string;
  readonly description: string;
  readonly triggers: readonly string[];
}

export function createSupabaseFunctionManifest(
  manifest: SupabaseFunctionManifest,
): SupabaseFunctionManifest {
  return manifest;
}
