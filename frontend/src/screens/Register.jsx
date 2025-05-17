import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Register = ({ className, ...props }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    userType: "",
    password: "",
    confirmPassword: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState({});

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

  const handleSelectChange = (value) => {
    setFormData({
      ...formData,
      userType: value,
    });
    
    if (errors.userType) {
      setErrors({
        ...errors,
        userType: null,
      });
    }
  };

  async function checkUser(email) {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/checkuser/", {
        email: email,
      });
  
      return response.data.exists === true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false; 
      }
  
      console.error("Erreur lors de la vérification de l'utilisateur:", error);
      throw error;
    }
  }
  

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    }else if (!/^[a-zA-Z0-9._%+-]+@emsi-edu\.ma$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide. L'email doit être sous la forme example@emsi-edu.ma";
    }
    
    if (!formData.userType) {
      newErrors.userType = "Veuillez sélectionner un type d'utilisateur";
    }
    
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
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
      if (await checkUser(formData.email)) {
        toast.error("Cet email est déjà utilisé.");
        setErrors(prev => ({
          ...prev,
          email: "Cet email est déjà utilisé"
        }));
        setIsLoading(false);
        return;
      }
      const response = await axios.post("http://127.0.0.1:8000/api/register/", {
        username: formData.username,
        email: formData.email,
        role: formData.userType, 
        password: formData.password,
      });
      
      toast.success("Compte créé avec succès! Vous allez être redirigé vers la page de connexion.");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      console.error("Registration error:", error);
      
      const errorMessage = error.response?.data?.message || 
        "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.";
      
      toast.error("Erreur d'inscription: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className={cn("flex flex-col gap-6 w-full max-w-md px-4", className)} {...props}>
        <div className="text-center text-4xl font-bold mb-1">
          <span className="text-[#1DAF00]">EMSI</span>Connect
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-2xl">
              Créer un compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="JohnDoe"
                    value={formData.username}
                    onChange={handleChange}
                    className={errors.username ? "border-red-500" : ""}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-xs">{errors.username}</p>
                  )}
                </div>
                
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
                  <Label htmlFor="userType">Utilisateur</Label>
                  <Select onValueChange={handleSelectChange} value={formData.userType}>
                    <SelectTrigger className={`w-full ${errors.userType ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Sélectionner un type d'utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="etudiant">Etudiant</SelectItem>
                        <SelectItem value="enseignant">Enseignant</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.userType && (
                    <p className="text-red-500 text-xs">{errors.userType}</p>
                  )}
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="password">Mot de passe</Label>
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
                
                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Inscription en cours..." : "Créer un compte"}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Vous avez déjà un compte?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;