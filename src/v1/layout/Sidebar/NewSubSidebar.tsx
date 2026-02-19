import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Menu,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export interface SubSidebarItem {
  id: string;
  label: string | React.ReactNode;
  searchableText?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  path?: string;
  guard?: React.ComponentType<{ children: React.ReactNode }>;
  badge?: string | number;
  disabled?: boolean;
  children?: SubSidebarItem[];
  defaultExpanded?: boolean;
}

export interface SubSidebarSection {
  id: string;
  type: "section";
  label?: string | React.ReactNode;
  items: SubSidebarItem[];
  searchable?: boolean;
  searchPlaceholder?: string;
}

export type SubSidebarContent = SubSidebarItem | SubSidebarSection;

interface SubSidebarProps {
  title?: string | React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  items: SubSidebarContent[];
  searchable?: boolean;
  searchPlaceholder?: string;
  mobileButtonPosition?:
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left";
  className?: string;
  sidebarClassName?: string;
  onSearch?: (term: string) => void;
}

const SubSidebar: React.FC<SubSidebarProps> = ({
  title,
  icon: TitleIcon,
  items,
  searchable = false,
  searchPlaceholder = "Search...",
  mobileButtonPosition = "bottom-right",
  className = "",
  sidebarClassName = "",
  onSearch,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionSearchTerms, setSectionSearchTerms] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const defaultExpanded = new Set<string>();
    const currentPathname = window.location.pathname;
    const currentSearch = window.location.search;

    const pathMatches = (itemPath: string): boolean => {
      if (!itemPath) return false;
      const [itemPathname, itemQuery = ""] = itemPath.split("?");
      const currentFullPath = currentPathname + currentSearch;

      if (!itemQuery && !currentSearch) {
        return itemPathname === currentPathname;
      }
      return itemPath === currentFullPath;
    };

    const expandParentsOfActivePath = (
      items: SubSidebarItem[],
      parentIds: string[] = []
    ): boolean => {
      for (const item of items) {
        const isActive = pathMatches(item.path || "");

        if (isActive) {
          parentIds.forEach((id) => defaultExpanded.add(id));
          return true;
        }

        if (item.children) {
          const foundInChildren = expandParentsOfActivePath(item.children, [
            ...parentIds,
            item.id,
          ]);
          if (foundInChildren) return true;
        }
      }
      return false;
    };

    const processContent = (contents: SubSidebarContent[]) => {
      contents.forEach((content) => {
        if (content.type === "section") {
          content.items.forEach((item) => {
            if (item.defaultExpanded && item.children) {
              defaultExpanded.add(item.id);
            }
          });
          expandParentsOfActivePath(content.items);
        } else {
          if (content.defaultExpanded && content.children) {
            defaultExpanded.add(content.id);
          }
          expandParentsOfActivePath([content]);
        }
      });
    };

    processContent(items);
    setExpandedItems(defaultExpanded);
  }, [items]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleSectionSearch = (sectionId: string, value: string) => {
    setSectionSearchTerms(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const itemMatchesSearch = (item: SubSidebarItem, search: string): boolean => {
    const labelText = item.searchableText || 
      (typeof item.label === "string" ? item.label : "");
    const matches = labelText.toLowerCase().includes(search.toLowerCase());

    if (matches) return true;
    if (item.children) {
      return item.children.some((child) => itemMatchesSearch(child, search));
    }
    return false;
  };

  const filterItems = (
    items: SubSidebarItem[],
    search: string
  ): SubSidebarItem[] => {
    if (!search) return items;

    return items
      .map((item) => {
        const hasMatchingChildren = item.children
          ? filterItems(item.children, search).length > 0
          : false;

        const labelText = item.searchableText || 
          (typeof item.label === "string" ? item.label : "");
        const directMatch = labelText
          .toLowerCase()
          .includes(search.toLowerCase());

        if (directMatch || hasMatchingChildren) {
          return {
            ...item,
            children: item.children
              ? filterItems(item.children, search)
              : undefined,
          };
        }
        return null;
      })
      .filter((item): item is SubSidebarItem => item !== null);
  };

  const getFilteredContent = (): SubSidebarContent[] => {
    return items.map((content) => {
      if (content.type === "section") {
        const sectionSearch = sectionSearchTerms[content.id] || "";
        
        if (content.searchable && sectionSearch) {
          const filteredSectionItems = filterItems(content.items, sectionSearch);
          return { ...content, items: filteredSectionItems };
        }
        
        return content;
      }
      
      if (searchable && searchTerm && itemMatchesSearch(content, searchTerm)) {
        return {
          ...content,
          children: content.children
            ? filterItems(content.children, searchTerm)
            : undefined,
        };
      }
      
      return content;
    });
  };

  const filteredContent = getFilteredContent();

  useEffect(() => {
    if (searchTerm || Object.values(sectionSearchTerms).some(term => term)) {
      const allIds = new Set<string>();
      const collectIds = (items: SubSidebarItem[]) => {
        items.forEach((item) => {
          if (item.children && item.children.length > 0) {
            allIds.add(item.id);
            collectIds(item.children);
          }
        });
      };

      filteredContent.forEach((content) => {
        if (content.type === "section") {
          collectIds(content.items);
        } else {
          collectIds([content]);
        }
      });

      setExpandedItems(allIds);
    }
  }, [searchTerm, sectionSearchTerms, filteredContent]);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const renderNavItem = (item: SubSidebarItem, depth: number = 0) => {
    const ItemIcon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const paddingLeft = `${depth * 0.75 + 0.75}rem`;

    if (hasChildren && !item.path) {
      return (
        <li key={item.id} className="w-full">
          <button
            onClick={() => toggleExpanded(item.id)}
            disabled={item.disabled}
            className={`
              group relative flex items-center gap-2 px-3 py-2 text-xs rounded-md 
              transition-all duration-150 w-full text-left hover:bg-gray-50/60
              ${item.disabled ? "opacity-50 pointer-events-none" : ""}
            `}
            style={{ paddingLeft }}
          >
            <span className="flex-shrink-0 text-gray-400 transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </span>
            {ItemIcon && (
              <ItemIcon
                size={15}
                className="flex-shrink-0 text-gray-400 transition-colors duration-150 group-hover:text-gray-600"
              />
            )}
            <span className="flex-1 min-w-0 text-xs truncate transition-colors group-hover:text-gray-800">
              {typeof item.label === "string" ? item.label : item.label}
            </span>
            {item.badge && (
              <span className="ml-2 flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 transition-colors group-hover:bg-gray-200">
                {item.badge}
              </span>
            )}
          </button>

          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {hasChildren && (
              <ul className="mt-1 space-y-1">
                {item.children!.map((child) => renderNavItem(child, depth + 1))}
              </ul>
            )}
          </div>
        </li>
      );
    }

    const navContent = item.path ? (
      <div className="relative w-full">
        <div className="flex items-center w-full">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="absolute left-0 z-10 flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-gray-600"
              style={{ left: `calc(${paddingLeft} - 0.25rem)` }}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          )}

          <NavLink
            to={item.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `
              group relative flex items-center gap-2 px-3 py-2 text-xs rounded-md 
              transition-all duration-150 w-full hover:bg-gray-50/60
              ${
                isActive
                  ? "bg-gray-50 text-gray-900 font-medium border-l-2 border-blue-500"
                  : "text-gray-600 border-l-2 border-transparent"
              }
              ${item.disabled ? "opacity-50 pointer-events-none" : ""}
            `
            }
            style={{
              paddingLeft: hasChildren
                ? `calc(${paddingLeft} + 1rem)`
                : paddingLeft,
            }}
          >
            {ItemIcon && (
              <ItemIcon
                size={15}
                className="flex-shrink-0 text-gray-400 transition-colors duration-150 group-hover:text-gray-600"
              />
            )}
            <span className="flex-1 min-w-0 text-xs truncate transition-colors group-hover:text-gray-800">
              {typeof item.label === "string" ? item.label : item.label}
            </span>
            {item.badge && (
              <span className="ml-2 flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 transition-colors group-hover:bg-gray-200">
                {item.badge}
              </span>
            )}
          </NavLink>
        </div>

        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {hasChildren && (
            <ul className="mt-1 space-y-1">
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </ul>
          )}
        </div>
      </div>
    ) : (
      <div
        className="relative flex items-center w-full gap-2 px-3 py-2 text-xs text-gray-600 group"
        style={{ paddingLeft }}
      >
        {ItemIcon && (
          <ItemIcon size={15} className="flex-shrink-0 text-gray-400" />
        )}
        <span className="flex-1 min-w-0 text-xs truncate">
          {typeof item.label === "string" ? item.label : item.label}
        </span>
        {item.badge && (
          <span className="ml-2 flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
            {item.badge}
          </span>
        )}
      </div>
    );

    return (
      <li key={item.id} className="w-full">
        {item.guard ? <item.guard>{navContent}</item.guard> : navContent}
      </li>
    );
  };

  const renderSectionLabel = (label: string | React.ReactNode) => {
    return (
      <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-gray-500 uppercase truncate w-full">
        {label}
      </div>
    );
  };

  const renderSectionSearch = (section: SubSidebarSection) => {
    if (!section.searchable) return null;

    return (
      <div className="px-3 pb-2">
        <div className="relative">
          <Search
            className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
            size={16}
          />
          <input
            type="text"
            placeholder={section.searchPlaceholder || "Search items..."}
            value={sectionSearchTerms[section.id] || ""}
            onChange={(e) => handleSectionSearch(section.id, e.target.value)}
            className="w-full py-1.5 pl-9 pr-3 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderContent = (contents: SubSidebarContent[]) => {
    if (contents.length === 0) {
      return (
        <li className="px-3 py-4 text-xs text-center text-gray-500">
          No items found
        </li>
      );
    }

    return contents.map((content, index) => {
      if (content.type === "section") {
        const hasSearchResults = content.searchable && 
          sectionSearchTerms[content.id] && 
          content.items.length === 0;

        return (
          <React.Fragment key={content.id}>
            {index > 0 && (
              <li className="my-3">
                <div className="border-t border-gray-200" />
              </li>
            )}
            {content.label && (
              <li key={`${content.id}-label`} className="w-full">
                {renderSectionLabel(content.label)}
              </li>
            )}
            {renderSectionSearch(content)}
            {hasSearchResults ? (
              <li className="px-3 py-4 text-xs text-center text-gray-500">
                No items found
              </li>
            ) : (
              content.items.map((item) => renderNavItem(item, 0))
            )}
          </React.Fragment>
        );
      }
      return renderNavItem(content, 0);
    });
  };

  const renderHeader = () => {
    if (React.isValidElement(title)) {
      return title;
    }

    if (title || TitleIcon) {
      return (
        <div className="flex items-center w-full min-w-0 gap-2">
          {TitleIcon && <TitleIcon className="flex-shrink-0" />}
          {typeof title === "string" && (
            <h2 className="min-w-0 text-lg font-semibold truncate">{title}</h2>
          )}
        </div>
      );
    }

    return null;
  };

  const hasHeader = title || TitleIcon;

  return (
    <>
      <button
        className={`fixed z-30 p-4 bg-white border rounded-full shadow-lg lg:hidden ${positionClasses[mobileButtonPosition]}`}
        onClick={() => setOpen(true)}
        aria-label={typeof title === "string" ? `Open ${title}` : "Open menu"}
      >
        {TitleIcon ? <TitleIcon /> : <Menu />}
      </button>

      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl
          transition-transform duration-300 lg:hidden h-[80vh] flex flex-col
          ${open ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="flex-shrink-0 px-4 pt-4 bg-white border-b">
          {hasHeader ? (
            <div className="flex items-center justify-between min-w-0 gap-2 mb-4">
              <div className="flex-1 min-w-0 overflow-hidden">{renderHeader()}</div>
              <button
                onClick={() => setOpen(false)}
                className="flex-shrink-0 p-1 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X />
              </button>
            </div>
          ) : (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setOpen(false)}
                className="p-1 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X />
              </button>
            </div>
          )}

          {searchable && (
            <div className="relative">
              <Search
                className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 min-h-0 p-4 overflow-x-hidden overflow-y-auto">
          <ul className="w-full space-y-1 text-xs">
            {renderContent(filteredContent)}
          </ul>
        </nav>
      </div>

      <div
        className={`hidden h-full bg-white lg:flex lg:flex-col ${sidebarClassName} ${className}`}
      >
        <div className="flex-shrink-0 min-w-0 p-4">
          {hasHeader && (
            <div className="w-full min-w-0 pb-3 overflow-hidden border-b">
              {renderHeader()}
            </div>
          )}

          {searchable && (
            <div className="relative">
              <Search
                className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 min-h-0 px-4 pb-4 overflow-x-hidden overflow-y-auto">
          <ul className="w-full space-y-1 text-xs">
            {renderContent(filteredContent)}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SubSidebar;