import React, { useEffect, useState } from "react";
import {
  PenSquare,
  Users,
  UserMinus,
  AlertCircle,
} from "lucide-react";
import Collapsible from "@/components/ui/collabsible";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PostCard from "@/components/PostCard";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import { useTheme } from "@/components/theme-provider";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import AddMembersForm from "@/components/AddMembersForm";
import CreatePostForm from "@/components/CreatePostForm";
const GroupEditForm = ({ initialData = {}, onComplete }) => {
  const [formData, setFormData] = useState({
    nom: initialData.nom || "",
    bio: initialData.bio || "",
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    initialData.profile_picture || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("nom", formData.nom);
      formDataObj.append("bio", formData.bio);

      if (profilePicture) {
        formDataObj.append("profile_picture", profilePicture);
      }

      await api.patch(`/groups/${initialData.id}/`, formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (onComplete) onComplete();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du groupe :", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 max-h-[80vh] overflow-y-auto px-1"
    >
      <h3 className="text-base font-medium mb-2">Modifier le groupe</h3>

      <div className="mb-2">
        <label
          htmlFor="profile_picture"
          className="block text-sm font-medium mb-1"
        >
          Photo de profil
        </label>

        <div className="flex items-center space-x-2">
          <div
            className={`h-12 w-12 rounded-full overflow-hidden border ${
              isDarkTheme ? "border-gray-700" : "border-gray-200"
            }`}
          >
            {previewUrl ? (
              <img
                src={
                  previewUrl.startsWith && previewUrl.startsWith("http")
                    ? previewUrl
                    : profilePicture
                    ? URL.createObjectURL(profilePicture)
                    : previewUrl
                }
                alt="Aperçu"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`h-full w-full flex items-center justify-center ${
                  isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                {formData.nom
                  ? formData.nom.substring(0, 2).toUpperCase()
                  : "GP"}
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              id="profile_picture"
              name="profile_picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={`w-full text-xs ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            />
            <p className="text-xs text-gray-500">JPG, PNG ou GIF. Max 2MB.</p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="nom" className="block text-sm font-medium mb-1">
          Nom du groupe
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          value={formData.nom}
          onChange={handleChange}
          placeholder="Nom du groupe"
          className={`w-full border rounded-md px-2 py-1 text-sm ${
            isDarkTheme
              ? "bg-gray-800 border-gray-700 text-white"
              : "border-gray-300 text-black"
          }`}
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Description du groupe"
          rows={2}
          className={`w-full border rounded-md px-2 py-1 text-sm ${
            isDarkTheme
              ? "bg-gray-800 border-gray-700 text-white"
              : "border-gray-300 text-black"
          }`}
        />
      </div>

      

      <div className="flex justify-end gap-2 pt-2 pb-1 sticky bottom-0 bg-inherit">
        <button
          type="button"
          onClick={onComplete}
          className={`px-3 py-1 border rounded-md text-sm ${
            isDarkTheme
              ? "border-gray-700 hover:bg-gray-800"
              : "border-gray-300 hover:bg-gray-100"
          }`}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
};

const MemberCard = ({ member, isAdmin, groupAdmin, onRemoveMember }) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const isGroupAdmin = member?.id === groupAdmin;
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveMember = async () => {
    if (!onRemoveMember || isRemoving) return;

    setIsRemoving(true);
    try {
      await onRemoveMember(member.id);
    } finally {
      setIsRemoving(false);
      setIsAlertOpen(false);
    }
  };
  return (
    <>
      <div
        className={`p-4 border rounded-lg flex items-center justify-between ${
          isDarkTheme
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {member?.profile_picture ? (
              <AvatarImage
                src={`http://localhost:8000${member.profile_picture}`}
                alt={member.username}
              />
            ) : (
              <AvatarFallback
                className={isDarkTheme ? "bg-gray-700" : "bg-gray-200"}
              >
                {member?.username?.substring(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-medium">
              {member?.username || "Utilisateur inconnu"}
              {isGroupAdmin && (
                <span
                  className={`ml-2 text-xs ${
                    isDarkTheme ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  (Admin)
                </span>
              )}
            </p>
            {member?.email && (
              <p
                className={`text-xs ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {member.email}
              </p>
            )}
          </div>
        </div>
        {isAdmin && !isGroupAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAlertOpen(true)}
            disabled={isRemoving}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <UserMinus size={16} className="mr-1" />
            <span className="hidden sm:inline">Retirer</span>
          </Button>
        )}
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le membre</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer {member?.username} du groupe ?
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-500 hover:bg-red-600"
            >
              {isRemoving ? "Traitement..." : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

  const Group = () => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const { theme } = useTheme();
    const isDarkTheme = theme === "dark";
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const { id } = useParams();
    const [members, setMembers] = useState([]);
    const [isJoining, setIsJoining] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGroupData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/groups/${id}/`);
        setGroup(response.data);
        setMembers(response.data.members || []);

        const postsResponse = await api.get(`/groups/${id}/posts/`);
        
        setPosts(postsResponse.data || []);

      } catch (error) {
        console.error("Error fetching group data:", error);
        setError(
          "Impossible de charger les données du groupe. Veuillez réessayer plus tard."
        );
      } finally {
        setIsLoading(false);
      }
    };
    const fetchuser = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) return;
      const response = await api.get(`/users/${storedUser.user_id}/`);
      setCurrentUser(response.data)
    }

    useEffect(() => {
      fetchGroupData();
      fetchuser()
    }, [id]);


    const isAdmin = currentUser && group && currentUser.id === group.admin;
    const isMember =
      currentUser && members.some((member) => member.id === currentUser.id);
    const navigate = useNavigate();
    const handleJoinGroup = async () => {
      if (isJoining) return;

      setIsJoining(true);
      try {
        await api.post(`/groups/${id}/members/`);
        // Refresh group data after joining
        await fetchGroupData();
      } catch (error) {
        console.error("Error joining group:", error);
        setError(
          "Impossible de rejoindre le groupe. Veuillez réessayer plus tard."
        );
      } finally {
        setIsJoining(false);
      }
    };

    const handleLeaveGroup = async () => {
      try {
        await api.delete(`/groups/${id}/members/`);
      } catch (error) {
        console.error("Error leaving group:", error);
        navigate("/groups");
        setError(
          "Impossible de quitter le groupe. Veuillez réessayer plus tard."
        );
      }
    };

    const handleRemoveMember = async (memberId) => {
      try {
        await api.post(`/groups/${id}/remove-member/`, { user_id: memberId });
        // Update the members list
        setMembers((prevMembers) =>
          prevMembers.filter((member) => member.id !== memberId)
        );
      } catch (error) {
        console.error("Error removing member:", error);
        setError(
          "Impossible de retirer ce membre. Veuillez réessayer plus tard."
        );
        throw error; // Propagate error to the caller
      }
    };

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <p>Chargement du groupe...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur</h2>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
            <Button className="mt-4" onClick={fetchGroupData}>
              Réessayer
            </Button>
          </div>
        </div>
      );
    }

    if (!group) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <p>Groupe non trouvé</p>
        </div>
      );
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
              <div
                className={`relative w-full h-48 rounded-t-lg ${
                  isDarkTheme ? "bg-gray-800" : "bg-gray-200"
                }`}
              >
                <div className="absolute -bottom-16 left-6">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                    {group?.profile_picture ? (
                      <AvatarImage
                        src={
                          group.profile_picture.startsWith("http")
                            ? group.profile_picture
                            : `http://localhost:8000${group.profile_picture}`
                        }
                        alt="Group Logo"
                      />
                    ) : null}
                    <AvatarFallback
                      className={`text-3xl ${
                        isDarkTheme ? "bg-gray-700" : "bg-gray-300"
                      }`}
                    >
                      {group?.nom?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div
                className={`mt-16 p-6 ${
                  isDarkTheme ? "bg-gray-900" : "bg-gray-50"
                } rounded-b-lg shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">
                        {group?.nom.toUpperCase()}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Users
                        size={16}
                        className={
                          isDarkTheme ? "text-gray-400" : "text-gray-600"
                        }
                      />
                      <p
                        className={`text-sm ${
                          isDarkTheme ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {members.length} membre{members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {group?.bio && <p className="mt-3 text-sm">{group.bio}</p>}
                  </div>

                  {isAdmin ? (
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <PenSquare size={16} /> Modifier le groupe
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-4">
                        <GroupEditForm
                          initialData={group}
                          onComplete={() => {
                            setIsPopoverOpen(false);
                            fetchGroupData();
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : isMember ? (
                    <Button variant="outline" onClick={handleLeaveGroup}>
                      Quitter le groupe
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      onClick={handleJoinGroup}
                      disabled={isJoining}
                    >
                      {isJoining ? "En cours..." : "Rejoindre le groupe"}
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="posts">
                  <TabsList className="w-full">
                    <TabsTrigger value="posts" className="flex-1">
                      Publications
                    </TabsTrigger>
                    <TabsTrigger value="members" className="flex-1">
                      Membres
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex-1">
                      À propos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="posts" className="mt-4">
                    {isMember && (
                      <div className="mb-6">
                        <CreatePostForm
                          groupId={group.id}
                          currentUser={currentUser}
                          onPostCreated={(newPost) => {
                            setPosts((prev) => [
                              newPost,
                              ...(Array.isArray(prev) ? prev : []),
                            ]);
                          }}
                        />
                      </div>
                    )}
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
                          Aucune publication dans ce groupe pour le moment
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="members" className="mt-4">
                    {isAdmin && (
                      <AddMembersForm
                        groupId={group.id}
                        onMemberAdded={fetchGroupData}
                        existingMembers={members}
                      />
                    )}
                    {members.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {members.map((member) => (
                          <MemberCard
                            key={member.id}
                            member={member}
                            isAdmin={isAdmin}
                            groupAdmin={group.admin}
                            onRemoveMember={handleRemoveMember}
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
                          Aucun membre trouvé dans ce groupe
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="about" className="mt-4">
                    <div
                      className={`p-4 rounded-lg ${
                        isDarkTheme ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      <h3 className="text-lg font-medium mb-2">
                        À propos de ce groupe
                      </h3>
                      <p className="mb-4">
                        {group.bio || "Aucune description disponible."}
                      </p>

                      <div className="flex items-center gap-2 mt-4">
                        <div
                          className={`p-2 rounded-full ${
                            isDarkTheme ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        >
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Création du groupe
                          </p>
                          <p className="text-xs text-gray-500">
                            Par {group.admin_username}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium">Type de groupe</p>
                        <p className="text-sm">
                          {group.is_private ? "Groupe privé" : "Groupe public"}
                        </p>
                        {group.is_private && (
                          <p className="text-xs text-gray-500 mt-1">
                            Seuls les membres approuvés peuvent voir le contenu du
                            groupe
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <Collapsible
                groupId={group.id}
                currentUserId={currentUser.id}
                token={localStorage.getItem("access_token")}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default Group;
