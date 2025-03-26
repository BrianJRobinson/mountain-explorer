const handleSubmitRating = async () => {
  if (!selectedRating) return;

  try {
    setIsSubmitting(true);
    
    const updatedWalk = await onSubmitRating(
      walk.name, 
      selectedRating, 
      comment
    );
    
    // Update all rating properties
    walk.userRating = selectedRating;
    walk.userComment = comment.trim() || undefined;
    walk.averageRating = updatedWalk.averageRating;
    walk.totalRatings = updatedWalk.totalRatings;
    
    console.log('[WalkCard] After rating submission:', {
      hasComment: !!comment.trim(),
      recentCommentsLength: walk.recentComments?.length || 0,
      userComment: walk.userComment
    });

    setShowRatingPanel(false);
    setShowCompletionModal(false);
    
    toast.success('Rating submitted successfully!');
  } catch (error) {
    console.error('[WalkCard] Error in handleSubmitRating:', error);
    toast.error('Failed to submit rating');
  } finally {
    setIsSubmitting(false);
    setIsUpdating(false);
  }
}; 