import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServiceJournal, downloadServiceJournalCSV, getOpportunities } from "../api";
import { auth } from "../firebase-config";
import { User, Organization, Opportunity } from "../types";
import PastAttendedOpportunities from "../components/PastAttendedOpportunities";

type ServiceJournalEntry = {
  id: number;
  name: string;
  date: string;
  duration: number;
  attended: boolean;
};

interface ServiceJournalProps {
  currentUser: User;
  allOrgs: Organization[];
  allTimeOpps: Opportunity[];
  setAllTimeOpps: React.Dispatch<React.SetStateAction<Opportunity[] | []>>;
}

const ServiceJournal: React.FC<ServiceJournalProps> = ({ currentUser, allOrgs, allTimeOpps, setAllTimeOpps }) => {
  const { userId } = useParams<{ userId: string }>();
  console.log("User ID from URL:", userId);
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<ServiceJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
      } else {
        console.error("No current user found in Firebase.");
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get Firebase token
        const currentUserAuth = auth.currentUser;
        if (!currentUserAuth) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        const token = await currentUserAuth.getIdToken();

        if (!userId) {
          setError("Missing user ID");
          setLoading(false);
          return;
        }

        // Fetch allTimeOpps if not already loaded
        if (allTimeOpps.length === 0) {
          const allOppsData = await getOpportunities();
          setAllTimeOpps(allOppsData);
        }

        // Fetch service journal data
        const serviceJournalData = await getServiceJournal(userId, token);
        console.log("Service Journal API data:", JSON.stringify(serviceJournalData, null, 2));

        setOpportunities(serviceJournalData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, allTimeOpps.length, setAllTimeOpps]);

  // Derived statistics
  const totalHours = opportunities.reduce((sum, opp) => sum + opp.duration / 60, 0);
  const attendanceRate =
    opportunities.length > 0
      ? Math.round(
        (opportunities.filter((opp) => opp.attended).length /
          opportunities.length) *
        100
      )
      : 0;

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Service Journal</h1>

      {/* Summary Stats */}
      <div className="flex justify-between mb-6">
        <div>Total Hours Served: <strong>{totalHours.toFixed(2)}</strong></div>
        <div>Attendance Rate: <strong>{attendanceRate}%</strong></div>
      </div>

      {/* Table */}
      {opportunities.length === 0 ? (
        <p>No volunteer records found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Event ID</th>
              <th className="border p-2">Event Name</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Hours</th>
              <th className="border p-2">Attended</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr key={opp.id}>
                <td className="border p-2 text-center">{opp.id}</td>
                <td className="border p-2">{opp.name}</td>
                <td className="border p-2">
                  {new Date(opp.date).toLocaleDateString()}
                </td>
                <td className="border p-2 text-center">{(opp.duration / 60).toFixed(2)}</td>
                <td className="border p-2 text-center">
                  {opp.attended ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={async () => {
            if (!userId || !token) {
              console.error("Cannot download CSV: missing userId or token");
              return;
            }
            try {
              await downloadServiceJournalCSV(userId, token);
            } catch (err) {
              console.error("CSV download failed:", err);
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Download CSV
        </button>
      </div>

      {/* Past Opportunities Component */}
      <PastAttendedOpportunities
        opportunities={allTimeOpps}
        currentUser={currentUser}
        allOrgs={allOrgs}
        loading={loading}
      />
    </div>

  );
};

export default ServiceJournal;