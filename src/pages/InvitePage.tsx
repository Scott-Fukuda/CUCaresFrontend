import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Organization, User } from '../types';
import { parseInvitePath } from '../utils/inviteLink';

interface InvitePageProps {
  currentUser: User;
  organizations: Organization[];
  /** Joins the org without the confirmation alerts the Groups page shows. */
  joinOrgViaInvite: (orgId: number) => Promise<boolean>;
}

type Status = 'working' | 'failed' | 'invalid';

/**
 * Landing page for a shared invite link: joins the organization, then hands the
 * visitor to the opportunity.
 *
 * Only signed-in users ever reach this component — a signed-out visitor is sent
 * to sign up first and comes back here afterwards, which is the whole point of
 * the link being a real route.
 */
const InvitePage: React.FC<InvitePageProps> = ({ currentUser, organizations, joinOrgViaInvite }) => {
  const navigate = useNavigate();
  const { orgId, oppId } = useParams();
  const target = parseInvitePath(`/invite/${orgId}/${oppId}`);

  const [status, setStatus] = useState<Status>(target ? 'working' : 'invalid');
  // Effects run twice under StrictMode in development; joining once is enough.
  const startedRef = useRef(false);

  const org = target ? organizations.find((o) => o.id === target.orgId) : undefined;

  useEffect(() => {
    if (!target || startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const alreadyMember = (currentUser.organizationIds ?? []).includes(target.orgId);
      const joined = alreadyMember || (await joinOrgViaInvite(target.orgId));

      if (!joined) {
        setStatus('failed');
        return;
      }

      // `replace` so Back returns to wherever the link was opened from rather
      // than re-running the invite.
      navigate(`/opportunity/${target.opportunityId}`, { replace: true });
    };

    run();
  }, [target, currentUser.organizationIds, joinOrgViaInvite, navigate]);

  const orgName = org?.name ?? 'the organization';

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {status === 'working' && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Joining {orgName}...</h1>
          <p className="text-gray-600">Hang tight, we're taking you to the event.</p>
        </>
      )}

      {status === 'invalid' && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This invite link isn't valid</h1>
          <p className="text-gray-600 mb-6">
            Double-check the link or QR code with whoever shared it.
          </p>
          <button
            onClick={() => navigate('/opportunities')}
            className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
          >
            Browse opportunities
          </button>
        </>
      )}

      {status === 'failed' && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">We couldn't add you to {orgName}</h1>
          <p className="text-gray-600 mb-6">
            You can still sign up for the event, and join the group later from the Groups page.
          </p>
          <button
            onClick={() => navigate(`/opportunity/${target?.opportunityId}`, { replace: true })}
            className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold"
          >
            Continue to the event
          </button>
        </>
      )}
    </div>
  );
};

export default InvitePage;
