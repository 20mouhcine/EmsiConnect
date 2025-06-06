import React, { useState, useEffect, useCallback, memo } from "react";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import api from "@/lib/axios";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import MultiSelect from "@/components/ui/multi-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";

const GroupCard = memo(
  ({ group, user, openDialog, handleDelete, availableUsers }) => {
    const { theme } = useTheme();
    const isDarkTheme = theme === "dark";
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    return (
      <Card className={``}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Link to={`/group/${group.id}`}>
              <CardTitle>{group.nom || "Unnamed Group"}</CardTitle>
            </Link>
            {user && group.admin === user.user_id && (
              <div className="flex space-x-2 justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => setIsAlertOpen(true)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce groupe ? Cette
                        action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          setIsRemoving(true);
                          await handleDelete(group.id);
                          setIsAlertOpen(false);
                          setIsRemoving(false);
                        }}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {isRemoving ? "Traitement..." : "Supprimer"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          <CardDescription>Admin: {group.admin_username}</CardDescription>
        </CardHeader>
        <CardContent>
          {group.description && (
            <p className="text-gray-700">{group.description}</p>
          )}

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Members:</h4>
            <div className="flex flex-wrap gap-1">
              {group.users && group.users.length > 0 ? (
                group.users.map((userId) => {
                  const userData = availableUsers.find(
                    (u) => parseInt(u.value) === userId
                  );
                  return (
                    <Badge key={userId} variant="secondary">
                      {userData ? userData.label : <span>you</span>}
                    </Badge>
                  );
                })
              ) : (
                <span className="text-gray-400 text-sm">No members</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

// Memoized form component
const GroupForm = memo(
  ({
    formData,
    handleChange,
    handleTextareaChange,
    handleUserSelectionChange,
    availableUsers,
    selectedUsers,
    handleSubmit,
    editingGroup,
    setDialogOpen,
  }) => {
    const { theme } = useTheme();
    const isDarkTheme = theme === "dark";
    return (
      <form onSubmit={handleSubmit} className={``}>
        <div className={`grid gap-4 py-4 `}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nom" className="text-right">
              Name
            </Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Description
            </Label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio || ""}
              onChange={handleTextareaChange}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="users" className="text-right">
              Members
            </Label>
            <div className="col-span-3">
              <MultiSelect
                options={availableUsers}
                selected={selectedUsers}
                onChange={handleUserSelectionChange}
                placeholder="Select members..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Select multiple users to add to the group
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit">
            {editingGroup ? "Update Group" : "Create Group"}
          </Button>
        </DialogFooter>
      </form>
    );
  }
);

// Main component
const GroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    bio: "",
    users: [],
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/groups/?filter=${filter}`);
      setGroups(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("Failed to load groups. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch available users when dialog is opened
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");

      // Transform users data for multi-select
      const formattedUsers = response.data
        .filter((u) => u.id !== user?.id)
        .map((u) => ({
          value: u.id.toString(),
          label: u.username || u.email,
        }));
      formattedUsers.shift();
      setAvailableUsers(formattedUsers);

      // Set selected users if editing
      if (editingGroup && editingGroup.users) {
        const selectedUsers = editingGroup.users.map((userId) => {
          const user = response.data.find((u) => u.id === userId);
          return {
            value: userId.toString(),
            label: user ? user.username || user.email : `User #${userId}`,
          };
        });
        setSelectedUsers(selectedUsers);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [dialogOpen, editingGroup]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData({
      nom: "",
      bio: "",
      users: [],
    });
    setSelectedUsers([]);
    setEditingGroup(null);
  }, []);

  // Open dialog for creating/editing
  const openDialog = useCallback(
    (group = null) => {
      if (group) {
        setEditingGroup(group);
        setFormData({
          nom: group.nom || "",
          bio: group.bio || "",
          users: group.users || [],
        });
      } else {
        resetForm();
      }
      setDialogOpen(true);
    },
    [resetForm]
  );

  // Handle form input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Handle textarea changes
  const handleTextareaChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      bio: e.target.value,
    }));
  }, []);

  // Handle user selection change
  const handleUserSelectionChange = useCallback((selectedOptions) => {
    setSelectedUsers(selectedOptions);
    setFormData((prev) => ({
      ...prev,
      users: selectedOptions.map((option) => parseInt(option.value)),
    }));
  }, []);
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        await api.post("/groups/", formData);

        fetchGroups();

        setDialogOpen(false);
        resetForm();
      } catch (err) {
        console.error("Error saving group:", err);
        setError("Failed to save group. Please try again.");
      }
    },
    [formData, fetchGroups, resetForm]
  );

  const handleDelete = async (groupId) => {
    try {
      await api.delete(`/groups/${groupId}/`);
      // Remove the group from local state after deletion
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id !== groupId)
      );
    } catch (err) {
      console.error("Error deleting group:", err);
      alert("Erreur lors de la suppression du groupe");
    }
  };

  // Render loading skeletons
  const renderSkeletons = useCallback(() => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <Card key={index} className="h-64">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
            <div className="mt-4">
              <Skeleton className="h-4 w-1/4" />
              <div className="flex flex-wrap gap-1 mt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ));
  }, []);

  const handleFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  return (
    <div className={`container mx-auto p-4`}>
      <NavBar />
      <div className="flex mt-4">
        <SideBar />
        <div className={`flex-1 space-y-6 p-4`}>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Manage Groups</h1>
            <Button
              onClick={() => openDialog()}
              className="transition-colors ease-in-out hover:text-green-500 hover:bg-green-400/25 border-2"
              variant="light"
            >
              Create New Group
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue={filter}
            onValueChange={handleFilterChange}
            className={`w-full`}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Groups</TabsTrigger>
              <TabsTrigger value="admin">Groups I Manage</TabsTrigger>
              <TabsTrigger value="member">Groups I'm In</TabsTrigger>
            </TabsList>
            <TabsContent value={filter} className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderSkeletons()}
                </div>
              ) : groups.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent className="pt-6">
                    <p className="text-gray-500">No groups found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <motion.div
                      key={group.id}
                      variants={{
                        hidden: {opacity:0},
                        show:{
                            opacity:1,
                            transition:{
                              staggerChildren:0.25,
                            },
                        },
                      }}
                      initial="hidden"
                      animate="show"
                    >
                      <GroupCard
                        key={group.id}
                        group={group}
                        user={user}
                        openDialog={openDialog}
                        handleDelete={handleDelete}
                        availableUsers={availableUsers}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Group" : "Create New Group"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? "Update your group details below."
                : "Add a new group to your organization."}
            </DialogDescription>
          </DialogHeader>
          <GroupForm
            formData={formData}
            handleChange={handleChange}
            handleTextareaChange={handleTextareaChange}
            handleUserSelectionChange={handleUserSelectionChange}
            availableUsers={availableUsers}
            selectedUsers={selectedUsers}
            handleSubmit={handleSubmit}
            editingGroup={editingGroup}
            setDialogOpen={setDialogOpen}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManager;
