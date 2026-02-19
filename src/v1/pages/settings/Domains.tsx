import React, { useState } from "react";
import DataTable, { type Column } from "../../components/ui/DataTable";
import { domain } from "../../api/domain";
import CreateMember from "../../components/members/CreateMember";
import ConfirmationPopUp from "../../components/ui/ConfirmationPopUp";
import {
  Check,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AlertMessage from "../../components/ui/AlertMessage";
import CreateDomain from "../../components/domain/CreateDomain";
import { useParams } from "react-router-dom";
import HelpButton from "@v1/components/help/HelpButton";

export interface Domain {
  id: number;
  affiliate_id: number;
  domain: string;
  type?: string;
  is_blacklisted: boolean;
  created_at: string;
  updated_at: string;
}

function Domains() {
  const { uid } = useParams<{ uid: string }>();
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const queryKey = ["domains", uid];
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (id: number) => domain.delete(id),
    onSuccess: () => {
      // Invalidate and refetch all member queries
      queryClient.invalidateQueries({ queryKey: queryKey });
      setDeleting(false);
      setDeleteId(null);
    },
    onError: async (err: any) => {
      if (err?.message) {
        setErrorMessage(err.message);
      }
      setDeleting(false);
      setDeleteId(null);
    },
  });

  const columns: Column<Domain>[] = [
    {
      key: "domain",
      header: "Domain",
      accessor: (row) => <span className="font-bold">{row.domain}</span>,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => (
        <span className="flex items-center gap-2 font-semibold">
          {row.type == "domain" ? (
            <>
              <span className="text-blue-600">Domain</span>
            </>
          ) : (
            <>
              <span className="text-yellow-600">Top-Level Domain</span>
            </>
          )}
        </span>
      ),
    },
    {
      key: "is_blacklisted",
      header: "Allow / Block Status",
      accessor: (row) => (
        <span className="flex items-center gap-2 font-semibold">
          {row.is_blacklisted ? (
            <>
              <CircleX className="text-red-600" size={20} />{" "}
              <span className="text-red-600">Blocked</span>
            </>
          ) : (
            <>
              <CircleCheck className="text-green-600" size={20} />{" "}
              <span className="text-green-600">Allowed</span>
            </>
          )}
        </span>
      ),
    },
  ];

  const handleDelete = (id: number) => {
    setDeleting(true);
    setDeleteId(id);
    setErrorMessage("");
    mutate(id);
  };

  return (
    <div className="flex-1 p-5">
      <div className="flex mb-5 lg:justify-end">
        <CreateDomain size="sm" affiliate_id={uid} />
      </div>
      {errorMessage && <AlertMessage type="error" message={errorMessage} />}
      <div>
        <DataTable
          columns={columns}
          queryKey={queryKey}
          queryFn={(page, perPage) =>
            domain.affiliate({ affiliate_id: uid, page, perPage })
          }
          pagination={true}
          massSelection={false}
          responsive={true}
          renderActions={(domain) => (
            <div className="flex items-center gap-1 md:gap-2 md:ml-2">
              <ConfirmationPopUp
                message={`Are you sure you want to delete ${domain.domain}?`}
                onConfirm={() => handleDelete(domain.id)}
              >
                <button
                  disabled={deleting}
                  className="p-1 text-red-600 transition rounded-full md:p-2 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Delete Member"
                >
                  {deleting && deleteId === domain.id ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </ConfirmationPopUp>
            </div>
          )}
        />
      </div>
      <HelpButton 
        category="Configuration" 
        pageTitle="Configuration"
      />
    </div>
  );
}

export default Domains;
