import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  supplierId: string;
  supplierName: string;
  orderAmount: number;
  onSubmitSuccess?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  supplierId,
  supplierName,
  orderAmount,
  onSubmitSuccess
}) => {
  const { toast } = useToast();
  const { firebaseUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isTrusted, setIsTrusted] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating between 1 and 5 stars.",
        variant: "destructive"
      });
      return;
    }

    if (isTrusted === null) {
      toast({
        title: "Trust Status Required",
        description: "Please indicate whether you trust this supplier or not.",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Comment Too Short",
        description: "Please provide a comment with at least 10 characters.",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length > 500) {
      toast({
        title: "Comment Too Long",
        description: "Please keep your comment under 500 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!firebaseUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to submit a review.",
          variant: "destructive"
        });
        return;
      }

      const token = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId,
          orderId,
          rating,
          isTrusted,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Review Submitted! ⭐",
          description: `Thank you for reviewing ${supplierName}. Your feedback helps other vendors.`,
          duration: 5000
        });
        
        // Reset form
        setRating(0);
        setIsTrusted(null);
        setComment('');
        
        // Close modal and call success callback
        onClose();
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Review Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setIsTrusted(null);
      setComment('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Review {supplierName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order:</span> #{orderId.slice(-6)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Amount:</span> ₹{orderAmount}
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Rate your experience (1-5 stars)</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {rating > 0 && (
                rating === 1 ? "Poor" :
                rating === 2 ? "Fair" :
                rating === 3 ? "Good" :
                rating === 4 ? "Very Good" :
                "Excellent"
              )}
            </p>
          </div>

          {/* Trust Status */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Do you trust this supplier?</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={isTrusted === true ? "default" : "outline"}
                onClick={() => setIsTrusted(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Trusted
              </Button>
              <Button
                type="button"
                variant={isTrusted === false ? "destructive" : "outline"}
                onClick={() => setIsTrusted(false)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Not Trusted
              </Button>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-medium">
              Share your experience (10-500 characters)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this supplier..."
              className="min-h-[100px]"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || isTrusted === null || comment.trim().length < 10}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal; 