import React from "react";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import { useTheme } from "@/components/theme-provider.jsx";
import api from "@/lib/axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileIcon,
  TrashIcon,
  ExternalLinkIcon,
  UploadIcon,
  PencilIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Resources = () => {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [resources, setResources] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchResources();
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${storedUser.user_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    if (storedUser?.user_id) {
      fetchUser();
    }
  }, []);

  const fetchResources = () => {
    api
      .get("/ressources/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      })
      .then((res) => setResources(res.data))
      .catch((err) => console.error(err));
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile && !title) {
      setUploadError("Please provide at least a title or a PDF file.");
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    const formData = new FormData();

    if (selectedFile) {
      formData.append("media", selectedFile);
    }

    if (title) {
      formData.append("title", title);
    }

    try {
      const response = await api.post("/ressources/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      console.log("Upload successful", response.data);
      setUploadSuccess(true);
      setIsUploading(false);
      setTitle("");
      setSelectedFile(null);

        const fileInput = document.getElementById("file-upload");
      if (fileInput) {
        fileInput.value = "";
      }

      fetchResources();
    } catch (error) {
      console.error("Upload failed", error);
      setUploadError("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  const confirmDelete = (resourceId) => {
    setDeleteConfirmId(resourceId);
  };

  const handleDelete = async (resourceId) => {
    try {
      await api.delete(`/ressources/${resourceId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setResources(resources.filter((res) => res.id !== resourceId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Delete failed", error);
    }
  };
  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDarkTheme ? "bg-black" : "bg-gray-50"
      }`}
    >
      <NavBar />
      <div className={`flex mt-4 sm:mt-6 lg:-mt-2 `}>
        <SideBar />
        <div className={`flex-1 flex justify-center items-start p-4 sm:p-6`}>
          <div className="w-full max-w-3xl ">
            {currentUser?.role === "enseignant" ? (
              <Card className="shadow-lg mb-2">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileIcon className="h-5 w-5" />
                    Resources PDF
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="resource-title">Title (optional)</Label>
                        <Input
                          id="resource-title"
                          placeholder="Enter a title for your resource"
                          value={title}
                          onChange={handleTitleChange}
                          disabled={isUploading}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="file-upload">
                          Upload a PDF (optional)
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="file-upload"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="max-w-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Button
                          type="submit"
                          disabled={isUploading || (!selectedFile && !title)}
                          className="mt-2"
                        >
                          {isUploading ? (
                            "Uploading..."
                          ) : (
                            <>
                              <UploadIcon className="mr-2 h-4 w-4" /> Upload
                              Resource
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {uploadSuccess && (
                      <Alert className="bg-green-50 border-green-200 text-green-800">
                        <AlertDescription>
                          Resource uploaded successfully!
                        </AlertDescription>
                      </Alert>
                    )}

                    {uploadError && (
                      <Alert className="bg-red-50 border-red-200 text-red-800">
                        <AlertDescription>{uploadError}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                </CardContent>
              </Card>
            ) : (
              <></>
            )}

            <Card className={`shadow-lg p-2 ${isDarkTheme? 'bg-black': 'bg-white'}`}>
              <CardContent className="space-y-4">
                <div className="space-y-2 mt-6">
                  <h3 className="text-lg font-medium">Available Resources</h3>
                  {resources.length === 0 ? (
                    <p className="text-gray-500">No resources uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-5 w-5 text-green-500" />
                            <span className="font-medium">
                              {resource.title || `Resource ${resource.id}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {(resource.media_url || resource.media) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    resource.media_url || resource.media,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLinkIcon className="h-4 w-4 mr-1" />{" "}
                                View PDF
                              </Button>
                            )}
                            {(currentUser?.role === "enseignant" && currentUser?.id === resource.user.id) &&
                              (deleteConfirmId === resource.id ? (
                                <>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(resource.id)}
                                    className="transition-all duration-75"
                                  >
                                    Confirmer
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="transition-all duration-75"

                                  >
                                    Annuler
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmDelete(resource.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
