import { ReactNode } from "react";

export type NavChild = { id: string; label: string };

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  children?: NavChild[];
};

export type ContactStatus = "New" | "In Progress" | "Customer" | "Churned";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  owner: string;
  createdAt: string;
  lastActivity: string;
  status: ContactStatus;
};

// Companies share similar lifecycle fields and status semantics as contacts
export type CompanyStatus = ContactStatus;

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  owner: string;
  createdAt: string;
  lastActivity: string;
  status: CompanyStatus;
};

// Deals track pipeline stage as well as win/loss status
export type DealStage = "New" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";

export type DealStatus = "Open" | "Won" | "Lost";

export type Deal = {
  id: string;
  name: string;
  company: string;
  amount: number;
  owner: string;
  createdAt: string;
  lastActivity: string;
  stage: DealStage;
  status: DealStatus;
  closeDate: string;
  updatedAt: string;
};

export type Product = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export type Task = {
  id: string;
  title: string;
  assignee: string;
  startDate?: string;
  dueDate: string;
  priority: "Low" | "Normal" | "High";
  status: "Todo" | "In Progress" | "Done";
  description?: string;
  tags: string[];
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
};

export type FrontOfficeApp = {
  id: string;
  name: string;
  type: 'website' | 'portal' | 'mobile' | 'chat' | 'helpdesk' | 'survey';
  status: 'active' | 'inactive' | 'maintenance';
  url: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  taxId: string;
  status: 'active' | 'inactive' | 'pending';
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
};

export type Quote = {
  id: string;
  quoteNumber: string;
  clientName: string;
  date: string;
  expiryDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
};

export type Credit = {
  id: string;
  creditNumber: string;
  clientName: string;
  date: string;
  amount: number;
  balance: number;
  status: 'available' | 'used' | 'expired';
};

export type Project = {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  budget: number;
  spent: number;
};

export type Vendor = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: string;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  vendorName: string;
  orderDate: string;
  expectedDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'received' | 'partially_received' | 'cancelled';
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'reimbursed';
  receipt: string | null;
};

export type Transaction = {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'transfer' | 'refund';
  amount: number;
  account: string;
  category: string;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'cancelled';
};

export const priorityOptions: Task["priority"][] = ["Low", "Normal", "High"];
export const statusOptions: Task["status"][] = ["Todo", "In Progress", "Done"];

export const SEARCH_SELECTION_KEY = "heybassh_search_selection";

export const defaultContacts: Contact[] = [];
export const contactStatusOptions: ContactStatus[] = ["New", "In Progress", "Customer", "Churned"];

export const defaultCompanies: Company[] = [];
export const companyStatusOptions: CompanyStatus[] = ["New", "In Progress", "Customer", "Churned"];

export const defaultDeals: Deal[] = [];
export const dealStageOptions: DealStage[] = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
export const dealStatusOptions: DealStatus[] = ["Open", "Won", "Lost"];

export const defaultProducts: Product[] = [
  { sku: "P-1001", name: "Heybassh T-Shirt", category: "Merch", price: 25, stock: 120 },
  { sku: "P-2001", name: "Onboarding Kit", category: "Bundle", price: 199, stock: 15 },
  { sku: "P-3001", name: "Consulting Hour", category: "Service", price: 99, stock: 9999 },
];

export const defaultEmployees: Employee[] = [
  { id: "E-1001", name: "Jane Cooper", email: "jane@heybassh.com", role: "Success Lead" },
  { id: "E-1002", name: "Wade Warren", email: "wade@heybassh.com", role: "Engineer" },
];

export const defaultLeaveRequests: LeaveRequest[] = [];
