import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "./ui/input";
import { Send } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import userContext from "@/user-context";

const PostCard = ({ post }) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.num_likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Function to safely format the date
  const formatPostDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "recently";
    }
  };

  // Check if the current user has liked this post when component mounts
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const response = await api.get(`/posts/${post.id}/like-status/`);
        setLiked(response.data.user_has_liked);
        setLikeCount(response.data.num_likes);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [post.id]);

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (liked) {
        // Unlike the post
        const response = await api.delete(`/posts/${post.id}/like/`);
        setLikeCount(response.data.num_likes);
        setLiked(false);
      } else {
        // Like the post
        const response = await api.post(`/posts/${post.id}/like/`);
        setLikeCount(response.data.num_likes);
        setLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);

      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to update like. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`mb-4 ${isDarkTheme ? "bg-black" : "bg-white"}`}>
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage
                src={`http://127.0.0.1:8000${post.user.profile_picture}`}
              />
              <AvatarFallback>
                {post.user?.username?.substring(0, 2).toUpperCase() || "UK"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm sm:text-base">
                {post.user?.username || "Unknown"}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {formatPostDate(post.date_creation)}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save Post</DropdownMenuItem>
              <DropdownMenuItem>Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mb-3 sm:mb-4 text-sm sm:text-base">
          {post.contenu_texte}
        </p>
        {post.media && (
          <div className="rounded-lg overflow-hidden mb-3 sm:mb-4">
            <img
              src={`http://127.0.0.1:8000${post.media}`}
              alt="Post content"
              className="w-full object-cover max-h-96"
              onError={(e) => {
                console.error("Image failed to load:", post.media);
                e.target.onerror = null; // Prevent infinite error loop
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-2 sm:h-9 sm:px-3 ${
              liked ? "text-green-500" : ""
            }`}
            onClick={handleLike}
            disabled={isLoading}
          >
            <ThumbsUp
              className={`h-4 w-4 mr-1 sm:mr-2 ${liked ? "fill-current" : ""}`}
            />
            <span className="xs:inline">
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </span>
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button 
                variant="ghost"
                size="sm"
                className="h-8 px-2 sm:h-9 sm:px-3 flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="xs:inline">
                  {post.num_comments || 0} Comments
                </span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="mx-auto flex flex-col items-center md:max-w-xl md:w-3/6 w-full">
              <DrawerHeader className={`flex justify-between items-center w-full p-4 ${isDarkTheme ? "bg-black" : "bg-white"}`}>

                <DrawerTitle>Comments</DrawerTitle>
                <DrawerClose>
                  <Button variant="outline">X</Button>
                </DrawerClose>
                

              </DrawerHeader>
              <DrawerFooter>
                <div className="flex flex-col">

                <form action="" >
                <Input placeholder="Ecrivez un commentaire"/>
            <Button type="submit" variant="ghost"><Send /></Button>
                </form>
                </div>

              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Button variant="ghost" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
            <Bookmark className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Save</span>
            <span className="xs:hidden">Save</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;