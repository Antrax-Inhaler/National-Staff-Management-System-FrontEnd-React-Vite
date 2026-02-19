// src/components/dashboard/DashboardNav.tsx
import { type ComponentType, useEffect, useRef } from "react";

interface DashboardNavProps {
  sections: Array<{ 
    id: string; 
    label: string; 
    icon: ComponentType<{ size?: number; className?: string }> 
  }>;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function DashboardNav({
  sections,
  activeSection,
  onSectionChange,
}: DashboardNavProps) {
  const observerRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Setup Intersection Observer for section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            onSectionChange(entry.target.id);
          }
        });
      },
      { 
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-100px 0px -66% 0px' // Adjust these values
      }
    );

    // Observe all sections
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
        observerRefs.current.set(id, element);
      }
    });

    return () => observer.disconnect();
  }, [sections, onSectionChange]);

  // Add scroll margin to sections for better scrolling
  useEffect(() => {
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.scrollMarginTop = '120px'; // Adjust based on header height
      }
    });
  }, [sections]);

  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
<button
  key={section.id}
  onClick={() => {
    onSectionChange(section.id);
    const element = document.getElementById(section.id);
    if (element) {
      // Calculate the offset position more precisely
      const headerOffset = 140; // Total height of sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = window.pageYOffset + elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update URL hash for better browser history
      window.history.pushState({}, '', `#${section.id}`);
    }
  }}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
    isActive
      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`}
>
  <Icon size={16} />
  <span className="text-sm font-medium">{section.label}</span>
</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}