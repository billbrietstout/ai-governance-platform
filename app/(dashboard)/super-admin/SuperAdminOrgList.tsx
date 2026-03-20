"use client";

import { useState } from "react";
import Link from "next/link";

type Org = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  verticalMarket: string;
  createdAt: Date;
  _count: { users: number; aiAssets: number };
};

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-700",
  PRO: "bg-blue-100 text-blue-700",
  CONSULTANT: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-green-100 text-green-700"
};

export function SuperAdminOrgList({ orgs, deletedOrgCount = 0 }: { orgs: Org[]; deletedOrgCount?: number }) {
  const [search, setSearch] = useState("");

  const filtered = orgs.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = orgs.reduce((sum, o) => sum + o._count.users, 0);
  const totalAssets = orgs.reduce((sum, o) => sum + o._count.aiAssets, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Platform Administration
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage all organizations across the platform.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">Super Admin Access</p>
        <p className="mt-1 text-xs text-amber-700">
          You are viewing cross-tenant data. Changes here affect all organizations on the platform.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Total Organizations</p>
          <p className="text-2xl font-semibold text-slate-900">{orgs.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Total Users</p>
          <p className="text-2xl font-semibold text-slate-900">{totalUsers}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Total AI Assets</p>
          <p className="text-2xl font-semibold text-slate-900">{totalAssets}</p>
        </div>
        {deletedOrgCount > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-600">Archived Organizations</p>
            <p className="text-2xl font-semibold text-red-900">{deletedOrgCount}</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Tier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Users
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Assets
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Vertical
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <Link
                    href={`/super-admin/orgs/${org.id}`}
                    className="font-medium text-navy-600 hover:text-navy-500 hover:underline"
                  >
                    {org.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                  {org.slug}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLORS[org.tier] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {org.tier}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                  {org._count.users}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                  {org._count.aiAssets}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                  {org.verticalMarket}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No organizations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
