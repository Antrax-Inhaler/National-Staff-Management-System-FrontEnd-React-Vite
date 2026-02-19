import type { ReactElement } from "react";

export interface AppRoute {
  path?: string;
  element: ReactElement;
  roles?: string[];
  positions?: string[];
  permissions?: string[];
  index?: boolean;
  children?: AppRoute[];
}
