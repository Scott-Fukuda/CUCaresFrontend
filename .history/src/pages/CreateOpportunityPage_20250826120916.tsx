import React, { useState, useRef } from 'react';
import { Opportunity, Organization, allInterests } from '../types';
import { PageState } from '../App';
import * as api from '../api';

interface CreateOpportunityPageProps {
  currentUser: any;
  organizations: Organization[];
  setPageState: (state: PageState) => void;
}

const CreateOpportunityPage: React.FC<CreateOpportunityPageProps> = ({ currentUser, organizations, setPageState }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    causes: [] as string[],
    date: '',
    time: '',
    duration: 60, // Default 60 minutes
    totalSlots: 10,
    nonprofit: '',
    host_org_id: '',
    address: ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      causes: selectedCauses
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
        console.log('Uploading image file:', imageFile.name, imageFile.type, imageFile.size);
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        try {
          console.log('Sending image upload request to /upload');
          const uploadResponse = await fetch('http://localhost:8000/upload', {
            method: 'POST',
            body: imageFormData,
          });
          
          console.log('Upload response status:', uploadResponse.status);
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Upload error response:', errorText);
            throw new Error(`Failed to upload image: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          console.log('Upload result:', uploadResult);
          imageUrl = uploadResult.url; // Assuming the response contains the S3 URL
          console.log('Extracted image URL:', imageUrl);
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
      formData.causes.forEach(cause => {
        formDataToSend.append('causes', cause);
      });
      formDataToSend.append('date', `${formData.date}T${formData.time}:00`);
      formDataToSend.append('duration', formData.duration.toString());
      formDataToSend.append('total_slots', formData.totalSlots.toString());
      formDataToSend.append('nonprofit', formData.nonprofit);
      formDataToSend.append('host_org_id', formData.host_org_id);
      formDataToSend.append('host_user_id', currentUser.id.toString());
      formDataToSend.append('address', formData.address);

      // Add image URL if uploaded
      if (imageUrl) {
        console.log('Adding image URL to form data:', imageUrl);
        formDataToSend.append('image', imageUrl);
      } else {
        console.log('No image URL to add to form data');
      }

      // Make the API call
      await api.createOpportunity(formDataToSend);

      setSuccess(true);
      setTimeout(() => {
        setPageState({ page: 'opportunities' });
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
            onClick={() => setPageState({ page: 'opportunities' })}
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
                Causes *
              </label>
              <select
                name="causes"
                multiple
                value={formData.causes}
                onChange={handleCausesChange}
                required
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
                name="totalSlots"
                value={formData.totalSlots}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nonprofit Name *
              </label>
              <input
                type="text"
                name="nonprofit"
                value={formData.nonprofit}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                placeholder="Enter nonprofit name"
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
                Address/Location *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                placeholder="Enter the location or address for this opportunity"
              />
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
              onClick={() => setPageState({ page: 'opportunities' })}
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
