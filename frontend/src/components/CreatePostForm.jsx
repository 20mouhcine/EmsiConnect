import React, { useState } from "react";
import { ImagePlus, X, Send } from "lucide-react";
import api from "@/lib/axios";

const CreatePostForm = ({ groupId, onPostCreated, currentUser, onCancel }) => {
  const [formData, setFormData] = useState({
    contenu: "",
  });
  const [selectedImage, setSelectedImage] = useState(null); // Changed to single image
  const [previewUrl, setPreviewUrl] = useState(null); // Changed to single preview
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleContentChange = (e) => {
    setFormData({
      ...formData,
      contenu: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Get only the first file
    if (file) {
      setSelectedImage(file);
      
      // Create preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl); // Clean up previous URL
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };

  const removeImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contenu.trim() && !selectedImage) {
      setError("Veuillez ajouter du contenu ou une image");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("contenu_texte", formData.contenu); // Match backend field name
      
      // Add single media file if selected
      if (selectedImage) {
        formDataObj.append("media", selectedImage); // Match backend field name
      }

      // Make API call (you'll need to import your API client)
      const response = await api.post(`/groups/${groupId}/posts/add`, formDataObj, {
  headers: {
    "Content-Type": "multipart/form-data",
    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
  },
});

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.data;

      // Reset form
      setFormData({ contenu: "" });
      setSelectedImage(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      if (onPostCreated) {
        onPostCreated(data);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      const errorMessage = error.response?.data?.detail || "Erreur lors de la création du post. Veuillez réessayer.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedImage(null);
    setFormData({ contenu: "" });
    setError(null);
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white border-gray-200 max-w-2xl mx-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
            {currentUser?.profile_picture ? (
              <img
                src={currentUser.profile_picture.startsWith("http") 
                  ? currentUser.profile_picture 
                  : `http://localhost:8000${currentUser.profile_picture}`}
                alt={currentUser.username}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">
                {currentUser?.username?.substring(0, 2).toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {currentUser?.username || "Utilisateur"}
            </p>
            <p className="text-xs text-gray-600">
              Créer une publication
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Content textarea */}
        <div>
          <textarea
            value={formData.contenu}
            onChange={handleContentChange}
            placeholder="Que voulez-vous partager avec le groupe ?"
            rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300 text-black placeholder-gray-500"
          />
        </div>

        {/* Image preview */}
        {previewUrl && (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-w-sm h-48 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <label htmlFor="post-image" className="cursor-pointer">
              <div className="flex items-center gap-1 px-3 py-1 rounded-md text-sm hover:bg-blue-50 text-blue-600">
                <ImagePlus size={16} />
                <span>Photo</span>
              </div>
              <input
                id="post-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={!!selectedImage} // Disable if image already selected
              />
            </label>
            {selectedImage && (
              <span className="text-xs text-gray-600">
                1 image sélectionnée
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || (!formData.contenu.trim() && !selectedImage)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                "Publication..."
              ) : (
                <>
                  <Send size={14} />
                  Publier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostForm;