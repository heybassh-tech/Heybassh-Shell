"use client"

import { useState, useMemo } from "react"
import type { Employee, LeaveRequest } from "../types"
import { defaultEmployees, defaultLeaveRequests } from "../types"
import { PrimaryModal } from "../../PrimaryModal"

export function LeaveRequest() {
  const [employees] = useState<Employee[]>(defaultEmployees)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(defaultLeaveRequests)
  const [isRequestingLeave, setIsRequestingLeave] = useState(false)
  const [leaveFilter, setLeaveFilter] = useState<"All" | LeaveRequest['status']>("All")
  
  const [newLeaveRequest, setNewLeaveRequest] = useState<Omit<LeaveRequest, 'id' | 'status' | 'employeeName'>>({
    employeeId: "",
    type: "Annual",
    startDate: "",
    endDate: "",
  })

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) => leaveFilter === "All" || request.status === leaveFilter)
  }, [leaveRequests, leaveFilter])

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
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    }
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-white">Leave Requests</h2>
        <button
          onClick={() => setIsRequestingLeave(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Request Leave
        </button>
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
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleRequestLeave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="leave-employee" className="block text-sm font-medium text-gray-300">
                Employee
              </label>
              <select
                id="leave-employee"
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              <label htmlFor="leave-type" className="block text-sm font-medium text-gray-300">
                Leave Type
              </label>
              <select
                id="leave-type"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newLeaveRequest.startDate}
                onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, startDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-300">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                required
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={newLeaveRequest.endDate}
                onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, endDate: e.target.value })}
                min={newLeaveRequest.startDate}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
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
              className="rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Submit Request
            </button>
          </div>
        </form>
      </PrimaryModal>

      <div className="mb-4 flex flex-col justify-between space-y-3 sm:flex-row sm:items-center sm:space-y-0">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search leave requests..."
            className="block w-full rounded-lg border border-gray-700 bg-[#1a2035] py-2 pl-10 pr-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="leave-filter" className="text-sm font-medium text-gray-300">
            Filter by status:
          </label>
          <select
            id="leave-filter"
            className="rounded-lg border border-gray-700 bg-[#1a2035] px-3 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

      <div className="overflow-hidden rounded-lg border border-gray-700 shadow">
        <div className="bg-[#1a2035] px-6 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Leave Requests</h3>
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
              {filteredLeaveRequests.length} {filteredLeaveRequests.length === 1 ? 'Request' : 'Requests'}
            </span>
          </div>
        </div>
        <div className="bg-[#1a2035] px-6 py-4">
          {filteredLeaveRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                      Leave Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                      Dates
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLeaveRequests.map((request) => {
                    const employee = employees.find(e => e.id === request.employeeId)
                    return (
                      <tr key={request.id} className="hover:bg-gray-800">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                                {employee?.name?.charAt(0) || '?'}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {employee?.name || 'Unknown Employee'}
                              </div>
                              <div className="text-sm text-gray-400">{employee?.role || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-300">{request.type}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-300">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} days
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          {request.status === 'Pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateLeaveStatus(request.id, 'Approved')}
                                className="text-green-500 hover:text-green-400"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateLeaveStatus(request.id, 'Rejected')}
                                className="text-red-500 hover:text-red-400"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No leave requests</h3>
              <p className="mt-1 text-sm text-gray-400">
                {leaveFilter === 'All' 
                  ? 'There are no leave requests to display.' 
                  : `There are no ${leaveFilter.toLowerCase()} leave requests.`}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsRequestingLeave(true)}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


