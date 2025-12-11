"use client"

import { useState, useMemo } from "react"
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"
import type { Employee, LeaveRequest } from "../types"
import { defaultEmployees, defaultLeaveRequests } from "../types"
import { PrimaryModal } from "../../PrimaryModal"
import { PrimaryButton } from "../../PrimaryButton"
import { PrimaryInput } from "../../PrimaryInput"

export function LeaveRequest() {
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(defaultLeaveRequests)
  const [activeTab, setActiveTab] = useState<"employees" | "leave">("employees")
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [isRequestingLeave, setIsRequestingLeave] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [leaveFilter, setLeaveFilter] = useState<"All" | LeaveRequest['status']>("All")
  
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
    name: "",
    email: "",
    role: "",
  })

  const [newLeaveRequest, setNewLeaveRequest] = useState<Omit<LeaveRequest, 'id' | 'status' | 'employeeName'>>({
    employeeId: "",
    type: "Annual",
    startDate: "",
    endDate: "",
  })

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.role.toLowerCase().includes(employeeSearch.toLowerCase())
  )

  const filteredLeaveRequests = leaveRequests.filter(request => 
    (leaveFilter === "All" || request.status === leaveFilter)
  )

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    const nextId = `E-${String(employees.length + 1).padStart(4, "0")}`
    setEmployees([...employees, { id: nextId, ...newEmployee }])
    setNewEmployee({ name: "", email: "", role: "" })
    setIsAddingEmployee(false)
  }

  const handleRequestLeave = (e: React.FormEvent) => {
    e.preventDefault()
    const employee = employees.find((emp) => emp.id === newLeaveRequest.employeeId)
    if (!employee) return
    const nextId = `L-${String(leaveRequests.length + 1).padStart(4, "0")}`
    setLeaveRequests([
      ...leaveRequests,
      {
        id: nextId,
        employeeId: employee.id,
        employeeName: employee.name,
        type: newLeaveRequest.type,
        startDate: newLeaveRequest.startDate,
        endDate: newLeaveRequest.endDate,
        status: "Pending",
      },
    ])
    setNewLeaveRequest({
      employeeId: "",
      type: "Annual",
      startDate: "",
      endDate: "",
    })
    setIsRequestingLeave(false)
  }

  const handleUpdateLeaveStatus = (id: string, status: LeaveRequest['status']) => {
    setLeaveRequests((prev) =>
      prev.map((request) => (request.id === id ? { ...request, status } : request))
    )
  }

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const statusStyles = {
      Pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
      Approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
      Rejected: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    }
    
    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-[#18aead]">Leave Requests</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[20px] border border-[#1a2446] bg-[#0e1629] overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "employees"
                  ? "bg-[#142044] text-white border-[#18aead]"
                  : "text-blue-200 hover:bg-[#121c3d] hover:text-white"
              }`}
            >
              Employees
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("leave")}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "leave"
                  ? "bg-[#142044] text-white border-[#18aead]"
                  : "text-blue-200 hover:bg-[#121c3d] hover:text-white"
              }`}
            >
              Leave Requests
            </button>
          </div>
          {activeTab === "employees" ? (
            <PrimaryButton
              onClick={() => setIsAddingEmployee(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Add Employee
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => setIsRequestingLeave(true)}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Request Leave
            </PrimaryButton>
          )}
        </div>
      </div>

      {activeTab === "employees" ? (
        <>
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#18aead] focus-within:ring-1 focus-within:ring-[#18aead] lg:max-w-xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
            <table className="min-w-full divide-y divide-[#1a2446]">
              <thead className="bg-[#0e1629]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Name</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Email</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Role</span>
                  </th>
                  <th scope="col" className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="cursor-pointer transition-colors hover:bg-[#121c3d]"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff] text-xs font-semibold text-white">
                              {employee.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{employee.name || "--"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-blue-200">{employee.email || "--"}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-blue-200">{employee.role || "--"}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <ChevronRightIcon className="h-5 w-5 text-blue-300/60" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-blue-300">
                      {employeeSearch ? `No employees found for "${employeeSearch}".` : "No employees yet. Add one to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PrimaryModal
            open={isAddingEmployee}
            title="Add Employee"
            description="Create a new employee profile."
            onClose={() => {
              setIsAddingEmployee(false)
              setNewEmployee({ name: "", email: "", role: "" })
            }}
            widthClassName="max-w-3xl"
          >
            <form onSubmit={handleAddEmployee} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="emp-name" className="block text-sm font-medium text-blue-200">
                    Full Name
                  </label>
                  <PrimaryInput
                    id="emp-name"
                    type="text"
                    required
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="emp-email" className="block text-sm font-medium text-blue-200">
                    Email
                  </label>
                  <PrimaryInput
                    id="emp-email"
                    type="email"
                    required
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="emp-role" className="block text-sm font-medium text-blue-200">
                    Role
                  </label>
                  <PrimaryInput
                    id="emp-role"
                    type="text"
                    required
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEmployee(false)
                    setNewEmployee({ name: "", email: "", role: "" })
                  }}
                  className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit">
                  Save Employee
                </PrimaryButton>
              </div>
            </form>
          </PrimaryModal>
        </>
      ) : (
        <>
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#18aead] focus-within:ring-1 focus-within:ring-[#18aead] lg:max-w-xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
              <input
                type="text"
                placeholder="Search leave requests..."
                className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="leave-filter" className="text-xs font-medium text-blue-200">
                Filter by status:
              </label>
              <select
                id="leave-filter"
                className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3 py-1.5 text-xs font-medium text-blue-100 focus:border-[#18aead] focus:outline-none"
                value={leaveFilter}
                onChange={(e) => setLeaveFilter(e.target.value as "All" | LeaveRequest['status'])}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
            <table className="min-w-full divide-y divide-[#1a2446]">
              <thead className="bg-[#0e1629]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Employee</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Leave Type</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Dates</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Status</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
                {filteredLeaveRequests.length > 0 ? (
                  filteredLeaveRequests.map((request) => {
                    const employee = employees.find(e => e.id === request.employeeId)
                    return (
                      <tr key={request.id} className="transition-colors hover:bg-[#121c3d]">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 flex-shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5468ff] to-[#2bb9ff] text-xs font-semibold text-white">
                                {employee?.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {employee?.name || 'Unknown Employee'}
                              </div>
                              <div className="text-xs text-blue-300">{employee?.role || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-blue-200">{request.type}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-blue-200">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-blue-300/60">
                            {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} days
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {request.status === 'Pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateLeaveStatus(request.id, 'Approved')}
                                className="rounded-[10px] border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateLeaveStatus(request.id, 'Rejected')}
                                className="rounded-[10px] border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-blue-300">
                      {leaveFilter === 'All' 
                        ? 'No leave requests yet. Request one to get started.' 
                        : `No ${leaveFilter.toLowerCase()} leave requests.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PrimaryModal
            open={isRequestingLeave}
            title="Request Leave"
            description="Submit a new leave request for an employee."
            onClose={() => {
              setIsRequestingLeave(false)
              setNewLeaveRequest({
                employeeId: "",
                type: "Annual",
                startDate: "",
                endDate: "",
              })
            }}
            widthClassName="max-w-3xl"
          >
            <form onSubmit={handleRequestLeave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="leave-employee" className="block text-sm font-medium text-blue-200">
                    Employee
                  </label>
                  <select
                    id="leave-employee"
                    required
                    className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                    value={newLeaveRequest.employeeId}
                    onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, employeeId: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="leave-type" className="block text-sm font-medium text-blue-200">
                    Leave Type
                  </label>
                  <select
                    id="leave-type"
                    className="mt-2 w-full rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none"
                    value={newLeaveRequest.type}
                    onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, type: e.target.value })}
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Personal">Personal Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-blue-200">
                    Start Date
                  </label>
                  <PrimaryInput
                    id="start-date"
                    type="date"
                    required
                    value={newLeaveRequest.startDate}
                    onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, startDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-blue-200">
                    End Date
                  </label>
                  <PrimaryInput
                    id="end-date"
                    type="date"
                    required
                    value={newLeaveRequest.endDate}
                    onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, endDate: e.target.value })}
                    min={newLeaveRequest.startDate}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRequestingLeave(false)
                    setNewLeaveRequest({
                      employeeId: "",
                      type: "Annual",
                      startDate: "",
                      endDate: "",
                    })
                  }}
                  className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
                >
                  Cancel
                </button>
                <PrimaryButton type="submit">
                  Submit Request
                </PrimaryButton>
              </div>
            </form>
          </PrimaryModal>
        </>
      )}
    </div>
  )
}
