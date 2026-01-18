import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Opportunity } from '../types';

interface OppLookupProps {
  allTimeOpps: Opportunity[];
}

const OppLookup: React.FC<OppLookupProps> = ({ allTimeOpps }) => {
  const [oppId, setOppId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLookup = () => {
    const id = parseInt(oppId.trim());
    if (isNaN(id)) {
      setError('Please enter a valid opportunity ID (number)');
      return;
    }

    const opportunity = allTimeOpps.find(opp => opp.id === id);
    if (opportunity) {
      setError('');
      navigate(`/opportunity/${id}`);
    } else {
      setError(`Opportunity with ID ${id} not found`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
      <h3 className="text-xl font-bold mb-4">Opportunity Lookup</h3>
      <p className="text-gray-600 mb-4">
        Enter an opportunity ID to view its details. This searches through all historical opportunities.
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={oppId}
          onChange={(e) => setOppId(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter opportunity ID..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
        />
        <button
          onClick={handleLookup}
          className="bg-cornell-red hover:bg-red-800 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Lookup
        </button>
      </div>
      {error && (
        <p className="text-red-600 mt-2 text-sm">{error}</p>
      )}
    </div>
  );
};

export default OppLookup;