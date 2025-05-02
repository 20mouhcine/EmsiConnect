import React, { useState } from "react";
import { Input } from "./ui/input";
import { Search, MessageSquareMore, Bell, CircleUser } from "lucide-react";
import ModeToggle from "./mode-toggle";
import { Separator } from "./ui/separator";
import {useTheme} from "@/components/theme-provider.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NavBar = () => {
  const [showSearch, setShowSearch] = useState(false);

  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
  };

  return (
    <>
      {/* Fixed header with z-index for layering */}
      <header className={`fixed ${isDarkTheme ? 'bg-black' : 'bg-white'} top-0 left-0 right-0 bg-background z-10 mb-5`}>
        <nav className="flex justify-between items-center max-w-7xl mx-auto py-4 px-6">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-green-500 text-2xl font-bold">Emsi</h1>
            <span className="text-2xl font-bold">Connect</span>
          </div>

          {/* Search Section */}
          <div className="flex items-center relative">
            {/* Desktop search bar */}
            <div className="hidden md:block relative w-72">
              <Input type="search" placeholder="Search..." className="pl-10" />
              <span className="absolute inset-y-0 left-3 flex items-center">
                <Search size={18} />
              </span>
            </div>

            {/* Mobile search icon */}
            <button
              onClick={handleSearchToggle}
              className="block md:hidden focus:outline-none"
            >
              <Search size={24} />
            </button>
            <div className="">
              <ul className="flex items-center">
                <li className="rounded-full transition-colors ease-in-out hover:text-green-500 hover:bg-green-400/25 p-2 cursor-pointer ml-3">
                  <MessageSquareMore />
                </li>
                <li className="rounded-full transition-colors ease-in-out hover:text-green-500 hover:bg-green-400/25 p-2 cursor-pointer">
                  <Bell />
                </li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <li className="rounded-full transition-colors ease-in-out hover:text-green-500 hover:bg-green-400/25 p-2 cursor-pointer mr-2 list-none">
                      <CircleUser className="w-6 h-6" />
                    </li>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">

                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">

                      Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer text-red-600 hover:bg-red-50"
                        onClick={() => {
                          localStorage.removeItem("access_token");
                          localStorage.removeItem("user");
                          window.location.href = "/login";
                        }}
                    >

                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <li>
                  <ModeToggle />
                </li>
                <li className="mx-4">
                  <div></div>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <Separator className="" />

        {/* Mobile search bar when clicked */}
        {showSearch && (
          <div className="md:hidden px-6 pb-4 animate-fadeIn">
            <div className="relative w-full">
              <Input type="search" placeholder="Search..." className="pl-10 " />
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search size={18} />
              </span>
            </div>

            {/* Search Results Placeholder */}
            <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-sm">
              {/* You can map search results here */}
              <p className="text-gray-500">Search results will appear here...</p>
            </div>
          </div>
        )}
      </header>
      
      {/* Spacer div to prevent content from hiding under the fixed navbar */}
      <div className="h-10 md:h-20"></div>
    </>
  );
};

export default NavBar;