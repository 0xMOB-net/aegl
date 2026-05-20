export function StatusBadge({ status }) {
  const config = {
    pending:             { label: 'En attente',            className: 'badge-pending' },
    host_assigned:       { label: 'Hébergeur assigné',     className: 'badge-assigned' },
    documents_provided:  { label: 'Documents fournis',     className: 'badge-provided' },
    documents_verified:  { label: 'Documents vérifiés',    className: 'badge-verified' },
    attestation_pending: { label: '✍️ Signature en attente', className: 'badge-attestation' },
    documents_ready:     { label: 'À confirmer',            className: 'badge-attestation' },
    confirmed:           { label: 'Confirmé ✓',            className: 'badge-confirmed' },
  };
  const { label, className } = config[status] || { label: status, className: 'badge-pending' };
  return <span className={className}>{label}</span>;
}

export function DossierStepper({ status }) {
  const steps = [
    { key: 'pending',            label: 'En attente',    short: '1' },
    { key: 'host_assigned',      label: 'Hébergeur',     short: '2' },
    { key: 'documents_provided', label: 'Documents',     short: '3' },
    { key: 'attestation_pending', label: 'Signature',    short: '4' },
    { key: 'confirmed',          label: 'Confirmé',      short: '5' },
  ];

  const stepStatus = (stepKey) => {
    const stepOrder = {
      pending: 0,
      host_assigned: 1,
      documents_provided: 2,
      documents_verified: 2,
      attestation_pending: 3,
      documents_ready: 3,
      confirmed: 4,
    };
    const stepIdx = stepOrder[stepKey] ?? 0;
    const curr = stepOrder[status] ?? 0;
    if (status === 'confirmed') return 'done';
    if (curr > stepIdx) return 'done';
    if (curr === stepIdx) return 'active';
    return 'upcoming';
  };

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const s = stepStatus(step.key);
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                s === 'done'     ? 'bg-green-700 border-green-700 text-white'
                : s === 'active' ? 'bg-white border-green-700 text-green-700'
                : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {s === 'done' ? '✓' : step.short}
              </div>
              <p className={`text-xs mt-1.5 text-center leading-tight w-16 ${
                s === 'active' ? 'text-green-700 font-semibold'
                : s === 'done' ? 'text-green-600'
                : 'text-gray-400'
              }`}>{step.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${
                stepStatus(steps[i + 1].key) !== 'upcoming' || s === 'done'
                  ? 'bg-green-600'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'green' }) {
  const colors = {
    green:  'bg-green-50 text-green-700 border-green-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    red:    'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || colors.green}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm mt-1 opacity-80">{label}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
