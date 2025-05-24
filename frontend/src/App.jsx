import {  Route, Routes } from "react-router-dom";
import Login from "./screens/Login"
import  Register  from "./screens/Register";
import { ForgotPasswordForm } from "./screens/ForgotPasswordForm";
import Home from "./screens/Home";
import ListeEtudiants from "./screens/Users";
import { ThemeProvider } from "./components/theme-provider";
import PrivateRoute from "@/components/PrivateRoute.jsx";
import { Toaster } from "sonner";
import Ressources from "./screens/Ressources";
import PostDetail from "./screens/PostsDetail";
import GroupManager from "./screens/GroupManager";
import Profile  from "./screens/Profile";
import Chat from "./screens/Chat";
import Group from "./screens/Group";
import Reports from "./screens/Reports";
function App() {
  return (
    <ThemeProvider>    

      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotPassword" element={<ForgotPasswordForm/>}/>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/utilisateurs" element={<ListeEtudiants />} />
          <Route path="/profile/:id" element={<Profile/>}/>
          <Route path="/ressources" element={<Ressources/>}/>
          <Route path="/posts/:id" element={<PostDetail/>}/>
          <Route path="/groups" element={<GroupManager/>}/>
          <Route path="/chat" element={<Chat/>}/>
          <Route path="/group/:id" element={<Group/>}/>
          <Route path="/chat/:selectedUser" element={<Chat />} />
          <Route path="/reports" element={<Reports/>} />

        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
