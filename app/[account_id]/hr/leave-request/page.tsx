import AccountDashboard from "../../../components/AccountDashboard"

export default function LeaveRequestPage({ params }: { params: { account_id: string } }) {
  return <AccountDashboard accountId={params.account_id} initialViewKey="hr_leave_request" />
}


