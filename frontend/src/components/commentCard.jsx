import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/axios";

const CommentCard = ({ comment, onCommentUpdated, onCommentDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user"));
  const isOwner = user.user_id === comment.user.id;

  const deleteComment = async () => {
    try {
      await api.delete(`/posts/${comment.post}/comments/${comment.id}/`);
      console.log("Comment deleted successfully");
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const updateComment = async () => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await api.put(`/posts/${comment.post}/comments/${comment.id}/`, {
        content: editContent
      });
      console.log("Comment updated successfully");
      setIsEditing(false);
      
      if (onCommentUpdated) {
        onCommentUpdated(response.data);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  return (
    <div className="w-2/3 h-auto overflow-y-auto p-4 flex flex-row gap-2 border rounded-2xl justify-between my-3">
      <div className="flex flex-row items-start w-full">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage
            src={`http://127.0.0.1:8000${comment.user.profile_picture}`}
          />
          <AvatarFallback>
            {comment.user?.username?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col ml-2 w-full">
          <p className="text-sm sm:text-base font-medium text-muted-foreground">
            {comment.user?.username || "Unknown"}
          </p>
          
          {isEditing ? (
            <div className="mt-1 w-full">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={updateComment}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  {isSubmitting ? "Updating..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="break-words">{comment.content}</p>
          )}
        </div>
      </div>
      
      {isOwner && !isEditing && (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 cursor-pointer">
              <span className="text-gray-500">...</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-red-500" 
                onClick={deleteComment}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default CommentCard;