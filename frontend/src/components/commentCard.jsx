import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CommentCard = ({comment}) => {
  return (
    <div className="w-full h-1/2 overflow-y-auto p-4 flex flex-row  gap-2">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarImage
            src={`http://127.0.0.1:8000${comment.user.profile_picture}`}
          />
          <AvatarFallback>
            {comment.user?.username?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      <div className="flex flex-col ml-2">
        <p className="text-sm sm:text-base font-medium text-muted-foreground">
          {comment.user?.username || "Unknown"}
        </p>
        <p>{comment.content}</p>
      </div>
    </div>
  );
};

export default CommentCard;
