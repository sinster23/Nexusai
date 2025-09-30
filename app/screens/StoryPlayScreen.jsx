import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
  Image,
  Dimensions,
  BackHandler,
} from "react-native";
import { styles } from "../styles/StoryPlay";
import StorySessionService from '../utils/sessionManager';
import { auth } from '../firebase';
import { BACKEND_URL } from "@env";

const { width: screenWidth } = Dimensions.get('window');

// Markdown text formatter component
const MarkdownText = ({ children, style }) => {
  const formatMarkdown = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    const parts = [];
    let currentIndex = 0;
    
    // Regex to match bold text (**text** or __text__)
    const boldRegex = /(\*\*|__)(.*?)\1/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push({
          text: text.slice(currentIndex, match.index),
          bold: false,
          key: `normal_${parts.length}`
        });
      }
      
      // Add the bold text
      parts.push({
        text: match[2],
        bold: true,
        key: `bold_${parts.length}`
      });
      
      currentIndex = boldRegex.lastIndex;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({
        text: text.slice(currentIndex),
        bold: false,
        key: `normal_${parts.length}`
      });
    }
    
    return parts;
  };

  const formattedParts = formatMarkdown(children);
  
  return (
    <Text style={style}>
      {formattedParts.map(part => (
        <Text 
          key={part.key} 
          style={part.bold ? [style, { fontWeight: 'bold' }] : style}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

const StoryPlayScreen = ({ route }) => {
  const { storyTitle, storyDescription, sessionId = null, isResume = false } = route.params;
  const [storyParts, setStoryParts] = useState([]);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [storyContext, setStoryContext] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [choicesVisible, setChoicesVisible] = useState(false);
  
  // New states for character customization
  const [showCustomization, setShowCustomization] = useState(!isResume);
  const [customizationQuestions, setCustomizationQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Firebase session states
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [savingSession, setSavingSession] = useState(false);
  const [loadingSession, setLoadingSession] = useState(isResume);
  
  // NEW: Session check states
  const [checkingExistingSession, setCheckingExistingSession] = useState(!isResume);
  const [existingSessionFound, setExistingSessionFound] = useState(null);
  const [showSessionPrompt, setShowSessionPrompt] = useState(false);
  
  // Existing typing animation states
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState("");
  const [fullTextToType, setFullTextToType] = useState("");
  const [typingPartId, setTypingPartId] = useState(null);
  
  // Image generation states
  const [generatingImage, setGeneratingImage] = useState(false);
  const [currentSceneImage, setCurrentSceneImage] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [pendingImagePrompt, setPendingImagePrompt] = useState(null);
  
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingIntervalRef = useRef(null);
  const imageOpacity = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  const limitWords = (text, limit) => {
  let words = text.trim().split(/\s+/);
  return words.length > limit
    ? words.slice(0, limit).join(" ") + "..."
    : text;
};
  
  useEffect(() => {
    if (isResume && sessionId) {
      loadStorySession();
    } else {
      // Check for existing session before starting
      checkForExistingSession();
    }
  }, []);

// NEW: Enhanced check for existing session with better error handling
const checkForExistingSession = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('User not authenticated, proceeding with new story');
    setCheckingExistingSession(false);
    loadCustomizationQuestions();
    return;
  }

  try {
    setCheckingExistingSession(true);
    console.log('Checking for existing session for story:', storyTitle);
    
    const existingSession = await StorySessionService.checkExistingSession(storyTitle);
    
    if (existingSession && existingSession.storyParts && existingSession.storyParts.length > 0) {
      console.log('Found existing session:', existingSession.sessionId, 'with', existingSession.storyParts.length, 'parts');
      
      // Only prompt if there's meaningful progress (more than just initial story)
      const hasProgress = existingSession.storyParts.length > 1 || 
                         (existingSession.storyParts.length === 1 && existingSession.currentChoices?.length > 0);
      
      if (hasProgress) {
        setExistingSessionFound(existingSession);
        setShowSessionPrompt(true);
      } else {
        console.log('Session found but no meaningful progress, starting new story');
        loadCustomizationQuestions();
      }
    } else {
      console.log('No existing session found, starting new story');
      loadCustomizationQuestions();
    }
  } catch (error) {
    console.error('Failed to check for existing session:', error);
    console.log('Proceeding with new story due to error');
    loadCustomizationQuestions();
  } finally {
    setCheckingExistingSession(false);
  }
};

// FIXED: Enhanced session data loading with validation
const loadStorySessionData = async (sessionData) => {
  try {
    console.log('Loading existing session data');
    console.log('Session data to load:', {
      sessionId: sessionData.sessionId,
      storyTitle: sessionData.storyTitle,
      storyPartsCount: sessionData.storyParts?.length || 0,
      choicesCount: sessionData.currentChoices?.length || 0,
      awaitingInput: sessionData.awaitingInput,
      hasStoryContext: !!sessionData.storyContext,
      hasUserAnswers: !!sessionData.userAnswers,
      hasCustomizationQuestions: !!sessionData.customizationQuestions,
      currentSceneImage: !!sessionData.currentSceneImage
    });
    
    // Validate essential data
    if (!sessionData.storyParts || !Array.isArray(sessionData.storyParts)) {
      throw new Error('Invalid session data: missing story parts');
    }

    // Restore story state with proper validation and defaults
    setStoryParts(sessionData.storyParts.map(part => ({
      id: part.id || 1,
      content: part.content || '',
      isUserChoice: Boolean(part.isUserChoice),
      timestamp: part.timestamp || new Date()
    })));
    
    setCurrentChoices(Array.isArray(sessionData.currentChoices) ? sessionData.currentChoices : []);
    setStoryContext(sessionData.storyContext || "");
    setUserAnswers(sessionData.userAnswers || {});
    setCustomizationQuestions(Array.isArray(sessionData.customizationQuestions) ? sessionData.customizationQuestions : []);
    setAwaitingInput(Boolean(sessionData.awaitingInput));
    setCurrentSceneImage(sessionData.currentSceneImage || null);
    setShowCustomization(false); // Skip customization for existing session
    
    console.log('Session state restored:', {
      storyPartsCount: sessionData.storyParts.length,
      choicesCount: sessionData.currentChoices?.length || 0,
      awaitingInput: Boolean(sessionData.awaitingInput),
      hasStoryContext: !!sessionData.storyContext
    });

    // Show choices if awaiting input with a delay for better UX
    if (sessionData.awaitingInput && sessionData.currentChoices?.length > 0) {
      setTimeout(() => {
        setChoicesVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 1000);
    }

    // Set image opacity if there's a scene image
    if (sessionData.currentSceneImage) {
      imageOpacity.setValue(1);
    }

    console.log('Existing session loaded successfully');
  } catch (error) {
    console.error('Failed to load existing session data:', error);
    Alert.alert(
      "Session Loading Error", 
      "Failed to load your saved story session. Would you like to start a new story?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => navigation.goBack()
        },
        {
          text: "Start New Story",
          onPress: () => {
            console.log('User chose to start new story after session load failure');
            loadCustomizationQuestions();
          }
        }
      ]
    );
  } finally {
    setLoadingSession(false);
  }
};

  // NEW: Handle user's choice for existing session
  const handleExistingSessionChoice = (shouldContinue) => {
    setShowSessionPrompt(false);
    
    if (shouldContinue) {
      // Continue existing session
      console.log('User chose to continue existing session');
      setCurrentSessionId(existingSessionFound.sessionId);
      setLoadingSession(true);
      loadStorySessionData(existingSessionFound);
    } else {
      // Reset and start new
      console.log('User chose to reset and start new story');
      resetExistingSession();
    }
    
    setExistingSessionFound(null);
  };

  // NEW: Reset existing session and start new
  const resetExistingSession = async () => {
    try {
      setLoading(true);
      console.log('Deleting existing sessions for story:', storyTitle);
      
      const deletedCount = await StorySessionService.deleteAllStorySessions(storyTitle);
      console.log(`Deleted ${deletedCount} existing sessions`);
      
      // Start fresh
      loadCustomizationQuestions();
    } catch (error) {
      console.error('Failed to reset existing session:', error);
      Alert.alert("Error", "Failed to reset existing story. Please try again.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (showSessionPrompt) {
        // If showing session prompt, just go back
        navigation.goBack();
        return true;
      }
      
      if (showCustomization) {
        // If in customization, just go back
        navigation.goBack();
        return true;
      }
      
      Alert.alert(
        "Hold on!", 
        "Your progress will be saved automatically. Are you sure you want to go back?", 
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          { 
            text: "YES", 
            onPress: () => {
              // Save before going back
              if (storyParts.length > 0 && currentSessionId) {
                saveStorySession().finally(() => navigation.goBack());
              } else {
                navigation.goBack();
              }
            }
          },
        ]
      );
      return true; 
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); 
  }, [showSessionPrompt, showCustomization, storyParts, currentSessionId]);

  useEffect(() => {
    if (awaitingInput && currentChoices.length > 0 && !isTyping) {
      setTimeout(() => {
        setChoicesVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 1000);
    }
  }, [awaitingInput, currentChoices, isTyping]);

  // Auto-save session after each story part
  useEffect(() => {
    if (
      !showCustomization && 
      storyParts.length > 0 && 
      currentSessionId && 
      !isTyping && 
      !loading && 
      !loadingSession
    ) {
      const timeoutId = setTimeout(() => {
        console.log('Auto-saving session...');
        saveStorySession();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [storyParts, currentChoices, storyContext, userAnswers, currentSessionId, showCustomization, isTyping, loading, loadingSession]);

  // Generate unique session ID
  const generateSessionId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save story session to Firebase
  const saveStorySession = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user authenticated, skipping save');
      return;
    }

    if (!showCustomization && (!storyParts || storyParts.length === 0)) {
      console.log('No story parts to save, skipping save operation');
      return;
    }

    try {
      setSavingSession(true);
      
      const sessionData = {
        storyTitle: storyTitle || 'Untitled Story',
        storyDescription: storyDescription || '',
        storyParts: storyParts.map(part => ({
          id: part.id,
          content: part.content || '',
          isUserChoice: Boolean(part.isUserChoice),
          timestamp: part.timestamp || new Date().toISOString()
        })),
        currentChoices: currentChoices || [],
        storyContext: storyContext || '',
        userAnswers: userAnswers || {},
        customizationQuestions: customizationQuestions || [],
        awaitingInput: Boolean(awaitingInput),
        currentSceneImage: currentSceneImage || null,
        isCompleted: Boolean(!awaitingInput && currentChoices.length === 0),
        progress: {
          totalParts: storyParts.length,
          lastChoiceIndex: storyParts.filter(part => part.isUserChoice).length
        }
      };

      if (currentSessionId) {
        sessionData.sessionId = currentSessionId;
      }

      console.log('Attempting to save session with data structure:', {
        hasStoryTitle: !!sessionData.storyTitle,
        hasStoryParts: !!sessionData.storyParts,
        storyPartsLength: sessionData.storyParts?.length || 0,
        hasCurrentChoices: !!sessionData.currentChoices,
        sessionId: currentSessionId || 'NEW',
        userId: user.uid,
        awaitingInput: sessionData.awaitingInput,
        isCompleted: sessionData.isCompleted
      });

      const savedSessionId = await StorySessionService.saveSession(sessionData);
      
      if (!currentSessionId) {
        setCurrentSessionId(savedSessionId);
      }

      console.log('Story session saved successfully:', savedSessionId);
    } catch (error) {
      console.error('Failed to save story session:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules');
      } else if (error.code === 'unavailable') {
        console.error('Firestore unavailable - network issue');
      } else {
        console.error('Unknown error saving session');
      }
    } finally {
      setSavingSession(false);
    }
  };

  // Initialize story with proper session creation
  const initializeStory = async () => {
    try {
      setLoading(true);
      
      if (!currentSessionId) {
        const newSessionId = generateSessionId();
        setCurrentSessionId(newSessionId);
        console.log('Generated new session ID:', newSessionId);
      }
      
      const response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: storyTitle,
          description: storyDescription,
          isInitial: true,
          customization: userAnswers,
          questions: customizationQuestions
        })
      });

      const data = await response.json();
      
      const newPart = {
        id: 1,
        content: "",
        timestamp: new Date()
      };
      
      setStoryParts([newPart]);
      setCurrentChoices(data.choices || []);
      setStoryContext(data.story);
      setAwaitingInput(true);
      
      startTypingAnimation(data.story, 1, data.imagePrompt);
      
    } catch (error) {
      console.error("Failed to initialize story:", error);
      Alert.alert("Error", "Failed to load the story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load story session with better error handling
  const loadStorySession = async () => {
    const user = auth.currentUser;
    if (!user || !sessionId) {
      Alert.alert("Error", "Unable to load story session. Please try again.");
      navigation.goBack();
      return;
    }

    try {
      setLoadingSession(true);
      
      console.log('Attempting to load session:', sessionId);
      const sessionData = await StorySessionService.loadSession(sessionId);

      // Use the existing loadStorySessionData function
      await loadStorySessionData(sessionData);

    } catch (error) {
      console.error('Failed to load story session:', error);
      Alert.alert("Error", "Failed to load your story session. Please try again.");
      navigation.goBack();
    }
  };

  // Delete story session
  const deleteStorySession = async () => {
    const user = auth.currentUser;
    if (!user || !currentSessionId) return;

    try {
      await StorySessionService.deleteSession(currentSessionId);
      console.log('Story session deleted successfully');
    } catch (error) {
      console.error('Failed to delete story session:', error);
    }
  };

  // Generate scene image using Gemini's image prompt
  const generateSceneImage = async (imagePrompt) => {
    if (!imagePrompt || typeof imagePrompt !== 'string') {
      console.log('No valid image prompt provided:', imagePrompt);
      return;
    }
    console.log('Generating scene image using prompt:', imagePrompt);

    setGeneratingImage(true);
    setImageLoadError(false);
    
    try {
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=384&model=flux&enhance=true&nologo=true&seed=${Date.now()}`;
      
      setCurrentSceneImage(imageUrl);
      
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error("Failed to generate scene image:", error);
      setImageLoadError(true);
    } finally {
      setGeneratingImage(false);
      setPendingImagePrompt(null);
    }
  };

  // Load customization questions from backend
  const loadCustomizationQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const response = await fetch(`${BACKEND_URL}/api/customization-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: storyTitle,
          description: storyDescription
        })
      });

      const data = await response.json();
      setCustomizationQuestions(data.questions || []);
      
      const initialAnswers = {};
      data.questions?.forEach((question, index) => {
        initialAnswers[index] = '';
      });
      setUserAnswers(initialAnswers);
      
    } catch (error) {
      console.error("Failed to load customization questions:", error);
      Alert.alert("Error", "Failed to load story customization. Starting with defaults.");
      setShowCustomization(false);
      initializeStory();
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handle answer input
  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  // Handle multiple choice selection
  const handleMultipleChoiceSelect = (questionIndex, option) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: option
    }));
  };

  // Proceed to next question or start story
  const proceedToNext = () => {
    if (currentQuestionIndex < customizationQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowCustomization(false);
      initializeStory();
    }
  };

  // Go back to previous question
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    const currentAnswer = userAnswers[currentQuestionIndex];
    return currentAnswer && currentAnswer.trim().length > 0;
  };

  // Enhanced typing animation function
  const startTypingAnimation = (text, partId, imagePrompt = null) => {
    setIsTyping(true);
    setCurrentTypingText("");
    setFullTextToType(text);
    setTypingPartId(partId);
    
    const currentImagePrompt = imagePrompt;
    console.log('Starting typing with image prompt:', currentImagePrompt);
    
    let currentIndex = 0;
    const typingSpeed = 5;
    
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setCurrentTypingText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
        setCurrentTypingText("");
        setFullTextToType("");
        setTypingPartId(null);
        
        setStoryParts(prev => 
          prev.map(part => 
            part.id === partId ? { ...part, content: text } : part
          )
        );
        
        if (currentImagePrompt && typeof currentImagePrompt === 'string' && currentImagePrompt.trim()) {
          console.log('🎨 Typing complete, generating image with:', currentImagePrompt);
          generateSceneImage(currentImagePrompt);
        } else {
          console.log('🚫 No valid image prompt available:', currentImagePrompt);
        }
      }
    }, typingSpeed);
  };

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const resetAnimations = () => {
    setChoicesVisible(false);
    fadeAnim.setValue(0);
    imageOpacity.setValue(0);
    setCurrentSceneImage(null);
    setPendingImagePrompt(null);
  };

  const handleChoiceSelection = async (choice) => {
    if (isTyping) return;
    
    resetAnimations();
    setLoading(true);
    setAwaitingInput(false);

    const choicePart = {
      id: storyParts.length + 1,
      content: choice,
      isUserChoice: true,
      timestamp: new Date()
    };

    setStoryParts(prev => [...prev, choicePart]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/continue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: storyTitle,
          storyContext: storyContext,
          userChoice: choice,
          storyHistory: storyParts.map(part => part.content).join("\n\n"),
          customization: userAnswers
        })
      });

      const data = await response.json();

      const responsePart = {
        id: storyParts.length + 2,
        content: "",
        timestamp: new Date()
      };

      setStoryParts(prev => [...prev, responsePart]);
      setCurrentChoices(data.choices || []);
      setStoryContext(prev => prev + `\n\nUser chose: ${choice}\n\n${data.story}`);
      setAwaitingInput(!data.isEnding);
      setLoading(false);
      
      startTypingAnimation(data.story, responsePart.id, data.imagePrompt);

      if (data.isEnding) {
        setCurrentChoices([]);
        setTimeout(() => {
          if (!isTyping) {
            Alert.alert(
              "Story Complete",
              `You've reached a ${data.endingType || 'unique'} ending! Thanks for playing.`,
              [
                {
                  text: "Delete Session",
                  style: "destructive",
                  onPress: () => {
                    deleteStorySession().finally(() => navigation.goBack());
                  },
                },
                {
                  text: "Keep & Exit",
                  onPress: () => navigation.goBack()
                }
              ]
            );
          }
        }, data.story.length * 20 + 1000);
      }
    } catch (error) {
      console.error("Failed to continue story:", error);
      Alert.alert("Error", "Failed to continue the story. Please try again.");
      setStoryParts(prev => prev.slice(0, -1));
      setAwaitingInput(true);
      setLoading(false);
    }
  };

  const handleCustomInput = async () => {
    if (!userInput.trim() || isTyping) return;
    
    resetAnimations();
    setLoading(true);
    setAwaitingInput(false);
    setShowCustomInput(false);

    const inputPart = {
      id: storyParts.length + 1,
      content: userInput,
      isUserChoice: true,
      timestamp: new Date()
    };

    setStoryParts(prev => [...prev, inputPart]);
    const currentInput = userInput;
    setUserInput("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/continue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: storyTitle,
          storyContext: storyContext,
          userChoice: currentInput,
          storyHistory: storyParts.map(part => part.content).join("\n\n"),
          isCustomInput: true,
          customization: userAnswers
        })
      });

      const data = await response.json();

      const responsePart = {
        id: storyParts.length + 2,
        content: "",
        timestamp: new Date()
      };

      setStoryParts(prev => [...prev, responsePart]);
      setCurrentChoices(data.choices || []);
      setStoryContext(prev => prev + `\n\nUser chose: ${currentInput}\n\n${data.story}`);
      setAwaitingInput(!data.isEnding);
      setLoading(false);
      
      startTypingAnimation(data.story, responsePart.id, data.imagePrompt);

      if (data.isEnding) {
        setCurrentChoices([]);
        setTimeout(() => {
          if (!isTyping) {
            Alert.alert(
              "Story Complete", 
              `You've reached a ${data.endingType || 'unique'} ending! Thanks for playing.`,
              [
                {
                  text: "Delete Session", 
                  style: "destructive",
                  onPress: () => {
                    deleteStorySession().finally(() => navigation.goBack());
                  }
                },
                {
                  text: "Keep & Exit",
                  onPress: () => navigation.goBack()
                }
              ]
            );
          }
        }, data.story.length * 20 + 1000);
      }
    } catch (error) {
      console.error("Failed to continue story:", error);
      Alert.alert("Error", "Failed to continue the story. Please try again.");
      setStoryParts(prev => prev.slice(0, -1));
      setAwaitingInput(true);
      setLoading(false);
    }
  };

  // Render customization question
  const renderQuestion = (question, index) => {
    if (question.type === 'multiple_choice') {
      return (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.optionsContainer}>
            {question.options.map((option, optionIndex) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.optionButton,
                  userAnswers[index] === option && styles.selectedOption
                ]}
                onPress={() => handleMultipleChoiceSelect(index, option)}
              >
                <Text style={[
                  styles.optionText,
                  userAnswers[index] === option && styles.selectedOptionText
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else {
      return (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <TextInput
            style={styles.answerInput}
            value={userAnswers[index] || ''}
            onChangeText={(text) => handleAnswerChange(index, text)}
            placeholder="Type your answer..."
            placeholderTextColor="#888"
            multiline={question.type === 'long_text'}
            maxLength={question.maxLength || 100}
          />
          {question.maxLength && (
            <Text style={styles.characterCount}>
              {(userAnswers[index] || '').length}/{question.maxLength}
            </Text>
          )}
        </View>
      );
    }
  };

  // Render scene image component
  const renderSceneImage = () => {
    if (!currentSceneImage && !generatingImage) return null;
    
    return (
      <View style={styles.sceneImageContainer}>
        {generatingImage && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color="#FFBF00" />
            <Text style={styles.imageLoadingText}>Generating scene...</Text>
          </View>
        )}
        
        {currentSceneImage && !generatingImage && (
          <Animated.View style={[styles.sceneImageWrapper, { opacity: imageOpacity }]}>
            <Image
              source={{ uri: currentSceneImage }}
              style={styles.sceneImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Image loading error:', error);
                setImageLoadError(true);
                setCurrentSceneImage(null);
              }}
              onLoad={() => {
                setImageLoadError(false);
              }}
            />
            <View style={styles.imageOverlay} />
          </Animated.View>
        )}
        
        {imageLoadError && !generatingImage && (
          <View style={styles.imageErrorContainer}>
            <Text style={styles.imageErrorText}>Scene visualization unavailable</Text>
          </View>
        )}
      </View>
    );
  };

  // Render save indicator
  const renderSaveIndicator = () => {
    if (!savingSession) return null;
    
    return (
      <View style={styles.saveIndicator}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.saveIndicatorText}>Saving...</Text>
      </View>
    );
  };

  // NEW: Render session choice prompt
  const renderSessionPrompt = () => {
    if (!showSessionPrompt || !existingSessionFound) return null;
    
    const progressPercent = existingSessionFound.storyParts 
      ? Math.round((existingSessionFound.storyParts.length / 20) * 100) 
      : 0;
    
    return (
      <View style={styles.sessionPromptOverlay}>
        <View style={styles.sessionPromptContainer}>
          <Text style={styles.sessionPromptTitle}>Continue Your Story?</Text>
          <Text style={styles.sessionPromptMessage}>
            You have an existing story session for "{storyTitle}".
          </Text>
          
          <View style={styles.sessionProgressContainer}>
            <Text style={styles.sessionProgressText}>
              Progress: {existingSessionFound.storyParts?.length || 0} parts completed
            </Text>
            <View style={styles.sessionProgressBar}>
              <View 
                style={[
                  styles.sessionProgressFill, 
                  { width: `${Math.min(progressPercent, 100)}%` }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.sessionPromptButtons}>
            <TouchableOpacity
              style={[styles.sessionPromptButton, styles.resetButton]}
              onPress={() => handleExistingSessionChoice(false)}
            >
              <Text style={styles.resetButtonText}>Start Fresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.sessionPromptButton, styles.continueButton]}
              onPress={() => handleExistingSessionChoice(true)}
            >
              <Text style={styles.continueButtonText}>Continue Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Show initial loading while checking for existing session
  if (checkingExistingSession) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar backgroundColor="#0a0a0a" barStyle="light-content" />
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color="#FFBF00" />
          <Text style={styles.loadingText}>Checking for existing story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show session choice prompt
  if (showSessionPrompt) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar backgroundColor="#0a0a0a" barStyle="light-content" />
        {renderSessionPrompt()}
      </SafeAreaView>
    );
  }

  if (loadingSession) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar backgroundColor="#0a0a0a" barStyle="light-content" />
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color="#FFBF00" />
          <Text style={styles.loadingText}>Loading your story session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showCustomization) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar backgroundColor="#0a0a0a" barStyle="light-content" />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{storyTitle}</Text>
            {renderSaveIndicator()}
          </View>

          {loadingQuestions ? (
            <View style={styles.initialLoading}>
              <ActivityIndicator size="large" color="#FFBF00" />
              <Text style={styles.loadingText}>Preparing your story experience...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.customizationContainer}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.progressBar}>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${((currentQuestionIndex + 1) / customizationQuestions.length) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentQuestionIndex + 1} of {customizationQuestions.length}
                </Text>
              </View>

              {customizationQuestions.length > 0 && customizationQuestions[currentQuestionIndex] && 
                renderQuestion(customizationQuestions[currentQuestionIndex], currentQuestionIndex)
              }

              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.prevButton,
                    currentQuestionIndex === 0 && styles.disabledButton
                  ]}
                  onPress={goToPrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <Text style={[
                    styles.navButtonText,
                    currentQuestionIndex === 0 && styles.disabledButtonText
                  ]}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.nextButton,
                    !isCurrentQuestionAnswered() && styles.disabledButton
                  ]}
                  onPress={proceedToNext}
                  disabled={!isCurrentQuestionAnswered()}
                >
                  <Text style={[
                    styles.navButtonText,
                    styles.nextButtonText,
                    !isCurrentQuestionAnswered() && styles.disabledButtonText
                  ]}>
                    {currentQuestionIndex === customizationQuestions.length - 1 ? 'Start Story' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor="#0a0a0a" barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}  ellipsizeMode="tail">{limitWords(storyTitle, 4)}</Text>
          {renderSaveIndicator()}
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.storyContainer} 
          contentContainerStyle={styles.storyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading && storyParts.length === 0 ? (
            <View style={styles.initialLoading}>
              <ActivityIndicator size="large" color="#FFBF00" />
              <Text style={styles.loadingText}>Crafting your story...</Text>
            </View>
          ) : (
            <>
              {storyParts.map((part, index) => (
                <View key={part.id}>
                  {part.isUserChoice ? (
                    <View style={styles.userChoiceContainer}>
                      <View style={styles.userChoiceIndicator}>
                        <Text style={styles.userChoiceLabel}>You chose:</Text>
                      </View>
                      <View style={styles.userChoiceBubble}>
                        <Text style={styles.userChoiceText}>"{part.content}"</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.storyTextContainer}>
                      <MarkdownText style={styles.storyParagraph}>
                        {isTyping && typingPartId === part.id ? currentTypingText : part.content}
                      </MarkdownText>
                      {isTyping && typingPartId === part.id && (
                        <Text style={styles.typingCursor}>|</Text>
                      )}
                      
                      {!isTyping && typingPartId !== part.id && index === storyParts.length - 1 && renderSceneImage()}
                    </View>
                  )}
                </View>
              ))}
              
              {loading && !isTyping && (
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={[styles.typingDot, { animationDelay: 200 }]} />
                    <View style={[styles.typingDot, { animationDelay: 400 }]} />
                  </View>
                  <Text style={styles.typingText}>The story continues...</Text>
                </View>
              )}

              {choicesVisible && awaitingInput && !loading && !isTyping && (
                <Animated.View 
                  style={[
                    styles.inlineChoicesSection,
                    { opacity: fadeAnim }
                  ]}
                >
                  <View style={styles.choicePrompt}>
                    <Text style={styles.choicePromptText}>What do you do next?</Text>
                  </View>
                  
                  <View style={styles.choicesGrid}>
                    {currentChoices.map((choice, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.choiceButton}
                        onPress={() => handleChoiceSelection(choice)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.choiceText}>{choice}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.customChoiceButton}
                    onPress={() => setShowCustomInput(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.customChoiceText}>Manifest your own action</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <View style={styles.bottomSpacer} />
            </>
          )}
        </ScrollView>

        {showCustomInput && (
          <View style={styles.customInputOverlay}>
            <View style={styles.customInputContainer}>
              <Text style={styles.customInputTitle}>What do you do?</Text>
              <TextInput
                value={userInput}
                onChangeText={setUserInput}
                placeholder="Describe your action in detail..."
                placeholderTextColor="#888"
                style={styles.customInput}
                multiline
                autoFocus
                maxLength={300}
              />
              <Text style={styles.characterCount}>{userInput.length}/300</Text>
              <View style={styles.customInputButtons}>
                <TouchableOpacity
                  style={[styles.customInputButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCustomInput(false);
                    setUserInput("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.customInputButton, 
                    styles.sendCustomButton,
                    (!userInput.trim() || isTyping) && styles.disabledButton
                  ]}
                  onPress={handleCustomInput}
                  disabled={!userInput.trim() || isTyping}
                >
                  <Text style={[
                    styles.sendButtonText,
                    (!userInput.trim() || isTyping) && styles.disabledButtonText
                  ]}>Continue Story</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default StoryPlayScreen;