import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Search, MessageSquareMore, Bell, CircleUser } from "lucide-react";
import ModeToggle from "./mode-toggle";
import { Separator } from "./ui/separator";
import { useTheme } from "@/components/theme-provider.jsx";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import api from '@/lib/axios';
import { toast } from 'sonner';
import LogoImg from "../../public/logo.png";

const NavBar = () => {
  // State for search UI
  const [showSearch, setShowSearch] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search...");
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");

  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("access_token");

  // Update the current path whenever the component mounts
  useEffect(() => {
    // Get the current path from window.location
    const path = window.location.pathname;
    setCurrentPath(path);
    
    // Determine search context based on current route
    updateSearchContext(path);
    
    // Reset search when location changes
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Listen for popstate events to detect navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      
      // Update search placeholder based on path
      updateSearchContext(path);
      
      // Reset search
      setSearchQuery("");
      setSearchResults([]);
    };

    window.addEventListener("popstate", handleLocationChange);
    
    // Handle URL changes from other parts of the application
    const intervalId = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== currentPath) {
        setCurrentPath(currentPath);
        updateSearchContext(currentPath);
      }
    }, 500);
    
    // Cleanup
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(intervalId);
    };
  }, [currentPath]);

  // Helper function to update search context based on path
  const updateSearchContext = (path) => {
    if (path.startsWith("/user") || path.startsWith("/profile")) {
      setSearchPlaceholder("Search for users...");
    } else if (path.startsWith("/posts") || path === "/") {
      setSearchPlaceholder("Search for posts...");
    } else if (path.startsWith("/events")) {
      setSearchPlaceholder("Search for events...");
    } else if (path.startsWith("/groups")) {
      setSearchPlaceholder("Search for groups...");
    } else {
      setSearchPlaceholder("Search...");
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  const performSearch = async (query) => {
    setIsSearching(true);
    
    try {
      const path = currentPath;
      let endpoint = '/posts/search/';
      
      // Determine which endpoint to call based on current path
      if (path.startsWith("/user") || path.startsWith("/profile")) {
        endpoint = '/users/search/';
      } else if (path.startsWith("/events")) {
        endpoint = '/events/search/';
      } else if (path.startsWith("/groups")) {
        endpoint = '/groups/search/';
      }
      
      // Make the API call
      const response = await api.get(`${endpoint}?query=${query}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      // Process results based on endpoint type
      if (endpoint === '/users/search/') {
        setSearchResults(response.data.map(user => ({
          id: user.id,
          name: user.name || user.username,
          type: "user",
          avatar: user.profile_image || null
        })));
      } 
      else if (endpoint === '/posts/search/') {
        setSearchResults(response.data.map(post => ({
          id: post.id,
          title: post.contenu_texte ? (post.contenu_texte.substring(0, 60) + (post.contenu_texte.length > 60 ? '...' : '')) : 'Untitled post',
          type: "post",
          author: post.user?.username  || "Unknown",
          date: new Date(post.date_creation).toLocaleDateString()
        })));
      } 
      
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erreur lors de la recherche");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
  };

  const navigateTo = (path) => {
    window.location.href = path;
  };

  // Get the correct URL for a search result
  const getResultUrl = (result) => {
    switch (result.type) {
      case "user":
        return `/profile/${result.id}`;
      case "post":
        return `/posts/${result.id}`;
     
      default:
        return '/';
    }
  };

  // Render appropriate search result based on type
  const renderSearchResult = (result) => {
    switch (result.type) {
      case "user":
        return (
          <div className="flex items-center">
            {result.avatar ? (
              <img src={result.avatar} alt={result.name} className="w-6 h-6 rounded-full mr-2" />
            ) : (
              <CircleUser className="w-6 h-6 mr-2 text-muted-foreground" />
            )}
            <span>{result.name}</span>
          </div>
        );
        
      case "post":
        return (
          <div>
            <div className="truncate">{result.title}</div>
            <div className="text-xs text-muted-foreground">
              By {result.author} • {result.date}
            </div>
          </div>
        );
        
      case "event":
        return (
          <div>
            <div className="truncate">{result.title}</div>
            <div className="text-xs text-muted-foreground">
              {result.date}
            </div>
          </div>
        );
        
      case "group":
        return (
          <div>
            <div className="truncate">{result.title}</div>
            <div className="text-xs text-muted-foreground">
              {result.memberCount} members
            </div>
          </div>
        );
        
      default:
        return <div>{result.title || result.name}</div>;
    }
  };

  return (
    <>
      {/* Fixed header with z-index for layering */}
      <header className={`fixed ${isDarkTheme ? "bg-black" : "bg-white"} top-0 left-0 right-0 bg-background z-10 mb-5`}>
        <nav className="flex justify-between items-center max-w-7xl mx-auto py-4 px-6">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img src={LogoImg} alt="" className="w-10 h-10" />
            <h1 className="text-green-700 text-2xl font-bold">Emsi</h1>
            <span className="text-2xl font-bold">Connect</span>
          </a>

          {/* Search Section */}
          <div className="flex items-center relative">
            {/* Desktop search bar */}
            <div className="hidden md:block relative w-72">
              <Input 
                type="search" 
                placeholder={searchPlaceholder} 
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <span className="absolute inset-y-0 left-3 flex items-center">
                <Search size={18} />
              </span>
              
              {/* Desktop search results */}
              {searchQuery.length > 2 && (
                <div className="absolute w-full mt-1 bg-background rounded-md shadow-lg border border-border z-20">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(result => (
                        <a 
                          key={`${result.type}-${result.id}`} 
                          href={getResultUrl(result)}
                          className="block px-4 py-2 hover:bg-accent"
                        >
                          {renderSearchResult(result)}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {result.type}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">No results found</p>
                    </div>
                  )}
                </div>
              )}
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
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigateTo(`/profile/${storedUser.user_id}`)}
                    >
                      Profile
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
              <Input 
                type="search" 
                placeholder={searchPlaceholder} 
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <span className="absolute inset-y-0 left-3 flex items-center">
                <Search size={18} />
              </span>
            </div>

            {/* Mobile search results */}
            {searchQuery.length > 2 && (
              <div className="mt-2 bg-background rounded-md shadow-sm border border-border">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map(result => (
                      <a 
                        key={`${result.type}-${result.id}`} 
                        href={getResultUrl(result)}
                        className="block px-4 py-2 hover:bg-accent"
                        onClick={() => setShowSearch(false)}
                      >
                        {renderSearchResult(result)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {result.type}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">No results found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>
      
      {/* Spacer div to prevent content from hiding under the fixed navbar */}
      <div className="h-10 md:h-20"></div>
    </>
  );
};

export default NavBar;