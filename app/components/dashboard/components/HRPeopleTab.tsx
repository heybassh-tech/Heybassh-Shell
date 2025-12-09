"use client"

import { useState, useMemo } from "react"
import type { Employee, LeaveRequest } from "../types"
import { defaultEmployees, defaultLeaveRequests } from "../types"

export function HRPeopleTab() {
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(defaultLeaveRequests)
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", role: "" })
  const [leaveForm, setLeaveForm] = useState({ employeeId: "", type: "Annual", startDate: "", endDate: "" })
  const [leaveFilter, setLeaveFilter] = useState("All")

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) => leaveFilter === "All" || request.status === leaveFilter)
  }, [leaveRequests, leaveFilter])

  function handleAddEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newEmployee.name || !newEmployee.email || !newEmployee.role) return
    const nextId = `E-${String(employees.length + 1).padStart(4, "0")}`
    setEmployees([...employees, { id: nextId, ...newEmployee }])
    setNewEmployee({ name: "", email: "", role: "" })
  }

  function handleSubmitLeave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) return
    const employee = employees.find((emp) => emp.id === leaveForm.employeeId)
    if (!employee) return
    const nextId = `L-${String(leaveRequests.length + 1).padStart(4, "0")}`
    setLeaveRequests([
      ...leaveRequests,
      {
        id: nextId,
        employeeId: employee.id,
        employeeName: employee.name,
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        status: "Pending",
      },
    ])
    setLeaveForm({ employeeId: "", type: "Annual", startDate: "", endDate: "" })
  }

  return (
    <div className="grid gap-5">
      <div className="card rounded-[32px] bg-[#070d20] p-6">
        <h2 className="text-2xl font-semibold text-white">Directory, leave requests, onboarding</h2>
        <p className="mt-2 text-sm text-blue-200">Manage your people data, leave approvals, and onboarding workflows.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card rounded-[32px] bg-[#070d20] p-6">
          <h3 className="text-xl font-semibold text-white">Add Employee</h3>
          <form className="mt-5 space-y-4" onSubmit={handleAddEmployee}>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <input
                type="text"
                value={newEmployee.name}
                onChange={(event) => setNewEmployee((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full name"
                className="w-full bg-transparent text-sm text-blue-100 placeholder-blue-300/70 focus:outline-none"
              />
            </div>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <input
                type="email"
                value={newEmployee.email}
                onChange={(event) => setNewEmployee((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                className="w-full bg-transparent text-sm text-blue-100 placeholder-blue-300/70 focus:outline-none"
              />
            </div>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <input
                type="text"
                value={newEmployee.role}
                onChange={(event) => setNewEmployee((prev) => ({ ...prev, role: event.target.value }))}
                placeholder="Role"
                className="w-full bg-transparent text-sm text-blue-100 placeholder-blue-300/70 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-[28px] bg-gradient-to-r from-[#31b0ff] to-[#66d6ff] py-2 text-sm font-semibold text-[#041226] transition hover:brightness-110 disabled:opacity-50"
              disabled={!newEmployee.name || !newEmployee.email || !newEmployee.role}
            >
              Save
            </button>
            <p className="text-xs text-blue-300">Demo only. Persisted in localStorage.</p>
          </form>
        </div>
        <div className="card rounded-[32px] bg-[#070d20] p-6">
          <h3 className="text-xl font-semibold text-white">Request Leave</h3>
          <form className="mt-5 space-y-4" onSubmit={handleSubmitLeave}>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <select
                value={leaveForm.employeeId}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                className="w-full bg-transparent text-sm text-blue-100 focus:outline-none"
              >
                <option value="" className="bg-[#0e1629] text-blue-100">
                  Select employee...
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id} className="bg-[#0e1629] text-blue-100">
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <select
                value={leaveForm.type}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, type: event.target.value }))}
                className="w-full bg-transparent text-sm text-blue-100 focus:outline-none"
              >
                {["Annual", "Sick", "Family", "Remote"].map((type) => (
                  <option key={type} value={type} className="bg-[#0e1629] text-blue-100">
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))}
                placeholder="yyyy/mm/dd"
                className="w-full bg-transparent text-sm text-blue-100 placeholder-blue-300/70 focus:outline-none"
              />
            </div>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={(event) => setLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))}
                placeholder="yyyy/mm/dd"
                className="w-full bg-transparent text-sm text-blue-100 placeholder-blue-300/70 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-[28px] bg-gradient-to-r from-[#31b0ff] to-[#66d6ff] py-2 text-sm font-semibold text-[#041226] transition hover:brightness-110 disabled:opacity-50"
              disabled={!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate}
            >
              Submit
            </button>
          </form>
        </div>
        <div className="card rounded-[32px] bg-[#070d20] p-6">
          <h3 className="text-xl font-semibold text-white">Leave Filter</h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] px-4 py-2">
              <select
                value={leaveFilter}
                onChange={(event) => setLeaveFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-blue-100 focus:outline-none"
              >
                {["All", "Pending", "Approved", "Rejected"].map((option) => (
                  <option key={option} value={option} className="bg-[#0e1629] text-blue-100">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[28px] border border-[#1a2446] bg-[#0e1629] p-4 text-sm text-blue-100">
              <p className="text-blue-300">Employees</p>
              <p className="text-2xl font-semibold text-white">{employees.length}</p>
              <p className="mt-3 text-blue-300">Pending leave requests</p>
              <p className="text-2xl font-semibold text-white">
                {leaveRequests.filter((request) => request.status === "Pending").length}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="card rounded-[32px] bg-[#070d20] p-0">
        <div className="overflow-x-auto rounded-[32px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2446] text-left text-xs font-semibold uppercase tracking-wide text-blue-300">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaveRequests.map((request) => (
                <tr key={request.id} className="border-b border-[#1a2446]/40 last:border-b-0">
                  <td className="px-4 py-3 text-sm text-blue-300">{request.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{request.employeeName}</td>
                  <td className="px-4 py-3 text-sm text-blue-200">{request.type}</td>
                  <td className="px-4 py-3 text-sm text-blue-200">{request.startDate}</td>
                  <td className="px-4 py-3 text-sm text-blue-200">{request.endDate}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === "Approved"
                          ? "bg-[#183b2e] text-[#7fffb4]"
                          : request.status === "Rejected"
                            ? "bg-[#3b1822] text-[#ff7fa1]"
                            : "bg-[#152038] text-[#7ed0ff]"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredLeaveRequests.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-blue-300">
                    No leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

