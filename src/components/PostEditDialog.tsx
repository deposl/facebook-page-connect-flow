
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, X, Clock, Loader2, Smile, ThumbsUp, ThumbsDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SocialPost } from "@/utils/socialPostsService";
import { useToast } from "@/hooks/use-toast";
import { parseISO, isBefore, startOfDay } from "date-fns";

interface PostEditDialogProps {
  post: SocialPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
}

const PostEditDialog = ({ post, open, onOpenChange, onPostUpdated }: PostEditDialogProps) => {
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const { toast } = useToast();

  // Common emojis for social media posts
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
    '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️',
    '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
    '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴',
    '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐',
    '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑',
    '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢',
    '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕',
    '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱'
  ];

  useEffect(() => {
    if (post) {
      setCaption(post.caption);
      setStatus(post.status);
    }
  }, [post]);

  const isPastPost = () => {
    if (!post) return false;
    try {
      const postDate = parseISO(post.date);
      const today = startOfDay(new Date());
      return isBefore(postDate, today);
    } catch {
      return false;
    }
  };

  const updatePost = async () => {
    if (!post) return;

    try {
      setLoading(true);
      const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/update-social-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth': 'Manoj'
        },
        body: JSON.stringify({
          id: post.id,
          caption: caption,
          image: post.image,
          status: status
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.status}`);
      }

      const result = await response.json();
      console.log('Post update response:', result);
      
      toast({
        title: "Post Updated",
        description: "The social media post has been updated successfully.",
      });

      onPostUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDisapprove = async (newStatus: string) => {
    if (!post) return;

    try {
      setApproveLoading(true);
      const response = await fetch('https://n8n-n8n.hnxdau.easypanel.host/webhook/update-social-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Auth': 'Manoj'
        },
        body: JSON.stringify({
          id: post.id,
          caption: caption,
          image: post.image,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus === 'approved' ? 'approve' : 'disapprove'} post: ${response.status}`);
      }

      const result = await response.json();
      console.log('Post status update response:', result);
      
      setStatus(newStatus);
      
      toast({
        title: newStatus === 'approved' ? "Post Approved" : "Post Disapproved",
        description: `The post has been ${newStatus === 'approved' ? 'approved' : 'disapproved'} successfully.`,
      });

      onPostUpdated();
    } catch (error) {
      console.error(`Error ${newStatus === 'approved' ? 'approving' : 'disapproving'} post:`, error);
      toast({
        title: "Update Failed",
        description: `Failed to ${newStatus === 'approved' ? 'approve' : 'disapprove'} the post. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setApproveLoading(false);
    }
  };

  const addEmojiToCaption = (emoji: string) => {
    setCaption(prev => prev + emoji);
  };

  if (!post) return null;

  const isPostInPast = isPastPost();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Social Media Post Details</span>
            {post.published_status === 1 ? (
              <Badge className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Published
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Not Published
              </Badge>
            )}
            {isPostInPast && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Past Post
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info with Large Image */}
          <div className="flex flex-col space-y-4">
            <div className="flex justify-center">
              <img
                src={post.image}
                alt={post.product_name}
                className="max-w-lg max-h-96 rounded-lg object-cover border shadow-lg"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{post.product_name}</h3>
              <p className="text-sm text-gray-500">Scheduled for: {post.date}</p>
            </div>
          </div>

          {/* Caption Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">Post Caption</Label>
              {!isPostInPast && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Smile className="w-4 h-4 mr-1" />
                      Add Emoji
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmojiToCaption(emoji)}
                          className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter your post caption with emojis..."
              className="min-h-[200px] resize-none"
              readOnly={isPostInPast}
            />
            <p className="text-xs text-gray-500">
              {isPostInPast 
                ? "This post is from the past and cannot be edited." 
                : "Tip: You can copy and paste emojis directly into the caption or use the emoji picker above"
              }
            </p>
          </div>

          {/* Status Management */}
          {!isPostInPast && (
            <>
              {status === 'approved' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-800 font-medium">Post Approved</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleApproveDisapprove('pending')}
                      disabled={approveLoading}
                    >
                      {approveLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Disapproving...
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Disapprove
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    This post has been approved and is ready for publishing.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-yellow-800 font-medium">Post Pending Approval</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveDisapprove('approved')}
                      disabled={approveLoading}
                    >
                      {approveLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    This post requires approval before it can be published.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Post Details Table */}
          <div className="space-y-2">
            <Label>Post Details</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Day of Week</TableCell>
                  <TableCell>{post.dayof}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Scheduled Date</TableCell>
                  <TableCell>{post.date}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="capitalize">{status}</span>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Published Status</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {post.published_status === 1 ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Published</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500">Not Published</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Created</TableCell>
                  <TableCell>{new Date(post.created_at).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Updated</TableCell>
                  <TableCell>{new Date(post.updated_at).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {isPostInPast ? 'Close' : 'Cancel'}
            </Button>
            {!isPostInPast && (
              <Button 
                onClick={updatePost}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Post'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;
