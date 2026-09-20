import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Opportunity, Organization } from '../types';
import { buildInviteUrl } from '../utils/inviteLink';

interface InviteLinkGeneratorProps {
  organizations: Organization[];
  opportunities: Opportunity[];
}

const QR_PIXELS = 320;

/** Upcoming first, since an invite for a past event is rarely what's wanted. */
const sortOpportunities = (opportunities: Opportunity[]): Opportunity[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDate = opportunities.map((opp) => {
    const [year, month, day] = opp.date.split('-').map(Number);
    return { opp, time: new Date(year, month - 1, day).getTime() };
  });

  const upcoming = withDate.filter((o) => o.time >= today.getTime()).sort((a, b) => a.time - b.time);
  const past = withDate.filter((o) => o.time < today.getTime()).sort((a, b) => b.time - a.time);
  return [...upcoming, ...past].map((o) => o.opp);
};

/**
 * Builds a shareable link (and QR code) that joins whoever follows it to an
 * organization and sends them to an opportunity.
 */
const InviteLinkGenerator: React.FC<InviteLinkGeneratorProps> = ({
  organizations,
  opportunities,
}) => {
  const [orgId, setOrgId] = useState<number | ''>('');
  const [oppId, setOppId] = useState<number | ''>('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sortedOrgs = useMemo(
    () => [...organizations].sort((a, b) => a.name.localeCompare(b.name)),
    [organizations]
  );
  const sortedOpps = useMemo(() => sortOpportunities(opportunities), [opportunities]);

  const inviteUrl =
    orgId !== '' && oppId !== ''
      ? buildInviteUrl(window.location.origin, orgId, oppId)
      : null;

  const selectedOrg = sortedOrgs.find((o) => o.id === orgId);
  const selectedOpp = sortedOpps.find((o) => o.id === oppId);

  useEffect(() => {
    if (!inviteUrl) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(inviteUrl, { width: QR_PIXELS, margin: 2 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((e) => {
        console.error('QR generation failed:', e);
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  // A fresh link invalidates the "Copied!" confirmation.
  useEffect(() => {
    setCopied(false);
  }, [inviteUrl]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied in some browsers; the URL is on screen to copy by hand.
      setCopied(false);
    }
  };

  const fileName = `invite-${selectedOrg?.name ?? 'org'}-${oppId}.png`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-');

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg border">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Invite link & QR code</h2>
      <p className="text-gray-600 mb-6">
        Anyone who follows this link joins the organization and lands on the event. People without
        an account are asked to create one first, then continue automatically.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red"
          >
            <option value="">Select an organization...</option>
            {sortedOrgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity</label>
          <select
            value={oppId}
            onChange={(e) => setOppId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red"
          >
            <option value="">Select an opportunity...</option>
            {sortedOpps.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.name} — {opp.date}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!inviteUrl ? (
        <p className="text-sm text-gray-500">
          Pick an organization and an opportunity to generate the link.
        </p>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 mb-2">
              Joins <span className="font-semibold">{selectedOrg?.name}</span> and opens{' '}
              <span className="font-semibold">{selectedOpp?.name}</span>.
            </p>
            <div className="flex items-center gap-2 mb-3">
              <input
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopy}
                className="flex-shrink-0 bg-cornell-red text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={fileName}
                className="text-sm text-cornell-red font-semibold hover:underline"
              >
                Download QR code
              </a>
            )}
          </div>

          <div className="flex-shrink-0 mx-auto md:mx-0">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code linking to ${inviteUrl}`}
                width={QR_PIXELS}
                height={QR_PIXELS}
                className="border rounded-lg"
              />
            ) : (
              <div
                style={{ width: QR_PIXELS, height: QR_PIXELS }}
                className="border rounded-lg flex items-center justify-center text-sm text-gray-500"
              >
                Generating QR code...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteLinkGenerator;
