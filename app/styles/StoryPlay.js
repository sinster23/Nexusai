// styles/StoryPlay.js - Enhanced styles with image components
import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#708090',
    textAlign: 'center',
  },
  storyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  storyContent: {
    paddingVertical: 20,
  },
  initialLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#FFBF00',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 15,
    textAlign: 'center',
  },
  storyTextContainer: {
    marginBottom: 25,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFBF00',
  },
  storyParagraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    fontFamily: 'System',
  },
  typingCursor: {
    color: '#FFBF00',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 1,
  },
  userChoiceContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  userChoiceIndicator: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 5,
  },
  userChoiceLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userChoiceBubble: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    maxWidth: '80%',
    borderBottomRightRadius: 5,
  },
  userChoiceText: {
    color: '#ffffff',
    fontSize: 15,
    fontStyle: 'italic',
  },
  typingIndicator: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFBF00',
    marginHorizontal: 3,
    opacity: 0.4,
  },
  typingText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inlineChoicesSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  choicePrompt: {
    alignItems: 'center',
    marginBottom: 20,
  },
  choicePromptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFBF00',
    textAlign: 'center',
  },
  choicesGrid: {
    marginBottom: 15,
  },
  choiceButton: {
    backgroundColor: '#2a2a2a',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  choiceText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  customChoiceButton: {
    backgroundColor: '#FFBF00',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  customChoiceText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 50,
  },
  
  // Custom input overlay styles
  customInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  customInputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FFBF00',
  },
  customInputTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFBF00',
    textAlign: 'center',
    marginBottom: 20,
  },
  customInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444',
  },
  characterCount: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
    marginBottom: 15,
  },
  customInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  customInputButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  sendCustomButton: {
    backgroundColor: '#FFBF00',
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButtonText: {
    color: '#666',
  },

  // Customization screen styles
  customizationContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  progressBar: {
    marginBottom: 30,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFBF00',
    borderRadius: 2,
  },
  progressText: {
    color: '#FFBF00',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  questionContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedOption: {
    backgroundColor: '#FFBF00',
    borderColor: '#FFBF00',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#000',
    fontWeight: 'bold',
  },
  answerInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 50,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  prevButton: {
    backgroundColor: '#666',
  },
  nextButton: {
    backgroundColor: '#FFBF00',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nextButtonText: {
    color: '#000',
  },

  // NEW: Image generation styles
  sceneImageContainer: {
    marginTop: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  imageLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  imageLoadingText: {
    color: '#FFBF00',
    fontSize: 14,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  sceneImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFBF00',
    shadowColor: '#FFBF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sceneImage: {
    width: screenWidth - 80,
    height: (screenWidth - 80) * 0.75, // 4:3 aspect ratio
    borderRadius: 10,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
  },
  imageErrorContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
    alignItems: 'center',
  },
  imageErrorText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Enhanced visual effects
  glowEffect: {
    shadowColor: '#FFBF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  
  // Responsive adjustments for smaller screens
  ...(screenWidth < 375 && {
    storyParagraph: {
      fontSize: 15,
      lineHeight: 22,
    },
    choiceText: {
      fontSize: 15,
    },
    customInputTitle: {
      fontSize: 18,
    },
    sceneImage: {
      width: screenWidth - 60,
      height: (screenWidth - 60) * 0.75,
    },
     sceneImageContainer: {
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },

  // Image loading state
  imageLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  
  imageLoadingText: {
    color: '#FFBF00',
    fontSize: 14,
    marginLeft: 10,
    fontStyle: 'italic',
  },

  // Scene image wrapper with animation support
  sceneImageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // The actual scene image
  sceneImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },

  // Subtle overlay for better text readability if needed
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  // Error state for failed image loading
  imageErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
    borderStyle: 'dashed',
  },

  imageErrorText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },

  // Retry button for failed images
  retryImageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#404040',
    borderRadius: 6,
  },

  retryImageText: {
    color: '#FFBF00',
    fontSize: 12,
    fontWeight: '500',
  },

  // Enhanced typing cursor with animation
  typingCursor: {
    color: '#FFBF00',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 2,
    animation: 'blink 1s infinite',
  },

  // Debug info (you can remove this in production)
  debugInfo: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFBF00',
  },

  debugText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Enhanced loading states
  enhancedLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },

  loadingTextWithIcon: {
    color: '#FFBF00',
    fontSize: 14,
    marginLeft: 10,
    textAlign: 'center',
  },

  // Better error handling UI
  errorContainer: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    padding: 15,
    margin: 10,
  },

  errorTitle: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  errorMessage: {
    color: '#ffaaaa',
    fontSize: 14,
    lineHeight: 20,
  },

  errorRetryButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },

  errorRetryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
   sceneImageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    minHeight: 200,
  },
  
  imageLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    backgroundColor: '#1a1a1a',
  },
  
  imageLoadingText: {
    color: '#FFBF00',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  
  retryText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  sceneImageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  sceneImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
  },
  
  imageInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  
  imageInfoText: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  
  imageErrorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  
  imageErrorText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  
  retryImageButton: {
    backgroundColor: '#FFBF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  
  retryImageText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  
  debugButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  
  debugText: {
    color: '#FFBF00',
    fontSize: 10,
  },
  }),
   saveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  saveIndicatorText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Updated header to accommodate save indicator
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom:15,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 191, 0, 0.2)',
  },

  // Resume session styles
  resumeIndicator: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  resumeIndicatorText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  resumeSubText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },

  // Session management styles
  sessionActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  sessionActionButton: {
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
    flex: 1,
  },
  sessionActionButtonText: {
    color: '#FFBF00',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteSessionButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  deleteSessionButtonText: {
    color: '#F44336',
  },

  // Progress indicator for auto-save
  autoSaveProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  autoSaveProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  sessionPromptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },

  sessionPromptContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },

  sessionPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFBF00',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'serif',
  },

  sessionPromptMessage: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },

  sessionProgressContainer: {
    marginBottom: 25,
  },

  sessionProgressText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 10,
  },

  sessionProgressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },

  sessionProgressFill: {
    height: '100%',
    backgroundColor: '#FFBF00',
    borderRadius: 4,
    minWidth: 8,
  },

  sessionPromptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },

  sessionPromptButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
  },

  resetButtonText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },

  continueButton: {
    backgroundColor: '#FFBF00',
    shadowColor: '#FFBF00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  continueButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});