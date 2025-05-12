import React, { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PenSquare, ImagePlus } from "lucide-react";
import api from "@/lib/axios";
import PostCard from "@/components/PostCard";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ProfileEditForm from "@/components/ProfileEditForm";
import { useParams } from "react-router-dom";

const Profile = () => {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const storedUser = JSON.parse(localStorage.getItem("user"));

      if (!storedUser || !storedUser.user_id) {
        console.warn("Utilisateur non connecté ou incomplet dans localStorage");
        setIsLoading(false);
        return;
      }

      try {
        const userId = id || storedUser.user_id;
        setIsOwner(userId.toString() === storedUser.user_id.toString());

        // Fetch user posts
        const postResponse = await api.get(`/post/user/${userId}/`, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("access_token"),
          },
        });
        setPosts(postResponse.data.posts);

        // Fetch saved posts only for the owner
        if (userId.toString() === storedUser.user_id.toString()) {
          const savedPostsResponse = await api.get(`/saved-posts/`, {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("access_token"),
            },
          });
          setSavedPosts(savedPostsResponse.data);
        }

        // Fetch user details
        const userResponse = await api.get(`/users/${userId}/`, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("access_token"),
          },
        });
        setUser(userResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="text-center mt-20">Chargement du profil...</div>;
  }

  if (!user) {
    return <div className="text-center mt-20">Utilisateur non trouvé</div>;
  }

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDarkTheme ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <NavBar />
      <div className="flex mt-4 sm:mt-6 lg:-mt-2">
        <SideBar />
        <div className="flex-1 flex justify-center items-start p-3">
          <div className="w-full max-w-2xl">
            {/* Cover Image */}
            <div
              className={`relative w-full h-48 rounded-t-lg ${
                isDarkTheme ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              {user.coverImage ? (
                <img
                  src={user.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                isOwner && (
                  <div className="absolute bottom-4 right-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ImagePlus size={16} />
                      <span className="hidden sm:inline">
                        Ajouter une couverture
                      </span>
                    </Button>
                  </div>
                )
              )}

              {/* Avatar */}
              <div className="absolute -bottom-16 left-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                  {user.profile_picture ? (
                    <AvatarImage
                      src={`http://127.0.0.1:8000${user.profile_picture}`}
                      alt="Avatar"
                    />
                  ) : null}
                  <AvatarFallback
                    className={`text-3xl ${
                      isDarkTheme ? "bg-gray-700" : "bg-gray-300"
                    }`}
                  >
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile Info */}
            <div
              className={`mt-16 p-6 ${
                isDarkTheme ? "bg-gray-900" : "bg-gray-50"
              } rounded-b-lg shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.username}</h1>
                  <p
                    className={`text-sm ${
                      isDarkTheme ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    @{user.username}
                  </p>
                  {user.bio && <p className="mt-2 text-sm">{user.bio}</p>}
                </div>

                {/* Modifier le profil visible seulement si propriétaire */}
                {isOwner && (
                  <Popover
                    open={isPopoverOpen}
                    onOpenChange={setIsPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <PenSquare size={16} />
                        Modifier le profile
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <ProfileEditForm
                        onComplete={() => setIsPopoverOpen(false)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="posts">
                <TabsList className="w-full">
                  <TabsTrigger value="posts" className="flex-1">
                    Publications
                  </TabsTrigger>
                  {isOwner && (
                    <TabsTrigger value="media" className="flex-1">
                      Enregistrements
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="posts" className="mt-4">
                  {posts.length > 0 ? (
                    <div className="space-y-6">
                      {posts.map((post) => (
                        <PostCard post={post} key={post.id} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p
                        className={
                          isDarkTheme ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        Aucune publication pour le moment
                      </p>
                    </div>
                  )}
                </TabsContent>

                {isOwner && (
                  <TabsContent value="media" className="mt-4">
                    {savedPosts.length > 0 ? (
                      <div className="space-y-6">
                        {savedPosts.map((savedPost) => (
                          <PostCard 
                            key={savedPost.id} 
                            post={savedPost.post} 
                            isSavedPost={true} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p
                          className={
                            isDarkTheme ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Aucun enregistrement pour le moment
                        </p>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;