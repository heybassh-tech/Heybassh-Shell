import AccountDashboard from "../../../components/AccountDashboard"

export default function UsersPage({ params }: { params: { account_id: string } }) {
  return <AccountDashboard accountId={params.account_id} initialViewKey="hr_users" />
}



