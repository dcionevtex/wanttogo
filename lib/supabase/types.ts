export type SourceStatus =
  "pending" | "processing" | "resolved" | "review_required" | "failed";
export type Source = {
  id: string;
  user_id: string;
  original_url: string;
  normalized_url: string;
  url_hash: string;
  platform: string;
  status: SourceStatus;
  safe_error_code: string | null;
  created_at: string;
  updated_at: string;
};
export type InboxSource = Pick<
  Source,
  | "id"
  | "original_url"
  | "normalized_url"
  | "platform"
  | "status"
  | "created_at"
>;
export type Database = {
  public: {
    Tables: {
      sources: { Row: Source; Insert: never; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      capture_url: {
        Args: { p_original_url: string; p_normalized_url: string };
        Returns: {
          source_id: string | null;
          source_status: SourceStatus | null;
          duplicate: boolean;
          rate_limited: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
