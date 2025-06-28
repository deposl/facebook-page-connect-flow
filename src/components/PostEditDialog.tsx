
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { SocialPost } from "@/utils/socialPostsService";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    if (post) {
      setCaption(post.caption);
      setStatus(post.status);
    }
  }, [post]);

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

  const handleApprove = () => {
    setStatus('approved');
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Edit Social Media Post</span>
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex items-start space-x-4">
            <img
              src={post.image}
              alt={post.product_name}
              className="w-24 h-24 rounded-lg object-cover border"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{post.product_name}</h3>
              <p className="text-sm text-gray-500">Post ID: {post.id}</p>
              <p className="text-sm text-gray-500">Scheduled for: {post.date}</p>
            </div>
          </div>

          {/* Caption Editor */}
          <div className="space-y-2">
            <Label htmlFor="caption">Post Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter your post caption with emojis..."
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-gray-500">
              Tip: You can copy and paste emojis directly into the caption
            </p>
          </div>

          {/* Status Management */}
          {status === 'approved' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-800 font-medium">Post Approved</span>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Approve Post
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to approve this post? Once approved, it will be ready for publishing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleApprove}>
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                This post requires approval before it can be published.
              </p>
            </div>
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
                  <TableCell className="font-medium">Product ID</TableCell>
                  <TableCell>{post.product_id}</TableCell>
                </TableRow>
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
              Cancel
            </Button>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;
