import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTheme } from './theme-provider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PostCard = ({ post }) => {
    const { theme } = useTheme();
    const isDarkTheme = theme === 'dark';

    // Function to safely format the date
    const formatPostDate = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "recently";
        }
    };

    return (
        <Card className={`mb-4 ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
            <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarImage src={`https://i.pravatar.cc/150?img=${post.user || 1}`} />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium text-sm sm:text-base">{post.user.username}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                {formatPostDate(post.date_creation)}
                            </div>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Save Post</DropdownMenuItem>
                            <DropdownMenuItem>Report</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">{post.contenu_texte}</p>
                {post.media && (
                    <div className="rounded-lg overflow-hidden mb-3 sm:mb-4">
                        <img
                            src={`http://127.0.0.1:8000${post.media}`}
                            alt="Post content"
                            className="w-full object-cover max-h-96"
                            onError={(e) => {
                                console.error("Image failed to load:", post.media);
                                e.target.src = "/placeholder-image.jpg"; // Fallback image
                                e.target.onerror = null; // Prevent infinite error loop
                            }}
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <Button variant="ghost" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
                        <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">{post.num_comments || 0} Comments</span>
                        <span className="xs:hidden">Comments</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 sm:h-9 sm:px-3">
                        <Bookmark className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">{post.num_likes || 0} Saved</span>
                        <span className="xs:hidden">Saved</span>
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default PostCard;