import React, { useState, useRef } from 'react';
import { allInterests, Opportunity, Organization } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../api';
import { formatDateTimeForBackend } from '../utils/timeUtils';

// Helper function to transform opportunity from backend format to frontend format
const transformOpportunityFromBackend = (opp: any): Opportunity => {
  // Parse the date string from backend (e.g., "Sat, 26 Sep 2026 18:30:00 GMT" or "2025-08-18T18:17:00")
  const dateObj = new Date(opp.date);
  
  // Extract date and time components
  const dateOnly = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Extract time in HH:MM:SS format
  let timeOnly;
  if (opp.date.includes('GMT')) {
    // GMT format - convert to Eastern Time (UTC-4)
    const gmtHours = dateObj.getUTCHours();
    const easternHours = (gmtHours - 4 + 24) % 24; // Convert GMT to Eastern
    const hours = easternHours.toString().padStart(2, '0');
    const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
    timeOnly = `${hours}:${minutes}:${seconds}`;
  } else {
    // Already Eastern Time - use as is
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    timeOnly = `${hours}:${minutes}:${seconds}`;
  }
  
  // Transform involved users if they exist
  const transformedInvolvedUsers = opp.involved_users ? opp.involved_users.map((involvedUser: any) => {
    const user = involvedUser.user || involvedUser;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      interests: user.interests || [],
      friendIds: user.friends || [],
      organizationIds: (user.organizations || []).map((org: any) => org.id) || [],
      admin: user.admin || false,
      gender: user.gender,
      graduationYear: user.graduation_year,
      academicLevel: user.academic_level,
      major: user.major,
      birthday: user.birthday,
      points: user.points || 0,
      registration_date: user.registration_date,
      phone: user.phone,
      car_seats: user.car_seats || 0,
      bio: user.bio,
      registered: involvedUser.registered || false,
      attended: involvedUser.attended || false,
    };
  }) : [];
  
  // Use image URL directly from backend
  const resolvedImageUrl = opp.image_url || opp.image || opp.imageUrl || 'https://campus-cares.s3.us-east-2.amazonaws.com';
  
  return {
    id: opp.id,
    name: opp.name,
    nonprofit: opp.nonprofit || null,
    description: opp.description,
    date: dateOnly,
    time: timeOnly,
    duration: opp.duration,
    total_slots: opp.total_slots || 10,
    imageUrl: resolvedImageUrl,
    points: opp.duration || 0,
    causes: opp.causes !== undefined ? opp.causes : [],
    isPrivate: false,
    host_id: opp.host_user_id || opp.host_org_id,
    host_org_id: opp.host_org_id,
    host_org_name: opp.host_org_name,
    involved_users: transformedInvolvedUsers,
    address: opp.address || '',
    approved: opp.approved !== undefined ? opp.approved : true,
    attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
    visibility: opp.visibility !== undefined ? opp.visibility : [],
    comments: opp.comments !== undefined ? opp.comments : [],
    qualifications: opp.qualifications !== undefined ? opp.qualifications : [],
    tags: opp.tags !== undefined ? opp.tags : [],
    redirect_url: opp.redirect_url !== undefined ? opp.redirect_url : null
  } as unknown as Opportunity;
};

interface CreateOpportunityPageProps {
  currentUser: any;
  organizations: Organization[];
  opportunities: Opportunity[];
  setOpportunities: (opportunities: Opportunity[] | ((prev: Opportunity[]) => Opportunity[])) => void;
}

const CreateOpportunityPage: React.FC<CreateOpportunityPageProps> = ({ 
  currentUser, 
  organizations,  // Add this parameter
  opportunities,
  setOpportunities
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const clonedOpportunityData = location.state?.clonedOpportunityData;

  // Update the initial formData state to use cloned data
  const [formData, setFormData] = useState({
    name: clonedOpportunityData?.name || '',
    description: clonedOpportunityData?.description || '',
    cause: clonedOpportunityData?.causes || [] as string[],
    tags: clonedOpportunityData?.tags || [] as string[],
    date: clonedOpportunityData?.date || '',
    time: clonedOpportunityData?.time || '',
    duration: clonedOpportunityData?.duration || 60,
    total_slots: clonedOpportunityData?.total_slots || 10,
    nonprofit: clonedOpportunityData?.nonprofit || '',
    host_org_id: clonedOpportunityData?.host_org_id || '',
    address: clonedOpportunityData?.address || '',
    redirect_url: clonedOpportunityData?.redirect_url || ''
    ,
    // New fields for private events and visibility (list of org ids)
    isPrivate: clonedOpportunityData?.isPrivate || false,
    visibility: clonedOpportunityData?.visibility || [] as number[],
  });

  // Add image preview state for cloned images
  const [imagePreview, setImagePreview] = useState<string | null>(
    clonedOpportunityData?.imageUrl || null
  );
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For searchable org selector when event is private
  const [orgFilter, setOrgFilter] = useState<string>('');

  // Filtered + alphabetically sorted organizations for the checklist
  const filteredOrgs = organizations
    .filter(org => org.name.toLowerCase().includes(orgFilter.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleOrgSelection = (orgId: number) => {
    setFormData(prev => {
      const current: number[] = Array.isArray(prev.visibility) ? prev.visibility : [];
      const exists = current.includes(orgId);
      const next = exists ? current.filter(id => id !== orgId) : [...current, orgId];
      return { ...prev, visibility: next } as typeof prev;
    });
  };

  const isOrgSelected = (orgId: number) => {
    return Array.isArray(formData.visibility) && (formData.visibility as number[]).includes(orgId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCausesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCauses = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      cause: selectedCauses
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      tags: selectedTags
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = '';
      
      // Upload image first if selected
      if (imageFile) {
        //console.log('Uploading image file:', imageFile.name, imageFile.type, imageFile.size);
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        try {
          //console.log('Sending image upload request to /upload');
          const uploadResponse = await fetch('https://cucaresbackend.onrender.com/upload', {
            method: 'POST',
            body: imageFormData,
          });
          
          //console.log('Upload response status:', uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload error response:', errorText);
            throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          //console.log('Upload result:', uploadResult);
          imageUrl = uploadResult.url; // Assuming the response contains the S3 URL
          //console.log('Extracted image URL:', imageUrl);
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          setError(`Image upload failed: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add all the form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      // Add causes as array
      formData.cause.forEach((cause: string) => {
        formDataToSend.append('causes', cause);
      });
      // Add tags as array
      formData.tags.forEach((tag: string) => {
        formDataToSend.append('tags', tag);
      });
      formDataToSend.append('date', formatDateTimeForBackend(formData.date, formData.time));
      formDataToSend.append('duration', formData.duration.toString());
      formDataToSend.append('total_slots', formData.total_slots.toString());
      formDataToSend.append('nonprofit', formData.nonprofit);
      formDataToSend.append('host_org_id', formData.host_org_id);
      formDataToSend.append('host_user_id', currentUser.id.toString());
      formDataToSend.append('address', formData.address);
      
      // Add redirect URL if provided
      if (formData.redirect_url.trim()) {
        formDataToSend.append('redirect_url', formData.redirect_url.trim());
      }

      // Add image URL if uploaded
      if (imageUrl) {
        //console.log('Adding image URL to form data:', imageUrl);
        formDataToSend.append('image', imageUrl);
      } else {
        //console.log('No image URL to add to form data');
      }

      // If private, append visibility org ids as a single JSON field (numbers)
      // This ensures the backend receives a JSON array of integers instead of
      // multiple string entries (FormData always serializes values as strings).
      if (formData.isPrivate && Array.isArray(formData.visibility)) {
        try {
  formData.visibility.forEach(id => formDataToSend.append('visibility', id));
        } catch (e) {
          console.error('Failed to serialize visibility array', e);
        }
      }

      // Make the API call
      const newOpp = await api.createOpportunity(formDataToSend);
      console.log('Created opportunity (raw):', newOpp);

      // Transform the opportunity to match the frontend format
      const transformedOpp = transformOpportunityFromBackend(newOpp);
      console.log('Transformed opportunity:', transformedOpp);

      // If current user is admin, automatically approve the opportunity
      if (currentUser.admin) {
        const approvedOpp = { ...transformedOpp, approved: true };
        console.log('Admin user - adding approved opportunity:', approvedOpp);
        setOpportunities(prev => [approvedOpp, ...prev]);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/opportunities');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Create New Opportunity</h1>
          <button
            onClick={() => navigate('/opportunities')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Opportunities
          </button>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            Opportunity created successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opportunity Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                placeholder="Enter opportunity name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="15"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Slots *
              </label>
              <input
                type="number"
                name="total_slots"
                value={formData.total_slots}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nonprofit Name (Optional)
              </label>
              <input
                type="text"
                name="nonprofit"
                value={formData.nonprofit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                placeholder="Enter nonprofit name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host Organization *
              </label>
              <select
                name="host_org_id"
                value={formData.host_org_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              >
                <option value="">Select an organization</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address/Location
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                placeholder="Enter the location or address for this opportunity"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redirect Link (Optional)
              </label>
              <input
                type="url"
                name="redirect_url"
                value={formData.redirect_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                placeholder="https://example.com/register"
              />
              <p className="text-xs text-gray-500 mt-1">
                If you would like this opportunity to redirect to an external registration, enter the link here.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              placeholder="Describe the opportunity..."
            />
          </div>

          {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <select
                name="tags"
                multiple
                value={formData.tags}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              >
                <option value="Rides Provided">Rides Provided</option>
                <option value="Food Provided">Food Provided</option>
                <option value="Fundraiser">Fundraiser</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
            </div> */}

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Causes
              </label>
              <select
                name="cause"
                multiple
                value={formData.cause}
                onChange={handleCausesChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              >
                {allInterests.map(cause => (
                  <option key={cause} value={cause}>{cause}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple causes</p>
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is this event private? (Only visible to selected organizations)
            </label>
            <select
              name="isPrivate"
              value={formData.isPrivate ? 'yes' : 'no'}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.value === 'yes' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>

            <p className="text-xs text-gray-500 mt-1">
              Private events are only visible to members of the host organization and any other selected organizations.
            </p>

            {formData.isPrivate && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select organizations allowed to see this event</label>
                <input
                  type="text"
                  placeholder="Filter organizations..."
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                />
                <div className="max-h-40 overflow-auto border rounded-lg p-2">
                  {filteredOrgs.map(org => (
                    <label key={org.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={isOrgSelected(org.id)}
                        onChange={() => toggleOrgSelection(org.id)}
                        className="form-checkbox h-4 w-4 text-cornell-red"
                      />
                      <span className="text-sm text-gray-700">{org.name}</span>
                    </label>
                  ))}
                  {filteredOrgs.length === 0 && (
                    <p className="text-sm text-gray-500">No organizations match your search.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opportunity Image
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-cornell-red transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {imageFile ? (
                <div>
                  <p className="text-green-600 font-medium">✓ {imageFile.name} selected</p>
                  <p className="text-sm text-gray-500 mt-1">Click to change or drag a new image</p>
                </div>
              ) : imagePreview ? (
                <div>
                  <img 
                    src={imagePreview} 
                    alt="Cloned opportunity preview" 
                    className="max-h-32 mx-auto mb-2 rounded-lg"
                  />
                  <p className="text-blue-600 font-medium">✓ Using cloned image</p>
                  <p className="text-sm text-gray-500 mt-1">Click to change or drag a new image</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">Click to select or drag an image here</p>
                  <p className="text-sm text-gray-500 mt-1">Supports: JPG, PNG, GIF</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/opportunities')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-cornell-red text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOpportunityPage;
