import React from "react";
import {Image} from "lucide-react";
const FileUploadButton = () => {
    return (
        <div className="relative inline-block">
            {/* Hidden file input */}
            <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files[0];
                    console.log("Selected file:", file);
                }}
            />

            {/* Styled label as button with icon */}
            <label
                htmlFor="file-upload"
                className="flex items-center px-4 py-2 border-1 rounded-full cursor-pointer  hover:text-green-500 hover:bg-green-400/25 transition-colors"
            >
                <Image />
            </label>
        </div>
    );
};

export default FileUploadButton;
