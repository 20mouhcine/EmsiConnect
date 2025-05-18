import React, { useState } from "react";
import { PenSquare, ImagePlus } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  NavBar,
  SideBar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui"; 
import PostCard from "./PostCard";  
import ProfileEditForm from "./ProfileEditForm";

const Group = ({
  group,
  user,
  posts = [],
  savedPosts = [],
  isDarkTheme = false,
  isOwner = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
            {/* --- Cover Image --- */}
            <div
              className={`relative w-full h-48 rounded-t-lg ${
                isDarkTheme ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              {group.profile_picture ? (
                <img
                  src={group.profile_picture}
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

              {/* --- Avatar --- */}
              <div className="absolute -bottom-16 left-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                  {user?.profile_picture ? (
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

            {/* --- Profile Info --- */}
            <div
              className={`mt-16 p-6 ${
                isDarkTheme ? "bg-gray-900" : "bg-gray-50"
              } rounded-b-lg shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{user?.username}</h1>
                  <p
                    className={`text-sm ${
                      isDarkTheme ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    @{user?.username}
                  </p>
                  {user?.bio && <p className="mt-2 text-sm">{user.bio}</p>}
                </div>

                {isOwner && (
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-1">
                        <PenSquare size={16} />
                        Modifier le profil
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <ProfileEditForm onComplete={() => setIsPopoverOpen(false)} />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* --- Tabs --- */}
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
                      <p className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>
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
                        <p className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>
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

export default Group;