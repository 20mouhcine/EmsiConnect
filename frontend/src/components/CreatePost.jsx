import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useRef, useState } from "react"
import axios from "axios"

function CreatePost({ onPostCreated }) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem("user"));

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("contenu_texte", content);
        if (selectedFile) {
            formData.append("media", selectedFile);
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post("http://127.0.0.1:8000/api/posts/create/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (response.status === 201) {
                toast.success("Post publié avec succès !");
                setContent("");
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                
                // Call the callback function if provided
                if (onPostCreated) {
                    onPostCreated();
                }
                setIsDialogOpen(false);

            } else {
                toast.error("Erreur lors de la création du post");
            }
        } catch (error) {
            console.error("Erreur:", error);
            toast.error("Une erreur est survenue lors de la publication");
        } finally {
            setIsSubmitting(false);
        }
    };
    const avatarFallback = user?.username?.substring(0, 2).toUpperCase();

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                    <Button variant="outline" className="w-full h-auto flex justify-between cursor-text">
                        <div className="flex items-center justify-between">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                <AvatarImage src = {user?.profile_picture?.startsWith("http")
                    ? user.profile_picture
                    : `http://127.0.0.1:8000${user?.profile_picture}`
                } />
                                <AvatarFallback>{avatarFallback}</AvatarFallback>
                            </Avatar>
                            <p className="mx-2 text-xs sm:text-sm text-muted-foreground">Dis-nous ce que tu penses</p>
                        </div>
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Créer une Publication</DialogTitle>
                    <DialogDescription>
                        Partagez vos idées, ressources ou actualités avec votre groupe. Remplissez les champs ci-dessous, puis cliquez sur "Publier".
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="items-center gap-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="col-span-3 flex min-h-[250px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                placeholder="Partagez vos pensées ici..."
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="flex w-full rounded-md border border-input px-3 py-2 text-sm file:border-0 file:bg-primary file:text-primary-foreground file:mr-2 file:px-2 file:py-1 file:rounded-md hover:file:bg-primary/90"
                        />
                    </div>
                    
                    {selectedFile && (
                        <div className="text-sm text-muted-foreground mb-4">
                            Fichier sélectionné: {selectedFile.name}
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Publication en cours..." : "Publier"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default CreatePost;