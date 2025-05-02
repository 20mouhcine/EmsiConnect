import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import axios from "axios";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams } from "react-router-dom";

export function ForgotPasswordForm({ className, ...props }) {
  // Form state
  const [email, setEmail] = useState("");
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const id = useParams().id;
  const token = useParams().token;
  
  // Handle input change
  const handleChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  // Check if email exists first
  async function checkUser(email) {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/checkuser",
        { email: email }
      );
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Validate form
  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Check if user exists
      const userExists = await checkUser(email);
      if (!userExists) {
        setError("Cet email n'existe pas dans notre système.");
        setIsLoading(false);
        return;
      }
      
      // Send password reset email
      const response = await axios.post("http://127.0.0.1:8000/api/forgotPassword", {
        email: email,

        user_id:id,
        token:token,  
      });
      
      if (response.data.success) {
        setSuccess(response.data.message || "Un lien de réinitialisation a été envoyé à votre adresse email.");
        setEmail("");
      } else {
        setError(response.data.message || "Une erreur s'est produite. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError(
        error.response?.data?.message || 
        "Une erreur s'est produite. Veuillez réessayer plus tard."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="text-center text-4xl font-bold mb-1">
        <span className="text-[#1DAF00]">EMSI</span>Connect
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@emsi-edu.ma"
                  value={email}
                  onChange={handleChange}
                  disabled={isLoading || success}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={isLoading || success}
              >
                {isLoading ? "Traitement en cours..." : "Envoyer le lien"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-0">
          <div className="text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}