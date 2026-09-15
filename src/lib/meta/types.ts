// Shared TypeScript types for the Meta Lead Ads integration.

export interface MetaFieldData {
  name: string;
  values: string[];
}

/** Raw lead payload from Meta Graph API /leadgen/{id} */
export interface MetaRawLead {
  id: string;
  created_time: string;
  page_id?: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
  field_data: MetaFieldData[];
}

/** Parsed and enriched version stored in crm_meta_leads */
export interface MetaLeadParsed {
  metaLeadId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  pageId: string | null;
  formId: string | null;
  formName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  adsetId: string | null;
  adsetName: string | null;
  adId: string | null;
  adName: string | null;
  metaCreatedTime: string | null;
  rawLeadData: MetaRawLead;
  /** Flat map of all field_data values for easy lookup */
  fields: Record<string, string>;
}

/** A single field mapping rule from crm_meta_lead_mappings */
export interface MetaLeadMapping {
  id: number;
  scope_type: 'GLOBAL' | 'CAMPAIGN' | 'FORM';
  campaign_id: string | null;
  form_id: string | null;
  meta_field_key: string;
  crm_field_key: string;
  fallback_value: string | null;
  transform_type: string | null;
  is_enabled: number;
  sort_order: number;
}

/** The CRM payload we POST to https://cmgone.org/api/web-to-leads */
export interface CrmPayload {
  lastName: string;
  email: string;
  phone: string;
  AgeRange?: string;
  ImmigrationType?: string;
  Branch?: string;
  ResidentCountry?: string;
  UTMSource: string;
  Education?: string;
  DestinationCountry?: string;
  LeadSource: string;
  roundrobin: string;
  [key: string]: string | undefined;
}

export interface DeliveryResult {
  success: boolean;
  status: number | null;
  body: string | null;
  error: string | null;
}

/** Meta webhook entry object for leadgen events */
export interface MetaWebhookEntry {
  id: string; // page_id
  time: number;
  changes: Array<{
    field: string;
    value: {
      leadgen_id: string;
      page_id: string;
      form_id: string;
      ad_id?: string;
      adgroup_id?: string;
      adset_id?: string;
      campaign_id?: string;
      created_time?: number;
    };
  }>;
}

export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

/** Campaign data from Meta Marketing API */
export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  insights?: {
    data: Array<{
      spend?: string;
      impressions?: string;
      clicks?: string;
    }>;
  };
}
