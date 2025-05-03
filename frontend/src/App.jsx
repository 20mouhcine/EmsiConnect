import { LoginForm } from "./components/login-form";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./screens/Login"
import  Register  from "./screens/Register";
import { ForgotPasswordForm } from "./screens/ForgotPasswordForm";
import Home from "./screens/Home";
import ListeEtudiants from "./screens/ListeEtudiants";
import { ThemeProvider } from "./components/theme-provider";
import PrivateRoute from "@/components/PrivateRoute.jsx";
import { Toaster } from "sonner";
import userContext from "./user-context";
import { useState } from "react";
import { UserProvider } from "./user-context";
import { User } from "lucide-react";

function App() {
  const [user, setUser] = useState(null);
  return (
    <ThemeProvider>    
      <UserProvider value={[user,setUser]}>

      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgotPassword" element={<ForgotPasswordForm/>}/>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/utilisateurs" element={<ListeEtudiants />} />
        </Route>
      </Routes>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
