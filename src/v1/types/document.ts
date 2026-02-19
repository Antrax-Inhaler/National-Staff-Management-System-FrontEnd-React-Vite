import type { Affiliate, AffiliateFilter, BaseFilter } from "@v1/types";

export interface ArbitrationFilter {
  outcome?: string[];
  award_date_to?: string;
  award_date_from?: string;
  arbitrator?: string;
}

export interface ContractFilter {
  status?: string[];
  expire_from?: string;
  expire_to?: string;
  effective_from?: string;
  effective_to?: string;
}

export interface OverviewFilter
  extends BaseFilter, ContractFilter, ArbitrationFilter, AffiliateFilter {
  document_type?: string[];
  category?: string[];
  public?: boolean;
}

export interface DocumentOverviewProp {
  type: "research" | "governance" | "national";
}

export type Document = {
  id: number;
  public_uid: string;
  folder_id: number | null;
  affiliate_id: number | null;
  user_id: number | null;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  type: string;
  category: string[] | null;
  employer: string | null;
  cbc: string | null;
  state: string | null;
  status: "active" | "inactive";
  sub_type: string | null;
  year: number | null;
  expiration_date: string | null;
  effective_date: string | null;
  folder_name: string | null;
  uploaded_by: string | null;
  keywords: string | null;
  database_source: string;
  is_active: boolean;
  is_archived: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  category_group: string | null;
  deleted_at: string | null;
  state_id: number | null;
  award_date: string | null;
  arbitrator: string | null;
  outcome: string | null;

  affiliate: Affiliate | null;
  uploader?: any | null;
  folder: Folder | null;
};

export type Folder = {
  id: number;
  parent_id: number | null;
  affiliate_id: number | null;
  folder_name: string | null;
  root: boolean;
  public_uid: string;
  category_group: string | null;
  display_name: string | null;
  affiliate: Affiliate | null;
};

export type DocumentForm = {
  affiliate_id: string | null;

  title: string | null;
  description: string | null;
  type: string | null;
  category_group: string | null;
  keywords: string | null;
  file: File | null;
  category?: string[];

  status: string | null;
  expiration_date: string | null;
  effective_date: string | null;

  award_date: string | null;
  arbitrator: string | null;
  outcome: string | null;
};

export type UpdateDocumentForm = Partial<DocumentForm>;
