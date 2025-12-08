'use client';

// Simplified password manager UI:
// Renders a read‑only “items used” report styled to match Heybassh.

export type PersistedVault = {
  cipher: string;
  iv: string;
  salt: string;
  lastUpdated: number;
  entryCount: number;
};

export type PasswordManagerProps = {
  embedded?: boolean;
  headline?: string;
  description?: string;
};

type ReportItem = {
  id: string;
  name: string;
  vault: string;
  type: string;
  lastUsed: string;
  iconBg: string;
  iconLabel: string;
};

const SAMPLE_ITEMS: ReportItem[] = [
  {
    id: '1',
    name: 'tumblr',
    vault: 'Social',
    type: 'Login',
    lastUsed: '22 Mar 2018 at 11:41 am',
    iconBg: 'bg-slate-900 text-white',
    iconLabel: 't',
  },
  {
    id: '2',
    name: 'AgileBits Inc. Team – Jeff Shiner',
    vault: 'Demo',
    type: 'Login',
    lastUsed: '21 Mar 2018 at 1:49 pm',
    iconBg: 'bg-sky-600 text-white',
    iconLabel: 'A',
  },
  {
    id: '3',
    name: 'AgileBits Wi‑Fi: Office',
    vault: 'Team',
    type: 'Wireless Router',
    lastUsed: '15 Mar 2018 at 4:23 pm',
    iconBg: 'bg-amber-500 text-slate-900',
    iconLabel: 'Wi',
  },
  {
    id: '4',
    name: 'Sales Zapier',
    vault: 'Sales',
    type: 'Login',
    lastUsed: '08 Mar 2018 at 10:14 am',
    iconBg: 'bg-orange-500 text-white',
    iconLabel: 'Sz',
  },
  {
    id: '5',
    name: 'Gmail – Demo',
    vault: 'Demo',
    type: 'Login',
    lastUsed: '06 Mar 2018 at 8:49 am',
    iconBg: 'bg-rose-500 text-white',
    iconLabel: 'G',
  },
];

export default function PasswordManagerApp({
  embedded = true,
  headline = 'Items used',
  description,
}: PasswordManagerProps) {
  return (
    <div className={embedded ? 'bg-white rounded-lg' : 'bg-white rounded-lg shadow-sm'}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {headline}
          </p>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Showing {SAMPLE_ITEMS.length} items used
            </span>
          <select className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none">
            <option>Sort by Last Used</option>
            <option>Sort by Item Name</option>
            <option>Sort by Vault</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Item Name
              </th>
              <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vault
              </th>
              <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Item Type
              </th>
              <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Used
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {SAMPLE_ITEMS.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${item.iconBg}`}
                    >
                      {item.iconLabel}
      </div>
                    <span className="text-sm font-medium text-slate-900">{item.name}</span>
        </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.vault}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.type}</td>
                <td className="px-4 py-3 text-right text-sm text-slate-500">
                  {item.lastUsed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}







