import React, { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import PostCard from "@/components/PostCard.jsx";
import { useTheme } from "@/components/theme-provider.jsx";
import api from "@/lib/axios";
import { useParams } from "react-router-dom";

const PostDetail = () => {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [post, setPost] = useState(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/posts/${id}`);
        setPost(response.data);
        setError(null);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]); // Fixed: Added dependency array with id

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDarkTheme ? "bg-black" : "bg-white"
      }`}
    >
      <NavBar />
      <div className="flex mt-4 sm:mt-6 lg:-mt-2">
        <SideBar />
        <div className="flex-1 flex justify-center items-start p-3">
          <div className="w-full max-w-xl">
            {loading ? (
              <div className={`p-4 rounded-lg ${isDarkTheme ? "text-white" : "text-black"}`}>
                Loading post...
              </div>
            ) : error ? (
              <div className="p-4 text-red-500 rounded-lg">
                {error}
              </div>
            ) : post ? (
              <PostCard post={post} />
            ) : (
              <div className={`p-4 rounded-lg ${isDarkTheme ? "text-white" : "text-black"}`}>
                Post not found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;