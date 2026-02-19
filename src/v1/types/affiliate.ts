import Affiliate from "@v1/pages/affiliate/Affiliate";
import type { BaseFilter } from "@v1/types/api";

export type Affiliate = {
  id: number;
  name: string;
  state: string | null;
  employer_name: string | null;
  ein: string | null;
  affiliation_date: string | null;
//   logo_url: string | null;
  affiliate_type: string | null;
  cbc_region: string | null;
  ORG_region: string | null;
  public_uid: string;
  logo_signed_url: string | null;
  members_count?: number;
  associate_count?: number;
  professional_count?: number;
};

export interface AffiliateFilter extends BaseFilter {
  affiliate_id?: string[];
  cbc_region?: string[];
  ORG_region?: string[];
  affiliate_type?: string[];
  employer?: string[];
  affiliation_date_to?: string | null;
  affiliation_date_from?: string | null;
  state?: string[]
}

export type AffiliateFormData = {
  affiliate_id?: number;
  name: string;
  state: string;
  employer_name: string;
  ein: string;
  affiliation_date: string;
  affiliate_type: string;
  cbc_region: string;
  ORG_region: string;
};

export interface RestoreAffiliate {
  ids: number[];
}

export interface DeleteAffiliate extends RestoreAffiliate {}

export interface AffiliateExportFilter extends AffiliateFilter {
  ids?: string;
}
