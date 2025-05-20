import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import MultiSelect from '@/components/ui/multi-select';
import api from '@/lib/axios';

const AddMembersForm = ({ groupId, existingMembers = [], onMemberAdded }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { theme } = useTheme();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Fetch available users when component expands
  const fetchUsers = useCallback(async () => {
    if (!isExpanded) return;

    setIsLoading(true);
    try {
      const response = await api.get('/users');
      
      // Get existing member IDs for filtering
      const existingMemberIds = existingMembers.map(member => member.id);
      
      // Transform users data for multi-select, excluding current user and existing members
      const formattedUsers = response.data
        .filter(u => 
          u.id !== currentUser?.user_id && 
          !existingMemberIds.includes(u.id)
        )
        .map(u => ({
          value: u.id.toString(),
          label: u.username || u.email
        }));
      
      setAvailableUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isExpanded, currentUser?.user_id, existingMembers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle user selection change
  const handleUserSelectionChange = useCallback((selectedOptions) => {
    setSelectedUsers(selectedOptions);
  }, []);

  // Handle adding members to group
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    setIsAdding(true);
    try {
      // Extract user IDs from selected users
      const userIds = selectedUsers.map(user => parseInt(user.value));
      
      // Call API to add members to group
      await api.post(`/groups/${groupId}/add-members/`, {
        user_ids: userIds
      });
      
      // Reset form
      setSelectedUsers([]);
      setIsExpanded(false);
      
      // Notify parent component to refresh data
      if (onMemberAdded) {
        onMemberAdded();
      }
    } catch (error) {
      console.error('Error adding members:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsAdding(false);
    }
  };

  // Reset form when closing
  const handleClose = () => {
    setIsExpanded(false);
    setSelectedUsers([]);
  };

  if (!isExpanded) {
    return (
      <div className="mb-6">
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-full"
          variant="outline"
        >
          <UserPlus size={16} className="mr-2" />
          Ajouter des membres
        </Button>
      </div>
    );
  }

  return (
    <div className={`mb-6 p-4 border rounded-lg ${
         'bg-gray-800 border-gray-700' 
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Ajouter des membres</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
        >
          <X size={16} />
        </Button>
      </div>

      {/* Multi-select for users */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Sélectionner les membres
        </label>
        {isLoading ? (
          <div className={`p-3 border rounded-md ${
          
             'bg-gray-700 border-gray-600' 
          }`}>
            <p className="text-sm text-gray-500">Chargement des utilisateurs...</p>
          </div>
        ) : (
          <MultiSelect
            options={availableUsers}
            selected={selectedUsers}
            onChange={handleUserSelectionChange}
            placeholder="Sélectionner les utilisateurs à ajouter..."
          />
        )}
        <p className={`text-xs mt-1
          'text-gray-400' : 'text-gray-500'
        `}>
          Sélectionnez plusieurs utilisateurs pour les ajouter au groupe
        </p>
      </div>

      {/* Selected users count */}
      {selectedUsers.length > 0 && (
        <div className={`mb-4 p-3 rounded-md
            'bg-green-50 border border-green-200'
        `}>
          <p className="text-sm">
            <span className="font-medium">
              {selectedUsers.length} utilisateur{selectedUsers.length !== 1 ? 's' : ''} sélectionné{selectedUsers.length !== 1 ? 's' : ''}
            </span>
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedUsers.map(user => (
              <span
                key={user.value}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs
                  'bg-gray-200 text-gray-700'
                `}
              >
                {user.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleClose}
        >
          Annuler
        </Button>
        <Button
          onClick={handleAddMembers}
          disabled={selectedUsers.length === 0 || isAdding}
          className="transition-all ease-in-out delay-0 bg-green-100 text-gray-700 hover:text-green-500 hover:bg-green-400/25"
        >
          {isAdding 
            ? 'Ajout en cours...' 
            : `Ajouter ${selectedUsers.length} membre${selectedUsers.length !== 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </div>
  );
};

export default AddMembersForm;