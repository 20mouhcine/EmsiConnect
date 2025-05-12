import { formatDistanceToNow } from "date-fns";
import fr from "date-fns/locale/fr";

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
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentCard from "./commentCard";
import { toast } from "sonner";

const PostCard = ({ post }) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.num_likes || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.num_comments || 0);
  const [content, setContent] = useState("");
  const [comments, setComments] = useState([]);

  // Function to safely format the date
  const formatPostDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
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

    // Check if the current user has saved this post
    const checkSaveStatus = async () => {
      try {
        const response = await api.get(`/posts/${post.id}/save-status/`);
        setSaved(response.data.user_has_saved);
      } catch (error) {
        console.error("Error checking save status:", error);
      }
    };

    checkLikeStatus();
    checkSaveStatus();
  }, [post.id]);

  const handleCommentUpdated = (updatedComment) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDeleted = (commentId) => {
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== commentId)
    );
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await api.get(`/posts/${post.id}/comments/`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    fetchComments();
  }, [post.id]);

  const deletePost = async () => {
    try {
      await api.delete(`/posts/${post.id}/delete/`);
      toast.success("Post deleted successfully.");
      // Optionally, you can redirect or update the UI to reflect the deletion
      window.location.reload();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post. Please try again.");
    }
  };

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

  const handleSave = async () => {
    if (isSaveLoading) return;

    setIsSaveLoading(true);
    try {
      if (saved) {
        const response = await api.delete(`/posts/${post.id}/save/`);
        setSaved(false);
        toast.success("Post removed from saved items");
      } else {
        const response = await api.post(`/posts/${post.id}/save/`);
        setSaved(true);
        toast.success("Publication enregistrée avec succes ");
      }
    } catch (error) {
      console.error("Error toggling save:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update saved status. Please try again.");
      }
    } finally {
      setIsSaveLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("content", content);
    try {
      const response = await api.post(
        `/posts/${post.id}/comments/create/`,
        formData,
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("access_token"),
          },
        }
      );
      setCommentCount(response.data.num_comments);
      setContent("");
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    }
  };

  return (
    <Card className={`mb-4 ${isDarkTheme ? "bg-black" : "bg-white"}`}>
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage
                src={
                  post.user?.profile_picture?.startsWith("http")
                    ? post.user.profile_picture
                    : `http://127.0.0.1:8000${post.user.profile_picture}`
                }
              />
              <AvatarFallback>
                {post.user?.username?.substring(0, 2).toUpperCase() || "UK"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm sm:text-base">
                <Link
                  to={`/profile/${post.user?.id}`}
                  className="hover:underline"
                >
                  {post.user?.username || "Unknown"}
                </Link>
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
              {(() => {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const currentPath = window.location.pathname;
                const isOwner =
                  currentPath === "/profile/" ||
                  currentPath === `/profile/${storedUser?.user_id}`;
                return isOwner ? (
                  <>
                    <DropdownMenuItem>Modifier</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={deletePost}
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleSave}>
                      {saved ? "Unsave Post" : "Save Post"}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Report</DropdownMenuItem>
                  </>
                );
              })()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mb-3 sm:mb-4 text-sm sm:text-base">
          {post.contenu_texte}
        </p>
        {post.media && (
          <div className="rounded-lg overflow-hidden mb-3 sm:mb-4">
            <img
              src={
                post.media?.startsWith("http")
                  ? post.media
                  : `http://127.0.0.1:8000${post.media}`
              }
              alt="Post content"
              className="w-full object-cover max-h-96"
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

          <Drawer className="">
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 sm:h-9 sm:px-3 flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="xs:inline">{commentCount || 0} Comments</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="mx-auto flex flex-col items-center md:max-w-xl md:w-3/6 w-full sm:h-1/2 ">
              <DrawerHeader
                className={`flex justify-between items-center w-full p-4 ${
                  isDarkTheme ? "bg-black" : "bg-white"
                }`}
              >
                <DrawerTitle>Commentaires</DrawerTitle>
                <DrawerDescription></DrawerDescription>
                <DrawerClose>
                  <Button variant="outline">X</Button>
                </DrawerClose>
              </DrawerHeader>
              <ScrollArea className="w-full h-1/2 p-4 flex flex-col gap-2 overflow-y-auto">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      onCommentUpdated={handleCommentUpdated}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    Aucun commentaire pour l'instant
                  </div>
                )}
              </ScrollArea>
              <DrawerFooter>
                <form onSubmit={handleSubmit} className="flex flex-row gap-2">
                  <Input
                    placeholder="Ecrivez un commentaire"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    className="rounded-full p-1 transition-all ease-in-out delay-0 hover:text-green-500 hover:bg-green-400/25"
                  >
                    <Send />
                  </Button>
                </form>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 sm:h-9 sm:px-3 ${saved ? "text-green-500" : ""}`}
            onClick={handleSave}
            disabled={isSaveLoading}
          >
            <Bookmark 
              className={`h-4 w-4 mr-1 sm:mr-2 ${saved ? "fill-current" : ""}`} 
            />
            <span className="hidden xs:inline">{saved ? "Saved" : "Save"}</span>
            <span className="xs:hidden">{saved ? "Saved" : "Save"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;