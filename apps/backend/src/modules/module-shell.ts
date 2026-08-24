import type { BackendModuleName } from '../config';
import type { HttpMethod } from '../http/types';

export interface ModuleRouteShell {
  readonly method: HttpMethod;
  readonly path: string;
  readonly summary: string;
}

export interface BackendModuleShell<TName extends BackendModuleName = BackendModuleName> {
  readonly name: TName;
  readonly basePath: string;
  readonly description: string;
  readonly routes: readonly ModuleRouteShell[];
}

export function createModuleShell<TName extends BackendModuleName>(
  module: BackendModuleShell<TName>,
): BackendModuleShell<TName> {
  return module;
}
