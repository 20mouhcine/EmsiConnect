import React, { useState } from "react";
import { House, User, GraduationCap, LibraryBig, Users } from "lucide-react";
import { useTheme } from "@/components/theme-provider.jsx";
import {Link} from "react-router-dom";

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
      <>
        {/* Toggle Button - Always visible on mobile, hidden on desktop */}
        <button
            onClick={toggleSidebar}
            className="fixed top-4 right-4 z-20 lg:hidden p-2 rounded hover:text-green-500 hover:bg-green-400/25 transition-colors"
            aria-label="Toggle Sidebar"
        >
          {isOpen ? "✕" : "☰"}
        </button>

        {/* Fixed Sidebar - Off-canvas on mobile when closed, always visible on desktop */}
        <div
            className={`fixed top-18 right-0 h-[calc(100vh-4rem)] w-64 border-r 
    transition-transform duration-300 ease-in-out z-10 p-4 
    ${isDarkTheme ? 'bg-black' : 'bg-white'} 
    ${isOpen ? "translate-x-0" : "translate-x-full"} 
    lg:left-0 lg:translate-x-0 lg:right-auto`}
        >


        <nav>
            <ul className="space-y-2">
              <li className="flex items-center transition-all ease-in-out delay-0 hover:text-green-500 hover:bg-green-400/25 p-1 rounded-lg cursor-pointer">
                <House />
                <Link to="/" className="block py-2 px-4">
                    Fil d'actualité
                </Link>

              </li>
              <li className="flex items-center transition-all ease-in-out delay-0 hover:text-green-500 hover:bg-green-400/25 p-1 rounded-lg cursor-pointer">
                <User />
                  <Link to="/utilisateurs" className="block py-2 px-4">
                    Utilisateurs
                  </Link>
              </li>
              
              <li className="flex items-center transition-all ease-in-out delay-0 hover:text-green-500 hover:bg-green-400/25 p-1 rounded-lg cursor-pointer">
                <LibraryBig />
                  <Link to="/ressources" className="block py-2 px-4">
                  Ressources                  
                  </Link>
              </li>
              <li className="flex items-center transition-all ease-in-out delay-0 hover:text-green-500 hover:bg-green-400/25 p-1 rounded-lg cursor-pointer">
                <Users />
                  <Link to="/groups" className="block py-2 px-4">
                  Groupes
                  </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Overlay for mobile - only appears when sidebar is open */}
        {isOpen && (
            <div
                className="fixed inset-0 opacity-10 bg-opacity-50 z-0 lg:hidden"
                onClick={toggleSidebar}
            />
        )}

        {/* Empty div to create space for the sidebar on desktop */}
        <div className="hidden lg:block w-64"></div>
      </>
  );
};

export default SideBar;