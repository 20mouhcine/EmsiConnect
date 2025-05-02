import React from 'react'
import NavBar from '../components/NavBar'
import SideBar from '../components/SideBar'
import {useTheme} from "@/components/theme-provider.jsx";
import CreatePost from "@/components/CreatePost.jsx";
import UsersCard from '@/components/UsersCard';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';


const ListeEtudiants = () => {
   const { theme } = useTheme();
      const isDarkTheme = theme === 'dark';
    const [users, setUsers] = useState([]);
const token = localStorage.getItem("access_token");
      const fetchUsers = async() =>{

        try{

          const response = await api.get('/users/',{
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });
          setUsers(response.data);
        }catch (error) {
          toast.error("Erreur lors du chargement des utilisateurs");

        }
      }

      useEffect(()=>{
        fetchUsers();
      },[])
  return (
              <div className={`flex flex-col min-h-screen ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
            <NavBar />
            <div className="flex mt-4 sm:mt-6 lg:-mt-2">
                <SideBar />
                <div className="flex-1 flex justify-center items-start p-3">
                    <div className="w-full max-w-xl">
                        <div className="my-3">
                          {users.map((user) => (
                            <UsersCard user={user} key={user.id}/>
                          ))}
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
  )
}

export default ListeEtudiants