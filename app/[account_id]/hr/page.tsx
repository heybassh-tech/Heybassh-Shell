import AccountDashboard from "../../components/AccountDashboard"

export default function HRPage({ params }: { params: { account_id: string } }) {
  return <AccountDashboard accountId={params.account_id} initialViewKey="hr_leave_request" />
}

