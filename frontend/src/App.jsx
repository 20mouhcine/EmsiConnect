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
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
