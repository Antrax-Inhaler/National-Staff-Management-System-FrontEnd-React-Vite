import React from "react";

interface Document {
  id: number;
  parent_id: number | null;
  affiliate_id: number | null;
  name: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

interface Folder {
  id: number | null;
  folder_id: number | null;
  affiliate_id: number | null;
  user_id: number | null;
  title: string | null;
  description: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  type: string | null;
  category: string | null;
  employer: string | null;
  cbc: string | null;
  state: string | null;
  status: string | null;
  sub_type: string | null;
  year: number | null;
  expiration_date: string | null;
  effective_date: string | null;
  folder_name: string | null;
  uploaded_by: string | null;
  keywords: string | null;
  database_source: string | null;
  is_active: boolean;
  is_archived: boolean;
  is_public: boolean;
  created_at: string | null;
  updated_at: string | null;
}

function FileDataView() {
  return <div>FileDataView</div>;
}

export default FileDataView;
