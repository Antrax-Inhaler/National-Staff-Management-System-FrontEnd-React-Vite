// src/components/information/ViewInformation.tsx
import React from "react";
import { X, Calendar, User, Eye, Users, FileText, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import { simpleFormatDate } from "@v1/helpers/simpleDateUtils";
import type { NationalInformation, NationalInformationAttachment } from "@v1/pages/national/Information";

interface ViewInformationProps {
  info: NationalInformation;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewInformation({ info, isOpen, onClose }: ViewInformationProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "announcement": return "blue";
      case "news": return "green";
      case "resource": return "purple";
      case "event": return "orange";
      case "policy": return "red";
      default: return "gray";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "success";
      case "draft": return "warning";
      case "archived": return "danger";
      default: return "gray";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={info.title}
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">Type</div>
            <Badge variant={getTypeColor(info.type)} size="sm" className="capitalize">
              {info.type}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">Category</div>
            <div className="capitalize">{info.category}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">Status</div>
            <Badge variant={getStatusColor(info.status)} size="sm" className="capitalize">
              {info.status}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">Published</div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span>{info.published_at ? simpleFormatDate(info.published_at) : "Not published"}</span>
            </div>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">By {info.author}</span>
        </div>

        {/* View Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{info.view_count || 0}</div>
            <div className="text-sm text-blue-500">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{info.reader_count || 0}</div>
            <div className="text-sm text-green-500">Unique Readers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{info.total_views || 0}</div>
            <div className="text-sm text-purple-500">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{info.total_viewers || 0}</div>
            <div className="text-sm text-orange-500">Total Viewers</div>
          </div>
        </div>

        {/* Content */}
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Content</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: info.content }}
            />
          </div>
        </div>

        {/* Attachments */}
        {info.attachments && info.attachments.length > 0 && (
          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Attachments</h3>
            <div className="space-y-2">
              {info.attachments.map((attachment: NationalInformationAttachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{attachment.file_name}</span>
                    <span className="text-xs text-gray-500">
                      ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">Created</div>
            <div className="text-sm text-gray-600">
              {simpleFormatDate(info.created_at)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-500">Last Updated</div>
            <div className="text-sm text-gray-600">
              {simpleFormatDate(info.updated_at)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}