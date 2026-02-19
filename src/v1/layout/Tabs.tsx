import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronLeft } from "lucide-react";

export type TabLink = {
  label: string;
  to: string;
  icon?: React.ReactNode;
  children?: TabLink[];
};

type TabsProps = {
  tabs: TabLink[];
  basePath?: string;
  maxVisible?: number;
  maxChildVisible?: number;
  showBackButton?: boolean;
  backButtonProps?: {
    showFullText: boolean;
    animationComplete: boolean;
  };
};

export default function Tabs({
  tabs,
  basePath = "",
  maxVisible = 5,
  maxChildVisible = 5,
  showBackButton = true,
  backButtonProps = { showFullText: true, animationComplete: false },
}: TabsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [visibleTabs, setVisibleTabs] = useState<TabLink[]>([]);
  const [overflowTabs, setOverflowTabs] = useState<TabLink[]>([]);
  const [openMainMore, setOpenMainMore] = useState(false);
  const [selectedParent, setSelectedParent] = useState<TabLink | null>(null);

  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Split tabs into visible + overflow
  useEffect(() => {
    setVisibleTabs(tabs.slice(0, maxVisible));
    setOverflowTabs(tabs.slice(maxVisible));
  }, [tabs, maxVisible]);

  // Keep parent active when child route matches
  useEffect(() => {
    const activeParent = tabs.find((tab) =>
      tab.children?.some(
        (child) => `${basePath}${child.to}` === location.pathname
      )
    );
    if (activeParent) setSelectedParent(activeParent);
  }, [location.pathname, tabs]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !moreButtonRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpenMainMore(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMainTabClick = (tab: TabLink) => {
    if (tab.children && tab.children.length > 0) {
      setSelectedParent((prev) => (prev?.to === tab.to ? null : tab));
    } else {
      navigate(`${basePath}${tab.to}`);
      setSelectedParent(null);
    }
  };

  return (
    <div className="relative w-full border-b border-gray-200 bg-white"> {/* Changed bg-gray-50 to bg-white */}
      {/* Main Tabs with Back Button */}
      <div className="flex items-center">
        {/* Animated Back Button */}
        {showBackButton && (
          <div className="relative group">
            <Link
              to="/affiliates"
              className={`
                inline-flex items-center gap-2 px-4 py-3 text-sm font-medium 
                transition-all duration-500 border-b-2 overflow-hidden whitespace-nowrap
                ${backButtonProps.showFullText ? 'pl-4 pr-4' : 'pl-3 pr-3'}
                ${backButtonProps.animationComplete ? 'pl-3 pr-3' : ''}
                border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300
              `}
              style={{
                minWidth: backButtonProps.animationComplete ? '48px' : backButtonProps.showFullText ? '148px' : '48px',
                transition: 'min-width 500ms ease, padding 500ms ease'
              }}
            >
              <ChevronLeft size={18} />
              <span 
                className={`
                  transition-all duration-500 overflow-hidden
                  ${backButtonProps.showFullText ? 'opacity-100 w-auto ml-1' : 'opacity-0 w-0 ml-0'}
                `}
                style={{
                  marginLeft: backButtonProps.showFullText ? '4px' : '0',
                  transition: 'opacity 500ms ease, width 500ms ease, margin-left 500ms ease'
                }}
              >
                Back to Affiliates
              </span>
            </Link>
            
            {/* Tooltip for collapsed state */}
            {backButtonProps.animationComplete && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="relative">
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                  <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap ml-1">
                    Back to Affiliates
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Tabs */}
        <nav className="flex flex-wrap items-center space-x-2 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.to);

            return (
              <button
                key={tab.to}
                onClick={() => handleMainTabClick(tab)}
                className={`flex items-center py-3 px-3 border-b-2 text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.children && tab.children.length > 0 && (
                  <ChevronDown
                    className={`w-4 h-4 ml-1 transition-transform ${
                      selectedParent?.to === tab.to ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            );
          })}

          {/* Main "More" Dropdown Trigger */}
          {overflowTabs.length > 0 && (
            <div className="relative">
              <button
                ref={moreButtonRef}
                onClick={() => setOpenMainMore(!openMainMore)}
                className="flex items-center px-3 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
              >
                More
                <ChevronDown
                  className={`w-4 h-4 ml-1 transition-transform ${
                    openMainMore ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Outside "More" Dropdown */}
      {openMainMore && (
        <div
          ref={dropdownRef}
          className="fixed z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[12rem]"
          style={{
            top:
              (moreButtonRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
            left:
              (moreButtonRef.current?.getBoundingClientRect().left ?? 0) - 40,
          }}
        >
          {overflowTabs.map((tab) => (
            <button
              key={tab.to}
              onClick={() => {
                handleMainTabClick(tab);
                setOpenMainMore(false);
              }}
              className={`w-full text-left py-2 px-4 text-sm font-medium transition ${
                location.pathname === `${basePath}${tab.to}`
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Child Tabs */}
      {selectedParent?.children && (
        <ChildTabs
          parent={selectedParent}
          basePath={basePath}
          maxVisible={maxChildVisible}
        />
      )}
    </div>
  );
}

/* ---------------- CHILD TABS ---------------- */
function ChildTabs({
  parent,
  basePath,
  maxVisible,
}: {
  parent: TabLink;
  basePath: string;
  maxVisible: number;
}) {
  const location = useLocation();
  const [visibleChildren, setVisibleChildren] = useState<TabLink[]>([]);
  const [overflowChildren, setOverflowChildren] = useState<TabLink[]>([]);
  const [openMore, setOpenMore] = useState(false);

  const moreChildRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleChildren(parent.children?.slice(0, maxVisible) || []);
    setOverflowChildren(parent.children?.slice(maxVisible) || []);
  }, [parent, maxVisible]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !moreChildRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpenMore(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex items-center px-4 space-x-3 overflow-x-auto border-t border-gray-200 bg-white"> {/* Changed bg-gray-50 to bg-white */}
      {visibleChildren.map((child) => (
        <NavLink
          key={child.to}
          to={`${basePath}${child.to}`}
          className={({ isActive }) =>
            `py-2 px-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              isActive
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`
          }
        >
          {child.label}
        </NavLink>
      ))}

      {/* Child "More" Dropdown Trigger */}
      {overflowChildren.length > 0 && (
        <div className="relative">
          <button
            ref={moreChildRef}
            onClick={() => setOpenMore(!openMore)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300"
          >
            More
            <ChevronDown
              className={`w-4 h-4 ml-1 transition-transform ${
                openMore ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}

      {/* Outside Child "More" Dropdown */}
      {openMore && (
        <div
          ref={dropdownRef}
          className="fixed z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[12rem]"
          style={{
            top:
              (moreChildRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
            left:
              (moreChildRef.current?.getBoundingClientRect().left ?? 0) - 40,
          }}
        >
          {overflowChildren.map((child) => (
            <NavLink
              key={child.to}
              to={`${basePath}${child.to}`}
              onClick={() => setOpenMore(false)}
              className={({ isActive }) =>
                `block py-2 px-4 text-sm font-medium transition ${
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}