// screens/StoryDetailsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator
} from "react-native";
import { styles } from "../styles/Storydetails";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../firebase'; // Import your Firebase config
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// AsyncStorage helper functions
const getRecentlyPlayed = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('recentlyPlayed');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading recently played:', e);
    return [];
  }
};

const checkIfBookmarked = async (storyId) => {
  try {
    if (!auth.currentUser) return false;
    
    const q = query(
      collection(db, 'bookmarks'),
      where('storyId', '==', storyId),
      where('userId', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};

const saveRecentlyPlayed = async (storyData) => {
  try {
    const existingData = await getRecentlyPlayed();
    // Remove if already exists to avoid duplicates
    const filteredData = existingData.filter(item => item.id !== storyData.id);
    // Add to beginning of array
    const newData = [storyData, ...filteredData].slice(0, 10); // Keep only last 10
    const jsonValue = JSON.stringify(newData);
    await AsyncStorage.setItem('recentlyPlayed', jsonValue);
  } catch (e) {
    console.error('Error saving recently played:', e);
  }
};

// Helper function to check if story already exists in Firebase by title and user
const checkIfStoryAlreadyPlayed = async (storyTitle, userId) => {
  try {
    if (!userId) return false;
    
    const q = query(
      collection(db, 'storyPlays'),
      where('title', '==', storyTitle),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if story already played:', error);
    return false;
  }
};

// Firebase helper function to save story play data
const saveStoryPlayToFirebase = async (storyData) => {
  try {
    // Check if story already exists for this user
    const alreadyExists = await checkIfStoryAlreadyPlayed(storyData.title, auth.currentUser?.uid);
    
    if (alreadyExists) {
      console.log('Story already exists in Firebase, skipping duplicate upload');
      return null; // Return null to indicate no new document was created
    }

    const docRef = await addDoc(collection(db, 'storyPlays'), {
      storyId: storyData.id,
      title: storyData.title,
      description: storyData.description,
      image: storyData.image,
      genre: storyData.genre,
      difficulty: storyData.difficulty,
      likes: storyData.likes,
      plays: storyData.plays,
      playedAt: serverTimestamp(),
      userId: auth.currentUser?.uid,
    });
    console.log('Story play saved to Firebase with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving story play to Firebase: ', error);
    throw error;
  }
};

// Firebase helper function to save bookmark
const saveBookmarkToFirebase = async (storyData) => {
  try {
    // Check if bookmark already exists
    const q = query(
      collection(db, 'bookmarks'),
      where('storyId', '==', storyData.id),
      where('userId', '==', auth.currentUser?.uid)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error('Story is already bookmarked');
    }

    const docRef = await addDoc(collection(db, 'bookmarks'), {
      storyId: storyData.id,
      title: storyData.title,
      description: storyData.description,
      image: storyData.image,
      genre: storyData.genre,
      difficulty: storyData.difficulty,
      likes: storyData.likes,
      plays: storyData.plays,
      bookmarkedAt: serverTimestamp(),
      userId: auth.currentUser?.uid,
    });
    console.log('Bookmark saved to Firebase with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving bookmark to Firebase: ', error);
    throw error;
  }
};

// Firebase helper function to remove bookmark
const removeBookmarkFromFirebase = async (storyId) => {
  try {
    const q = query(
      collection(db, 'bookmarks'),
      where('storyId', '==', storyId),
      where('userId', '==', auth.currentUser?.uid)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Bookmark not found');
    }

    // Delete the bookmark
    const docToDelete = querySnapshot.docs[0];
    await deleteDoc(doc(db, 'bookmarks', docToDelete.id));
    console.log('Bookmark removed from Firebase');
  } catch (error) {
    console.error('Error removing bookmark from Firebase: ', error);
    throw error;
  }
};

// Firebase helper function to save report
const saveReportToFirebase = async (storyData, reportReason) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      storyId: storyData.id,
      title: storyData.title,
      reason: reportReason,
      reportedAt: serverTimestamp(),
      userId: auth.currentUser?.uid,
      status: 'pending' // pending, reviewed, resolved
    });
    console.log('Report saved to Firebase with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving report to Firebase: ', error);
    throw error;
  }
};

const StoryDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { story } = route.params;

  // State for menu visibility and bookmark status
  const [menuVisible, setMenuVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isPlayLoading, setIsPlayLoading] = useState(false); // New state for play button loading

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (auth.currentUser && story.id) {
        const bookmarked = await checkIfBookmarked(story.id);
        setIsBookmarked(bookmarked);
      }
    };
    
    checkBookmarkStatus();
  }, [story.id]);

  const handlePlayPress = async () => {
    try {
      setIsPlayLoading(true); // Start loading animation

      const storyData = {
        id: story.id,
        title: story.title,
        description: story.description,
        image: story.image,
        likes: story.likes,
        plays: story.plays,
        genre: story.genre,
        difficulty: story.difficulty,
        playedAt: new Date().toISOString(),
      };

      // Save to local AsyncStorage
      await saveRecentlyPlayed(storyData);
      
      // Save to Firebase (will check for duplicates)
      const firebaseResult = await saveStoryPlayToFirebase(storyData);
      
      if (firebaseResult === null) {
        console.log('Story already exists in database, continuing to play...');
      }
      
      // Navigate to story play screen
      navigation.navigate("StoryPlay", {
        storyTitle: story.title,
        storyDescription: story.description,
      });
    } catch (error) {
      console.error('Error handling play press:', error);
      Alert.alert(
        'Error',
        'Failed to save story data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPlayLoading(false); // Stop loading animation
    }
  };

  const handleBookmarkPress = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please log in to bookmark stories.');
        setMenuVisible(false);
        return;
      }

      setIsBookmarkLoading(true); // Start loading

      const storyData = {
        id: story.id,
        title: story.title,
        description: story.description,
        image: story.image,
        likes: story.likes,
        plays: story.plays,
        genre: story.genre,
        difficulty: story.difficulty,
      };

      if (isBookmarked) {
        await removeBookmarkFromFirebase(story.id);
        setIsBookmarked(false);
        Alert.alert('Success', 'Bookmark removed successfully!');
      } else {
        await saveBookmarkToFirebase(storyData);
        setIsBookmarked(true);
        Alert.alert('Success', 'Story bookmarked successfully!');
      }
      
      setMenuVisible(false);
    } catch (error) {
      console.error('Error handling bookmark:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to bookmark story. Please try again.',
        [{ text: 'OK' }]
      );
      setMenuVisible(false);
    } finally {
      setIsBookmarkLoading(false); // Stop loading
    }
  };

  const handleReportPress = () => {
    setMenuVisible(false);
    setTimeout(() => {
      setReportModalVisible(true);
    }, 200); // Small delay for smooth transition
  };

  const submitReport = async (reason) => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please log in to report stories.');
        setReportModalVisible(false);
        return;
      }

      setIsReportLoading(true);

      const storyData = {
        id: story.id,
        title: story.title,
      };

      await saveReportToFirebase(storyData, reason);
      setReportModalVisible(false);
      
      // Show success message after modal closes
      setTimeout(() => {
        Alert.alert('Success', 'Thank you for your report. We will review it shortly.');
      }, 300);
    } catch (error) {
      console.error('Error submitting report:', error);
      setReportModalVisible(false);
      setTimeout(() => {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }, 300);
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image source={story.image} style={styles.heroImage} />

          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />

          {/* Navigation Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.mainTitle}>{story.title}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="thumbs-up-outline" size={20} color="#A9A9A9" />
              <Text style={styles.statNumber}>{story.likes}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={20} color="#A9A9A9" />
              <Text style={styles.statNumber}>{story.plays}</Text>
            </View>

            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#A9A9A9" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Story Info */}
          <View style={styles.infoSection}>
            <View style={styles.genreContainer}>
              <Text style={styles.genreTag}>{story.genre}</Text>
              <Text style={styles.difficultyTag}>{story.difficulty}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.description}>{story.description}</Text>
            </View>
          </View>

          {/* Additional spacing for scroll */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Play Button - Updated with loading state */}
      <View style={styles.playButtonContainer}>
        <TouchableOpacity
          style={[
            styles.playButton,
            isPlayLoading && styles.playButtonLoading
          ]}
          onPress={handlePlayPress}
          disabled={isPlayLoading}
        >
          {isPlayLoading ? (
            <>
              <ActivityIndicator 
                size="small" 
                color="#000" 
                style={styles.playLoadingIndicator}
              />
              <Text style={styles.playButtonText}>LOADING...</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="play"
                size={20}
                color="#000"
                style={styles.playIconStyle}
              />
              <Text style={styles.playButtonText}>PLAY</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={menuStyles.modalOverlay}>
            <View style={menuStyles.menuContainer}>
              <TouchableOpacity
                style={[
                  menuStyles.menuItem, 
                  menuStyles.menuItemActive,
                  isBookmarkLoading && menuStyles.menuItemDisabled
                ]}
                onPress={handleBookmarkPress}
                activeOpacity={0.7}
                disabled={isBookmarkLoading}
              >
                {isBookmarkLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons 
                    name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color="#ffffff" 
                  />
                )}
                <Text style={[
                  menuStyles.menuText,
                  isBookmarkLoading && menuStyles.menuTextDisabled
                ]}>
                  {isBookmarkLoading 
                    ? 'Processing...' 
                    : (isBookmarked ? 'Remove Bookmark' : 'Bookmark')
                  }
                </Text>
              </TouchableOpacity>

              <View style={menuStyles.menuDivider} />

              <TouchableOpacity
                style={[menuStyles.menuItem, menuStyles.menuItemActive]}
                onPress={handleReportPress}
                activeOpacity={0.7}
              >
                <Ionicons name="flag-outline" size={20} color="#ff6b6b" />
                <Text style={[menuStyles.menuText, menuStyles.menuTextReport]}>
                  Report
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>  

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReportModalVisible(false)}>
          <View style={reportModalStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={reportModalStyles.modalContainer}>
                {/* Header */}
                <View style={reportModalStyles.modalHeader}>
                  <View style={reportModalStyles.headerLeft}>
                    <Ionicons name="flag" size={24} color="#ff6b6b" />
                    <Text style={reportModalStyles.modalTitle}>Report Story</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setReportModalVisible(false)}
                    style={reportModalStyles.closeButton}
                    disabled={isReportLoading}
                  >
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Subtitle */}
                <Text style={reportModalStyles.modalSubtitle}>
                  Help us understand what's wrong with this story
                </Text>

                {/* Report Options */}
                <View style={reportModalStyles.optionsContainer}>
                  {[
                    { reason: 'Inappropriate Content', icon: 'warning-outline', color: '#ff6b6b' },
                    { reason: 'Spam', icon: 'ban-outline', color: '#ff9500' },
                    { reason: 'Misleading', icon: 'alert-circle-outline', color: '#ffcc00' },
                    { reason: 'Copyright Issues', icon: 'shield-outline', color: '#007aff' },
                    { reason: 'Violence', icon: 'flame-outline', color: '#ff3b30' },
                    { reason: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#8e8e93' }
                  ].map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        reportModalStyles.optionButton,
                        isReportLoading && reportModalStyles.optionDisabled
                      ]}
                      onPress={() => submitReport(option.reason)}
                      disabled={isReportLoading}
                    >
                      <View style={reportModalStyles.optionContent}>
                        <Ionicons 
                          name={option.icon} 
                          size={22} 
                          color={isReportLoading ? '#666' : option.color} 
                        />
                        <Text style={[
                          reportModalStyles.optionText,
                          isReportLoading && reportModalStyles.optionTextDisabled
                        ]}>
                          {option.reason}
                        </Text>
                      </View>
                      {!isReportLoading && (
                        <Ionicons name="chevron-forward" size={18} color="#666" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Loading Overlay */}
                {isReportLoading && (
                  <View style={reportModalStyles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#ff6b6b" />
                    <Text style={reportModalStyles.loadingText}>Submitting report...</Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// Styles for the menu
const menuStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: StatusBar.currentHeight, // Position below status bar + header
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    minWidth: 160,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  menuTextReport: {
    color: '#ff6b6b',
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuTextDisabled: {
    color: '#cccccc',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 12,
    marginVertical: 4,
  },
});
// Add these styles to your existing styles/Storydetails.js file:

const additionalPlayButtonStyles = StyleSheet.create({
  playButtonLoading: {
    opacity: 0.8,
    backgroundColor: '#e0e0e0', // Slightly dimmed background when loading
  },
  playLoadingIndicator: {
    marginRight: 8, // Space between loader and text
  },
});

// Also modify your existing play button styles if needed:
const existingPlayButtonStyles = {
  playButton: {
    // ... your existing styles
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // ... rest of your existing styles
  },
  playIconStyle: {
    marginRight: 8, // Ensure consistent spacing
  },
  playButtonText: {
    // ... your existing text styles
  }
};

// Styles for the report modal
const reportModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 34, // Account for safe area
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#b3b3b3',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionDisabled: {
    opacity: 0.5,
    backgroundColor: '#1f1f1f',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 16,
  },
  optionTextDisabled: {
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonTextDisabled: {
    color: '#666',
  },
});

export default StoryDetailsScreen;