import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
  

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });

    if (errors[id]) {
      setErrors({
        ...errors,
        [id]: null,
      });
    }
  };
  async function checkUser(email) {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/checkuser/", {
        email: email,
      });
      return response.data.success; // or response.data.exists if you add that field
    } catch (error) {
      // If we get a 404, that means user doesn't exist
      return false;
    }
  }

  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is incorrect";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const userExists = await checkUser(formData.email);
      if (!userExists) {
        // Only show error if user DOESN'T exist
        setErrors((prev) => ({
          ...prev,
          email: "Cet email n'existe pas.",
        }));
        setIsLoading(false);
        return;
      }
      const response = await axios.post("http://127.0.0.1:8000/api/login/", {
        email: formData.email,
        password: formData.password,
      });
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem("refresh_token", response.data.refresh);
      const userFromToken = parseJwt(localStorage.getItem('access_token'));
      localStorage.setItem("user", JSON.stringify(userFromToken)); 
      const user = JSON.parse(localStorage.getItem("user"));
console.log("User after login:", user.user_id);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Une erreur s'est produite lors de la connexion. Veuillez réessayer.";

      toast.error("Erreur de connexion: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-md">
        <div className="text-center text-4xl font-bold mb-6">
          <span className="text-[#1DAF00]">EMSI</span>Connect
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-2xl text-center">
              Connectez-vous
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@emsi-edu.ma"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs">{errors.email}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Mot de Passe</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "border-red-500" : ""}
                    required
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs">{errors.password}</p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Mot de passe oublié?{" "}
                <Link
                  to="/forgotPassword"
                  className="underline underline-offset-4"
                >
                  Réinitialiser
                </Link>
              </div>
              <div className="mt-4 text-center text-sm">
                Besoin d'un compte?{" "}
                <Link
                  to="/register"
                  className="underline underline-offset-4"
                >
                  Inscrivez-vous
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}