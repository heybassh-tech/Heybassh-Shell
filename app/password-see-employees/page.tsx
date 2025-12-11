"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  account_id: string | null;
  password: string;
  emailVerified: Date | null;
  createdAt: string;
  companyName: string | null;
}

interface ApiResponse {
  users: User[];
  note: string;
}

export default function PasswordSeeEmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    async function loadUsers() {
      try {
        setLoading(true);
        const response = await fetch("/api/password-see-employees");
        const data: ApiResponse | { error: string; message: string } = await response.json();

        if (!response.ok) {
          if (response.status === 403) {
            setError("Access denied. Only super admins can view this page.");
          } else if (response.status === 401) {
            router.push("/");
          } else {
            setError((data as { message?: string }).message || "Failed to load users.");
          }
          return;
        }

        const apiData = data as ApiResponse;
        setUsers(apiData.users);
        setNote(apiData.note);
      } catch (err) {
        console.error("Failed to load users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0b1124] flex items-center justify-center">
        <div className="text-blue-200">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1124] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0e1629] border border-[#1a2446] rounded-lg p-6">
          <h2 className="text-xl font-bold text-rose-400 mb-2">Access Denied</h2>
          <p className="text-blue-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1124] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#18aead] mb-2">Employee Password Access</h1>
          <p className="text-blue-200 text-sm">
            Super Admin Only - View all users and their password information
          </p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-yellow-400 font-semibold mb-1">Super Admin Access</h3>
              <p className="text-yellow-200 text-sm">{note}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0e1629] border border-[#1a2446] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2446] bg-[#121c3d]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Account ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2446]">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-blue-300">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#121c3d]/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-blue-200">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-blue-200">
                        {user.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            user.role === "super_admin"
                              ? "bg-purple-900/30 text-purple-300 border border-purple-700/50"
                              : user.role === "admin"
                              ? "bg-blue-900/30 text-blue-300 border border-blue-700/50"
                              : "bg-gray-900/30 text-gray-300 border border-gray-700/50"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-200 font-mono">
                        {user.account_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <code className="text-xs text-green-300 font-mono bg-[#0b1124] px-2 py-1 rounded border border-[#1a2446]">
                          {user.password}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.emailVerified ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-900/30 text-green-300 border border-green-700/50">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-yellow-900/30 text-yellow-300 border border-yellow-700/50">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-blue-300 text-sm">
            Total Users: <span className="font-semibold text-[#18aead]">{users.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
