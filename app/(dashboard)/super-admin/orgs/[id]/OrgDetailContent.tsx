"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOrgAction, softDeleteUserAction, softDeleteOrgAction, toggleUserMfaAction } from "../../actions";

const TIERS = ["FREE", "PRO", "CONSULTANT", "ENTERPRISE"] as const;

type OrgData = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  assetLimit: number;
  usersLimit: number;
  verticalMarket: string;
  dataResidency: string | null;
  onboardingComplete: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  _count: {
    aiAssets: number;
    riskRegisters: number;
    complianceFrameworks: number;
    auditLogs: number;
  };
};

type UserRow = {
  id: string;
  email: string;
  role: string;
  persona: string | null;
  mfaEnabled: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
};

export function OrgDetailContent({
  org,
  users: initialUsers
}: {
  org: OrgData;
  users: UserRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [tier, setTier] = useState(org.tier);
  const [assetLimit, setAssetLimit] = useState(org.assetLimit);
  const [usersLimit, setUsersLimit] = useState(org.usersLimit);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [users, setUsers] = useState(initialUsers);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [togglingMfa, setTogglingMfa] = useState<string | null>(null);

  const handleToggleMfa = async (u: UserRow) => {
    setTogglingMfa(u.id);
    try {
      await toggleUserMfaAction(u.id, !u.mfaEnabled);
      setUsers((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, mfaEnabled: !usr.mfaEnabled } : usr))
      );
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to toggle MFA."
      });
    } finally {
      setTogglingMfa(null);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setPending(true);
    try {
      await updateOrgAction(org.id, {
        name,
        tier,
        assetLimit,
        usersLimit
      });
      setMessage({ type: "success", text: "Organization updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update organization."
      });
    } finally {
      setPending(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    try {
      await softDeleteUserAction(confirmDeleteUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteUser.id));
      setConfirmDeleteUser(null);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete user."
      });
      setConfirmDeleteUser(null);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleDeleteOrg = async () => {
    setDeletingOrg(true);
    try {
      await softDeleteOrgAction(org.id);
      router.push("/super-admin");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete organization."
      });
      setConfirmDeleteOrg(false);
      setDeletingOrg(false);
    }
  };

  const isDeleted = !!org.deletedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/super-admin"
          className="text-sm text-navy-600 hover:text-navy-500 hover:underline"
        >
          &larr; Back to all organizations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {org.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {org.slug} &middot; Created{" "}
          {new Date(org.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Deleted banner */}
      {isDeleted && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">This organization has been deleted</p>
          <p className="mt-1 text-xs text-red-700">
            Deleted on {new Date(org.deletedAt!).toLocaleDateString()}. All users have been deactivated.
          </p>
        </div>
      )}

      {/* Edit Org Properties */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Organization Properties
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isDeleted}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Asset Limit
            </label>
            <input
              type="number"
              min={0}
              value={assetLimit}
              onChange={(e) => setAssetLimit(parseInt(e.target.value) || 0)}
              disabled={isDeleted}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Users Limit
            </label>
            <input
              type="number"
              min={0}
              value={usersLimit}
              onChange={(e) => setUsersLimit(parseInt(e.target.value) || 0)}
              disabled={isDeleted}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Tier
          </label>
          <div className="mt-2 flex flex-wrap gap-4">
            {TIERS.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="tier"
                  value={t}
                  checked={tier === t}
                  onChange={() => setTier(t)}
                  disabled={isDeleted}
                  className="h-4 w-4 text-navy-600 focus:ring-navy-500"
                />
                <span className="text-sm text-slate-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={pending || isDeleted}
          className="mt-4 rounded-lg bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Org Stats */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Organization Stats</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-slate-600">AI Assets</p>
            <p className="text-xl font-semibold text-slate-900">
              {org._count.aiAssets}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Risk Registers</p>
            <p className="text-xl font-semibold text-slate-900">
              {org._count.riskRegisters}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Compliance Frameworks</p>
            <p className="text-xl font-semibold text-slate-900">
              {org._count.complianceFrameworks}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Audit Log Entries</p>
            <p className="text-xl font-semibold text-slate-900">
              {org._count.auditLogs}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-slate-600">Vertical</p>
            <p className="text-sm font-medium text-slate-900">
              {org.verticalMarket}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Data Residency</p>
            <p className="text-sm font-medium text-slate-900">
              {org.dataResidency ?? "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Onboarding</p>
            <p className="text-sm font-medium text-slate-900">
              {org.onboardingComplete ? "Complete" : "In progress"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Created</p>
            <p className="text-sm font-medium text-slate-900">
              {new Date(org.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">
            Users ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Persona
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  MFA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Super Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                    {u.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {u.role}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                    {u.persona ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleToggleMfa(u)}
                      disabled={togglingMfa === u.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                        u.mfaEnabled
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      } disabled:opacity-50`}
                    >
                      {togglingMfa === u.id
                        ? "..."
                        : u.mfaEnabled
                          ? "Enabled"
                          : "Off"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {u.isSuperAdmin ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUser(u)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No active users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      {!isDeleted && (
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
          <p className="mt-1 text-sm text-slate-600">
            Deleting this organization will deactivate it and all {users.length} user
            {users.length !== 1 ? "s" : ""}. The data will be preserved but inaccessible.
          </p>
          <button
            type="button"
            onClick={() => setConfirmDeleteOrg(true)}
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Delete Organization
          </button>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-medium text-slate-900">Delete user?</h3>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{confirmDeleteUser.email}</span> will lose
              access to the platform. This can be reversed by restoring the user in the database.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                disabled={deletingUser}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingUser ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Org Confirmation Modal */}
      {confirmDeleteOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-medium text-slate-900">Delete organization?</h3>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">{org.name}</span> and all{" "}
              {users.length} user{users.length !== 1 ? "s" : ""} will be deactivated.
              The data will be preserved but inaccessible.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOrg(false)}
                disabled={deletingOrg}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                disabled={deletingOrg}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingOrg ? "Deleting..." : "Delete Organization"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
