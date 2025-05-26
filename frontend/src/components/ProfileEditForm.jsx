import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save, X } from "lucide-react";
import api from "@/lib/axios";

const ProfileEditForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    profile_picture: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePreview, setProfilePreview] = useState(null);

  useEffect(() => {
    // Load user data from localStorage or fetch from API
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        profile_picture: null,
      });
      
      if (user.profile_picture) {
        setProfilePreview(`http://127.0.0.1:8000${user.profile_picture}`);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));

      // Create preview for profile picture
      if (name === "profile_picture") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const formPayload = new FormData();
      
      // Only append fields that were updated
      if (formData.username) formPayload.append("username", formData.username);
      if (formData.bio) formPayload.append("bio", formData.bio);
      if (formData.profile_picture) formPayload.append("profile_picture", formData.profile_picture);

      const response = await api.patch(
        `/users/${user.user_id}/update/`,
        formPayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update user in localStorage
      if (response.data) {
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Reload the page to reflect changes
        window.location.reload();
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium mb-4">Modifier Profile</div>
      
      {/* Profile Picture */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16 relative">
          <AvatarImage src={profilePreview} />
          <AvatarFallback className="bg-gray-300">
            {formData.username?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Label htmlFor="profile_picture" className="cursor-pointer">
            <div className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
              <Camera size={16} />
              <span>Changer photo de profile</span>
            </div>
          </Label>
          <Input 
            type="file" 
            id="profile_picture" 
            name="profile_picture" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange} 
          />
        </div>
      </div>
      

      
      {/* Username */}
      <div>
        <Label htmlFor="username">Nom d'utilisateur</Label>
        <Input 
          type="text" 
          id="username" 
          name="username" 
          value={formData.username} 
          onChange={handleChange} 
          className="mt-1"
          placeholder="Enter username"
        />
      </div>
      

      
      {/* Bio */}
      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea 
          id="bio" 
          name="bio" 
          value={formData.bio} 
          onChange={handleChange} 
          className="mt-1"
          placeholder="Tell us about yourself"
          rows={3}
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" className="flex items-center">
          <X size={16} className="mr-1" /> Annuler
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit} 
          disabled={loading} 
          className="flex items-center"
        >
          <Save size={16} className="mr-1" /> {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditForm;