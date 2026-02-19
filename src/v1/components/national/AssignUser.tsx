import Badge from "@/components/ui/Badge";
import useDebounce from "@/hooks/useDebounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { affiliate } from "@v1/api/affiliate";
import { national } from "@v1/api/national";
import Modal from "@v1/components/ui/Modal";
import SearchableFilter from "@v1/components/ui/SearchableFilter";
import SearchInput from "@v1/components/ui/SearchInput";
import { readableName } from "@v1/helpers/formatter";
import {
  Check,
  Loader2,
  RefreshCcw,
  User,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

type UserOption = {
  id: number;
  label: string;
};

export default function AssignUser({ roles }: { roles: any[] }) {
  const { id, sub } = useParams<{ id?: string; sub?: string }>();
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliate_id, setAffiliateId] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const debounceAffiliateSearch = useDebounce(affiliateSearch, 500);

  const queryClient = useQueryClient();
  const queryKey = ["national-leaders", sub ?? id];

  /** ------------------ Queries ------------------ */

  // const { data: roles, isFetching: rolesFetching } = useQuery({
  //   queryKey: ["roles-options"],
  //   queryFn: () => national.roleOptions(),
  // });

  const {
    data: affiliates,
    isLoading,
    isFetching: fetchingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options", { debounceAffiliateSearch }],
    queryFn: () => affiliate.options(debounceAffiliateSearch),
  });

  const hasCachedAffiliateOptions =
    queryClient.getQueryData([
      "affiliates-options",
      { debounceAffiliateSearch },
    ]) !== undefined;

  const {
    data: usersResponse,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useQuery({
    queryKey: ["user-options", { debouncedSearch, id, affiliate_id }],
    queryFn: () => national.users(Number(id), debouncedSearch, affiliate_id),
    // enabled: !!id,
  });

  /** ------------------ Stable State ------------------ */

  const [roleId, setRoleId] = useState<number | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  /** ------------------ Map API users ------------------ */

  const users: UserOption[] =
    usersResponse?.map((user: any) => ({
      id: user.user_id,
      label: `${user.first_name} ${user.last_name}`,
      affiliate: user?.affiliate?.name ?? null,
    })) ?? [];

  const availableUsers = users.filter(
    (u) => !selectedUsers.some((s) => s.id === u.id)
  );

  /** ------------------ Handlers ------------------ */

  const addUser = (user: UserOption) => {
    setSelectedUsers((prev) => [...prev, user]);
    setErrors((prev) => ({ ...prev, user_ids: [] }));
  };

  const removeUser = (id: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { value } = e.target;
    setAffiliateId(value);
  };

  /** ------------------ Mutation ------------------ */

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      national.assign({
        role_id: roleId,
        user_ids: selectedUsers.map((u) => u.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSelectedUsers([]);
      setRoleId(undefined);
      setErrors({});
      setOpen(false);
      toast.success("Users assigned successfully");
    },
    onError: (err: any) => {
      if (err?.errors) setErrors(err.errors);
      toast.error("Something went wrong");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["user-options", { debouncedSearch, id, affiliate_id }],
    });
  };

  /** ------------------ UI ------------------ */

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        <UserCog size={16} />
        Assign Users
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Assign Users to Role"
        className="max-w-5xl"
      >
        <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
          {/* Form Content - Scrollable */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Select Role <span className="text-red-500">*</span>
              </label>
              <select
                value={roleId ?? ""}
                onChange={(e) => setRoleId(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                required
              >
                <option value="">Choose a role...</option>
                {roles &&
                  roles?.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.label ?? readableName(role.name)}
                    </option>
                  ))}
              </select>
              {errors.role_id && (
                <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
                  <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.role_id[0]}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Selected Users Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  Selected Users
                </label>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {selectedUsers.length} selected
                </span>
              </div>

              {selectedUsers.length > 0 ? (
                <div className="p-3 border border-blue-100 rounded-lg bg-blue-50">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="inline-flex items-center gap-1.5 bg-white border border-blue-200 rounded-md px-2 py-1 text-xs shadow-sm hover:shadow transition-shadow group"
                      >
                        <User
                          size={12}
                          className="flex-shrink-0 text-blue-600"
                        />
                        <span className="text-gray-900 font-medium text-xs max-w-[200px]">
                          {user.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                          className="p-0.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          title="Remove user"
                        >
                          <X
                            size={12}
                            className="text-gray-400 group-hover:text-red-600"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50">
                  <UserPlus size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No users selected yet</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Search and add users from the list below
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Available Users Section */}
            <div className="space-y-3">
              <div className="flex gap-2 px-1">
                <SearchableFilter
                  label="Affiliate"
                  name="affiliate_id"
                  value={affiliate_id}
                  onChange={handleChange}
                  options={[
                    ...(!hasCachedAffiliateOptions && fetchingAffiliates
                      ? [{ label: "Fetching Affiliates...", value: "" }]
                      : [
                          { label: "Select affiliate", value: "" },
                          ...(affiliates?.map((m) => ({
                            label: `${m.name}`,
                            value: m.id,
                          })) ?? []),
                        ]),
                  ]}
                  searchValue={affiliateSearch}
                  onSearchChange={setAffiliateSearch}
                  loading={
                    isLoading ||
                    (!hasCachedAffiliateOptions && fetchingAffiliates)
                  }
                />
                {/* Search Input */}
                <div className="flex-1">
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    User
                  </label>
                  <SearchInput
                    placeholder="Search by First Name, Last Name, or Member ID..."
                    value={search}
                    onChange={(value) => setSearch(value)}
                    className="flex-1 w-full py-1.5! shadow-none!"
                    onClear={() => setSearch("")}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-transparent">
                    Refresh
                  </label>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className={`
                inline-flex items-center gap-2 px-3 py-2 text-xs font-medium
                border rounded-lg transition-all
                bg-white border-gray-300 text-gray-700
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-24
                ${
                  userFetching
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
                  >
                    <RefreshCcw
                      size={14}
                      className={userFetching ? "animate-spin" : ""}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
                <div className="overflow-y-auto divide-y divide-gray-100 max-h-64">
                  {userLoading || userFetching ? (
                    <div className="px-4 py-8 text-center">
                      <Loader2
                        size={24}
                        className="mx-auto mb-2 text-gray-400 animate-spin"
                      />
                      <p className="text-sm text-gray-500">Loading users...</p>
                    </div>
                  ) : availableUsers.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <User size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">No users found</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {search
                          ? "Try adjusting your search"
                          : "All users have been selected"}
                      </p>
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addUser(user)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 group"
                      >
                        <div className="flex items-center flex-1 min-w-0 gap-3">
                          <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 transition-colors bg-gray-100 rounded-full group-hover:bg-blue-100">
                            <User
                              size={14}
                              className="text-gray-600 group-hover:text-blue-600"
                            />
                          </div>
                          <span className="gap-2 text-xs font-medium text-gray-900">
                            {user.affiliate && (
                              <>
                                <Badge variant="primary" className="text-xs">
                                  <span>{user.affiliate}</span>
                                </Badge>
                                <span className="mx-2">-</span>
                              </>
                            )}
                            <span> {user.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <span>Add</span>
                          <UserPlus size={14} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {errors.user_ids && (
                <p className="flex items-center gap-1 mt-2 text-xs text-red-600">
                  <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                  {errors.user_ids[0]}
                </p>
              )}
            </div>
          </div>

          {/* Actions - Fixed Footer */}
          <div className="flex items-center justify-end flex-shrink-0 gap-3 px-6 py-4 border-t border-gray-200 ">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || selectedUsers.length === 0 || !roleId}
              className="px-5 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Assign Users</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
