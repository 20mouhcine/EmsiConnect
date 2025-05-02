import React from "react";
import {
  Card,

} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";

const UsersCard = ({ user }) => {
        const { theme } = useTheme();
        const isDarkTheme = theme === 'dark';
  return (
    <div>
      <Card className={`mt-5 ${isDarkTheme ? 'bg-black hover:outline hover:outline-green-500' : 'bg-white hover:bg-gray-100/75'} transition-all duration-200 ease-in-out`}>
        <div className="flex items-center justify-between gap-4 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-full ml-3">
              <AvatarImage src={`http://127.0.0.1:8000${user.profile_picture}`} />
            </Avatar>
            <div className="flex flex-col justify-center mx-2">
              <div className="font-medium text-sm sm:text-base">
                <p>{user.username}</p>
              </div>
              <div className="font-extralight text-sm sm:text-base">
                <p>{user.role}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground mx-2">
              <button className=" rounded-md hover:text-green-500 hover:bg-green-400/25 p-2">Envoyer Message</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UsersCard;
