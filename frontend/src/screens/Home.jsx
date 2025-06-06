import React, { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import PostCard from "@/components/PostCard.jsx";
import { useTheme } from "@/components/theme-provider.jsx";
import CreatePost from "@/components/CreatePost.jsx";
import api from "@/lib/axios";
import { toast } from "sonner";
import { motion  } from "framer-motion";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const token = localStorage.getItem("access_token");

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts/", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      setPosts(response.data);
    } catch (error) {
      console.error("There was an error fetching the posts:", error);
      toast.error("Erreur lors du chargement des posts");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
            <div className="my-3">
              <CreatePost onPostCreated={fetchPosts} />
            </div>

            {posts.map((post) => (
                      <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {!(post.groupe) && (<PostCard post={post} key={post.id} />)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
