
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Check } from "lucide-react";
import { Facebook, Instagram } from "lucide-react";
import { getSocialPosts, SocialPost } from "@/utils/socialPostsService";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isAfter, startOfDay } from "date-fns";
import PostEditDialog from "./PostEditDialog";

interface SocialPostsCalendarProps {
  userId: string;
}

interface SocialConnection {
  platform: string;
  status: number;
}

const SocialPostsCalendar = ({ userId }: SocialPostsCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (userId && userId.trim() !== "") {
      fetchSocialPosts();
      fetchSocialConnections();
    }
  }, [userId]);

  const fetchSocialPosts = async () => {
    try {
      setLoading(true);
      const socialPosts = await getSocialPosts(parseInt(userId));
      setPosts(socialPosts);
    } catch (error) {
      console.error("Failed to fetch social posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialConnections = async () => {
    try {
      const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth': 'Manoj'
        },
        body: JSON.stringify({ user_id: parseInt(userId) })
      });

      if (response.ok) {
        const connections = await response.json();
        setSocialConnections(connections || []);
      }
    } catch (error) {
      console.error("Failed to fetch social connections:", error);
    }
  };

  const getConnectedPlatforms = () => {
    const connected = {
      facebook: false,
      instagram: false
    };

    socialConnections.forEach(connection => {
      if (connection.platform === 'facebook' && connection.status === 1) {
        connected.facebook = true;
      }
      if (connection.platform === 'instagram' && connection.status === 1) {
        connected.instagram = true;
      }
    });

    return connected;
  };

  const handlePostClick = (post: SocialPost) => {
    setSelectedPost(post);
    setDialogOpen(true);
  };

  const handlePostUpdated = () => {
    fetchSocialPosts(); // Refresh the posts after update
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      try {
        const postDate = parseISO(post.date);
        return isSameDay(postDate, date);
      } catch {
        return false;
      }
    });
  };

  const isUpcomingDate = (date: Date) => {
    const today = startOfDay(new Date());
    return isAfter(startOfDay(date), today) || isSameDay(startOfDay(date), today);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const connectedPlatforms = getConnectedPlatforms();

  return (
    <>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-gray-600" />
              <div>
                <CardTitle className="text-lg">Social Media Calendar</CardTitle>
                <CardDescription>Scheduled and published posts</CardDescription>
              </div>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map(date => {
              const dayPosts = getPostsForDate(date);
              const isToday = isSameDay(date, new Date());
              const isUpcoming = isUpcomingDate(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[100px] border rounded-lg p-2 ${
                    isToday 
                      ? 'bg-blue-50 border-blue-200' 
                      : isUpcoming 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday 
                      ? 'text-blue-600' 
                      : isUpcoming 
                        ? 'text-yellow-600' 
                        : 'text-gray-700'
                  }`}>
                    {format(date, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayPosts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => handlePostClick(post)}
                        className="bg-gray-50 rounded p-2 text-xs border cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {post.image && (
                            <img
                              src={post.image}
                              alt={post.product_name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 truncate">
                            <div className="font-medium truncate">{post.product_name}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {/* Status indicator */}
                            {post.status === 'approved' ? (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            )}
                            
                            {/* Published status */}
                            {post.published_status === 1 && (
                              <div className="flex items-center">
                                <Check className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                          </div>

                          {/* Social Media Icons based on connections */}
                          <div className="flex items-center space-x-1">
                            {connectedPlatforms.facebook && (
                              <Facebook className="w-3 h-3 text-blue-600" />
                            )}
                            {connectedPlatforms.instagram && (
                              <Instagram className="w-3 h-3 text-pink-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {posts.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No social media posts found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <PostEditDialog
        post={selectedPost}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPostUpdated={handlePostUpdated}
      />
    </>
  );
};

export default SocialPostsCalendar;
