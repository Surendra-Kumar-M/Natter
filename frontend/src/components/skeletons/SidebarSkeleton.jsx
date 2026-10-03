import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  // Create 8 skeleton items
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside
      className="h-full w-full sm:w-72 lg:w-80 border-r border-base-300 
    flex flex-col transition-all duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-base-300 w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-20" />
        </div>
        <div className="skeleton h-8 w-full rounded-lg" />
      </div>

      {/* Skeleton Contacts */}
      <div className="overflow-y-auto w-full py-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 flex items-center gap-3">
            {/* Avatar skeleton */}
            <div className="relative mx-auto sm:mx-0 flex-shrink-0">
              <div className="skeleton size-12 rounded-full" />
            </div>

            {/* User info skeleton */}
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
