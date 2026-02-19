import React, { useState, type ReactNode } from "react";
import type { NationalInformation } from "../../pages/Information";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import { BarChart, FileText, Megaphone, Shield } from "lucide-react";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "announcement":
      return <Megaphone className="w-4 h-4" />;
    case "policy":
      return <Shield className="w-4 h-4" />;
    case "report":
      return <BarChart className="w-4 h-4" />;
    case "update":
      return <FileText className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "announcement":
      return "primary";
    case "policy":
      return "success";
    case "report":
      return "danger";
    case "update":
      return "warning";
    default:
      return "gray";
  }
};

function InformationDetails({
  info,
  renderButton,
}: {
  info: NationalInformation;
  renderButton?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 transition rounded-full"
        title="Edit Member Info"
      >
        {renderButton}
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={info.title}
        className="max-w-3xl min-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <Badge variant={getTypeColor(info.type)} className="capitalize">
                {info.type}
              </Badge>
              <Badge
                variant={
                  info.status === "published"
                    ? "success"
                    : info.status === "draft"
                    ? "warning"
                    : "gray"
                }
              >
                {info.status}
              </Badge>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Title
              </label>
              <h2 className="text-lg font-semibold text-gray-900">
                {info.title}
              </h2>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Content
              </label>
              <div className="prose-sm prose text-gray-900 max-w-none">
                {info.content.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Published</label>
                <p className="text-gray-600">
                  {new Date(info.published_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">
                  Last Updated
                </label>
                <p className="text-gray-600">
                  {new Date(info.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default InformationDetails;
