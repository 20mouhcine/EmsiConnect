import React, { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import SideBar from "@/components/SideBar";
import { useTheme } from "@/components/theme-provider.jsx";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Reports = () => {
    const [reports, setreports] = useState([]);
    const { theme } = useTheme();
    const isDarkTheme = theme === "dark";
    const token = localStorage.getItem("access_token");

    const fetchreports = async () => {
        try {
            const response = await api.get("/reports/", {
                headers: {
                    Authorization: "Bearer " + token,
                },
            });
            const set = new Set(response.data);
            setreports(Array.from(set));
        } catch (error) {
            console.error("There was an error fetching the reports:", error);
            toast.error("Erreur lors du chargement des rapports");
        }
    };

    useEffect(() => {
        fetchreports();
    }, []);
    return (
        <div
            className={`flex flex-col min-h-screen ${
                isDarkTheme ? "bg-black" : "bg-white"
            }`}
        >
            <NavBar />
            <div className="flex mt-4 sm:mt-6 lg:-mt-2">
                <SideBar />
                <div className="flex-1 flex justify-center items-start">
                    <div className="w-full max-w-6xl p-4 sm:p-6 md:p-8 my-15">
                        <Table className="w-full">
                            <TableCaption>Liste de vos rapports récents.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px] p-3">ID du rapport</TableHead>
                                    <TableHead className="p-3">Post signalé</TableHead>
                                    <TableHead className="p-3">Qui a signalé</TableHead>
                                    <TableHead className="text-right p-3">Raison</TableHead>
                                    <TableHead className="text-right p-3">Nombre Signal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => ( 
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.id}</TableCell>
                                    
                                    <TableCell>
                                        <Link to={`/posts/${report.post_reported.id}`}>
                                            {report.post_reported.contenu_texte}
                                        </Link>
                                    </TableCell>
                                    
                                    <TableCell>
                                        <Link to={`/profile/${report.user_reported.id}`}>
                                            {report.user_reported.username}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right">{report.cause}</TableCell>
                                    <TableCell className="text-right">{report.reports_count}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
