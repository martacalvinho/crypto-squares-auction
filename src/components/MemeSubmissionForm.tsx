import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

interface MemeSubmissionFormProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export const MemeSubmissionForm: React.FC<MemeSubmissionFormProps> = ({ onClose, onSubmit }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting meme:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4"
      >
        <h2 className="text-2xl font-bold mb-6">Submit Your Meme</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Meme Image</label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
              ) : (
                <div className="py-8">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-400">
                    Drop your meme here or click to upload
                  </p>
                </div>
              )}
              <input
                type="file"
                name="memeImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                required
              />
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700"
              required
            />
          </div>

          {/* Twitter Handle */}
          <div>
            <label className="block text-sm font-medium mb-2">Twitter Handle</label>
            <input
              type="text"
              name="twitterHandle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700"
              placeholder="@"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              name="category"
              className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700"
              required
            >
              <option value="">Select a category</option>
              <option value="project-vs-project">Project vs Project</option>
              <option value="david-vs-goliath">David vs Goliath</option>
              <option value="this-week-in-crypto">This Week in Crypto</option>
              <option value="classic-memes">Classic Memes</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
            >
              {loading ? 'Submitting...' : 'Submit Meme'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default MemeSubmissionForm;
