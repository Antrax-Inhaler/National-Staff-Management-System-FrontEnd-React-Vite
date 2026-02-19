import type { BaseFilter } from "@v1/types/api";

export interface AuditFilter extends BaseFilter {
  audit_type?: string;
  action?: string;
  affiliate?: string;
}

export type AuditLog = {
  id: number;
  action: string;
  entity: {
    type: string;
    id: number;
    name: string;
  };
  performed_by: {
    id: number;
    name: string;
  };
  old_values: any[];
  new_values: any[];
  timestamp: string;
};
