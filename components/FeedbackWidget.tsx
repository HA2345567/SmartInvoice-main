'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Star, Send, X, Heart, Lightbulb, Bug, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackData {
  type: 'feature' | 'bug' | 'improvement' | 'general';
  rating: number;
  title: string;
  description: string;
  email?: string;
  category: string;
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    rating: 0,
    title: '',
    description: '',
    email: '',
    category: ''
  });
  const { toast } = useToast();

  const feedbackTypes = [
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-400' },
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
    { value: 'improvement', label: 'Improvement', icon: Zap, color: 'text-yellow-400' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-green-400' }
  ];

  const categories = [
    'User Interface',
    'Invoice Creation',
    'Client Management',
    'Analytics',
    'PDF Generation',
    'Email Features',
    'Mobile Experience',
    'Performance',
    'Security',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.title.trim() || !feedback.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the title and description fields.',
        variant: 'destructive',
      });
      return;
    }

    if (feedback.rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please provide a rating for your experience.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback.');
      }
      toast({
        title: 'Thank you for your feedback! 🎉',
        description: 'Your input helps us make SmartInvoice better for everyone.',
      });
      setFeedback({
        type: 'general',
        rating: 0,
        title: '',
        description: '',
        email: '',
        category: ''
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(type => type.value === feedback.type);

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg green-glow group"
          size="sm"
        >
          <MessageSquare className="w-6 h-6 text-black group-hover:scale-110 transition-transform duration-200" />
        </Button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-green-900/95 border-green-500/30 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center text-xl">
              <Heart className="w-6 h-6 mr-3 text-green-primary" />
              Help Us Improve SmartInvoice
            </DialogTitle>
            <DialogDescription className="text-green-muted text-base">
              Your feedback is invaluable! Share your thoughts, report bugs, or suggest new features.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Feedback Type */}
            <div className="space-y-3">
              <Label className="text-white font-medium">What type of feedback is this?</Label>
              <div className="grid grid-cols-2 gap-3">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant="outline"
                      className={`h-auto p-4 justify-start ${
                        feedback.type === type.value
                          ? 'border-green-500 bg-green-500/20 text-green-primary'
                          : 'border-green-500/30 text-green-muted hover:border-green-500/50 hover:bg-green-500/10'
                      }`}
                      onClick={() => setFeedback(prev => ({ ...prev, type: type.value as any }))}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${type.color}`} />
                      <div className="text-left">
                        <div className="font-medium">{type.label}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label className="text-white font-medium">How would you rate your overall experience?</Label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1 hover:bg-green-500/20"
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= feedback.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-400'
                      } transition-colors duration-200`}
                    />
                  </Button>
                ))}
                {feedback.rating > 0 && (
                  <span className="ml-3 text-green-muted">
                    {feedback.rating === 5 ? 'Excellent!' : 
                     feedback.rating === 4 ? 'Good' :
                     feedback.rating === 3 ? 'Average' :
                     feedback.rating === 2 ? 'Poor' : 'Very Poor'}
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white font-medium">Category</Label>
              <Select value={feedback.category} onValueChange={(value) => setFeedback(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="input-green">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-green-900 border-green-500/30">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white font-medium">Title *</Label>
              <Input
                id="title"
                value={feedback.title}
                onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                placeholder={
                  feedback.type === 'feature' ? 'What feature would you like to see?' :
                  feedback.type === 'bug' ? 'What issue did you encounter?' :
                  feedback.type === 'improvement' ? 'What could be improved?' :
                  'Brief summary of your feedback'
                }
                className="input-green"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white font-medium">Description *</Label>
              <Textarea
                id="description"
                value={feedback.description}
                onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                placeholder={
                  feedback.type === 'feature' ? 'Describe the feature in detail. How would it help you?' :
                  feedback.type === 'bug' ? 'Please describe the bug, steps to reproduce it, and what you expected to happen.' :
                  feedback.type === 'improvement' ? 'What specific improvements would you suggest and why?' :
                  'Share your thoughts, suggestions, or any other feedback...'
                }
                rows={4}
                className="input-green"
                required
              />
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={feedback.email}
                onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com (if you'd like a response)"
                className="input-green"
              />
              <p className="text-xs text-green-muted">
                Leave your email if you'd like us to follow up on your feedback
              </p>
            </div>

            {/* Feedback Summary */}
            {feedback.title && feedback.description && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  {selectedType && <selectedType.icon className={`w-4 h-4 ${selectedType.color}`} />}
                  <span className="text-sm font-medium text-white">Feedback Summary</span>
                </div>
                <p className="text-sm text-green-muted">
                  <strong>{feedback.title}</strong> - {selectedType?.label}
                  {feedback.rating > 0 && ` (${feedback.rating}/5 stars)`}
                </p>
              </div>
            )}
          </form>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="btn-green-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.title.trim() || !feedback.description.trim() || feedback.rating === 0}
              className="btn-green-primary green-glow"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}