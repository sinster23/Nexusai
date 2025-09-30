import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Animated, 
  ScrollView, 
  Dimensions,
  StatusBar,
  FlatList,
  Modal,
  TextInput,
  Alert
} from "react-native";
import { getAuth, updateProfile, deleteUser, signInAnonymously } from "firebase/auth";
import { db } from '../firebase'; // Your Firebase config
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const TABS = [
  { id: 'scenarios', name: 'SCENARIOS', icon: 'create-outline' },
  { id: 'adventures', name: 'ADVENTURES', icon: 'book-outline' },
  { id: 'bookmarks', name: 'BOOKMARKS', icon: 'bookmark-outline' }
];

// Avatar options for selection
const AVATAR_OPTIONS = [
  { id: 1, seed: 'adventurer1' },
  { id: 2, seed: 'adventurer2' },
  { id: 3, seed: 'adventurer3' },
  { id: 4, seed: 'adventurer4' },
  { id: 5, seed: 'adventurer5' },
];

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'approved':
      return '#10B981'; // Green
    case 'rejected':
      return '#EF4444'; // Red
    case 'pending':
    default:
      return '#F59E0B'; // Orange
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'approved':
      return 'checkmark-circle';
    case 'rejected':
      return 'close-circle';
    case 'pending':
    default:
      return 'time';
  }
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('adventures');
  const [showFilters, setShowFilters] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [updating, setUpdating] = useState(false);
  const [playedStories, setPlayedStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [submittedScenarios, setSubmittedScenarios] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [bookmarkedStories, setBookmarkedStories] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  
  // Get safe area insets for proper spacing
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const profileImageAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Fetch user profile data from Firebase
  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        setEditedUsername(profileData.username || '');
        setSelectedAvatar(profileData.avatar || '');
        return profileData;
      } else {
        console.log("No user profile found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load user profile");
      return null;
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      
      // Fetch user profile data from Firebase
      fetchUserProfile(currentUser.uid).then((profileData) => {
        if (profileData) {
          // Fetch data based on active tab when user profile is loaded
          if (activeTab === 'adventures') {
            fetchPlayedStories(currentUser.uid);
          } else if (activeTab === 'scenarios') {
            fetchSubmittedScenarios(currentUser.uid);
          } else if (activeTab === 'bookmarks') {
            fetchBookmarkedStories(currentUser.uid);
          }
        }
      });
    }
    setLoading(false);
    
    // Start animations after loading
    if (!loading) {
      Animated.stagger(200, [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(profileImageAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const handleLogoutGuest = async () => {
    try {
      if (user?.isAnonymous) {
        // Delete the guest user account
        await deleteUser(user);
        Alert.alert("Guest Session Ended", "Your guest account has been deleted.");
      } else {
        // Just sign out if not anonymous
        await signOut(auth);
      }
    } catch (error) {
      console.log("Error deleting guest:", error);
      Alert.alert("Error", "Could not delete guest account. Try again.");
    }
  };

  // Fetch played stories from Firebase
  const fetchPlayedStories = async (userId) => {
    if (activeTab !== 'adventures') return;
    
    setLoadingStories(true);
    try {
      const q = query(
        collection(db, "storyPlays"),
        where("userId", "==", userId),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const stories = [];

      querySnapshot.forEach((doc) => {
        stories.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setPlayedStories(stories);
    } catch (error) {
      console.error("Error fetching played stories:", error);
      Alert.alert("Error", "Failed to load your adventures");
    } finally {
      setLoadingStories(false);
    }
  };

  // Fetch submitted scenarios from Firebase
  const fetchSubmittedScenarios = async (userId) => {
    if (activeTab !== 'scenarios') return;
    
    setLoadingScenarios(true);
    try {
      const q = query(
        collection(db, "scenarioSubmissions"),
        where('submittedBy', '==', userId),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const scenarios = [];

      querySnapshot.forEach((doc) => {
        scenarios.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setSubmittedScenarios(scenarios);
    } catch (error) {
      console.error("Error fetching submitted scenarios:", error);
      Alert.alert("Error", "Failed to load your scenarios");
    } finally {
      setLoadingScenarios(false);
    }
  };

  // Fetch bookmarked stories from Firebase
  const fetchBookmarkedStories = async (userId) => {
    if (activeTab !== 'bookmarks') return;
    
    setLoadingBookmarks(true);
    try {
      const q = query(
        collection(db, "bookmarks"),
        where("userId", "==", userId),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const bookmarks = [];

      querySnapshot.forEach((doc) => {
        bookmarks.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setBookmarkedStories(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarked stories:", error);
      Alert.alert("Error", "Failed to load your bookmarks");
    } finally {
      setLoadingBookmarks(false);
    }
  };

  // Refetch data when tab changes
  useEffect(() => {
    if (user) {
      if (activeTab === 'adventures') {
        fetchPlayedStories(user.uid);
      } else if (activeTab === 'scenarios') {
        fetchSubmittedScenarios(user.uid);
      } else if (activeTab === 'bookmarks') {
        fetchBookmarkedStories(user.uid);
      }
    }
  }, [activeTab, user]);

  const handleEditProfile = () => {
    setShowEditModal(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowEditModal(false);
    });
  };

  const generateAvatarUrl = (seed) => {
    return `https://api.dicebear.com/9.x/adventurer/jpg?seed=${seed}`;
  };

  const handleUpdateProfile = async () => {
    if (!editedUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    setUpdating(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Update Firebase Auth profile
        await updateProfile(currentUser, {
          displayName: editedUsername,
        });
        
        // Update Firestore user document
        await updateDoc(doc(db, "users", currentUser.uid), {
          username: editedUsername,
          avatar: selectedAvatar,
        });
        
        // Update local state
        setUserProfile({
          ...userProfile,
          username: editedUsername,
          avatar: selectedAvatar,
        });
        
        Alert.alert("Success", "Profile updated successfully!");
        handleCloseModal();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const auth = getAuth();
              const currentUser = auth.currentUser;
              
              if (currentUser) {
                await deleteUser(currentUser);
                Alert.alert("Account Deleted", "Your account has been deleted successfully.");
              }
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert("Error", "Failed to delete account. You may need to re-authenticate and try again.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else {
      // Regular date
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Avatar Selection Component
  const AvatarSelector = () => (
    <View style={styles.avatarSelectorContainer}>
      <Text style={styles.avatarSelectorTitle}>Choose Avatar</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.avatarScrollView}
      >
        {AVATAR_OPTIONS.map((avatar) => {
          const avatarUrl = generateAvatarUrl(avatar.seed);
          const isSelected = selectedAvatar === avatarUrl;
          
          return (
            <TouchableOpacity
              key={avatar.id}
              onPress={() => setSelectedAvatar(avatarUrl)}
              style={[
                styles.avatarOption,
                isSelected && styles.avatarOptionSelected
              ]}
            >
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarOptionImage}
              />
              {isSelected && (
                <View style={styles.avatarSelectedOverlay}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const StoryCard = ({ story, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.storyCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.storyCardContent}
          activeOpacity={0.8}
          onPress={() => {
            // Navigate back to story details if needed
            const storyData = {
              id: story.storyId || story.id,
              title: story.title,
              description: story.description,
              image: story.image,
              genre: story.genre,
              difficulty: story.difficulty,
              likes: story.likes,
              plays: story.plays,
            };
            navigation.navigate('StoryDetails', { story: storyData });
          }}
        >
           <View style={styles.storyImageContainer}>
            <Image 
              source={story.image} 
              style={styles.storyImage}
              defaultSource={{ uri: 'https://via.placeholder.com/80x110/374151/9CA3AF?text=Story' }}
            />
          </View>
          {/* Story Info */}
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle} numberOfLines={2}>
              {story.title}
            </Text>
            
            <Text style={styles.storyDescription} numberOfLines={3}>
              {story.description}
            </Text>
            
            {/* Story Stats */}
            <View style={styles.storyStats}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>
                    {formatDate(story.playedAt)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="pricetag-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>{story.genre}</Text>
                </View>
                
                {story.difficulty && (
                  <View style={styles.statItem}>
                    <Ionicons name="speedometer-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.statText}>{story.difficulty}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const ScenarioCard = ({ scenario, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const statusColor = getStatusColor(scenario.status);
    const statusIcon = getStatusIcon(scenario.status);

    return (
      <Animated.View
        style={[
          styles.scenarioCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.scenarioCardContent}>
          {/* Scenario Header with Status */}
          <View style={styles.scenarioHeader}>
            <Text style={styles.scenarioTitle} numberOfLines={2}>
              {scenario.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Ionicons name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {scenario.status?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.scenarioDescription} numberOfLines={3}>
            {scenario.description}
          </Text>
          
          {/* Scenario Stats */}
          <View style={styles.scenarioStats}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                <Text style={styles.statText}>
                  {formatDate(scenario.submittedAt)}
                </Text>
              </View>
            </View>

            {/* Show review comments if rejected */}
            {scenario.status === 'rejected' && scenario.reviewComments && (
              <View style={styles.reviewCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={12} color="#EF4444" />
                <Text style={styles.reviewCommentsText} numberOfLines={2}>
                  {scenario.reviewComments}
                </Text>
              </View>
            )}

            {/* Show reviewed date if approved/rejected */}
            {(scenario.status === 'approved' || scenario.status === 'rejected') && scenario.reviewedAt && (
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-done-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>
                    Reviewed {formatDate(scenario.reviewedAt)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const BookmarkCard = ({ bookmark, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.storyCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.bookmarkCardContent}
          activeOpacity={0.8}
          onPress={() => {
            // Navigate to story details with the bookmark data
            const storyData = {
              id: bookmark.storyId,
              title: bookmark.title,
              description: bookmark.description,
              image: bookmark.image,
              genre: bookmark.genre,
              difficulty: bookmark.difficulty,
              likes: bookmark.likes,
              plays: bookmark.plays,
            };
            navigation.navigate('StoryDetails', { story: storyData });
          }}
        >
          {/* Story Image */}
          <View style={styles.storyImageContainer}>
            <Image 
              source={bookmark.image} 
              style={styles.storyImage}
              defaultSource={{ uri: 'https://via.placeholder.com/80x110/374151/9CA3AF?text=Story' }}
            />
            <View style={styles.playOverlay}>
              <Ionicons name="bookmark" size={12} color="#FFBF00" />
            </View>
          </View>

          {/* Story Info */}
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle} numberOfLines={2}>
              {bookmark.title}
            </Text>
            
            <Text style={styles.storyDescription} numberOfLines={3}>
              {bookmark.description}
            </Text>
            
            {/* Story Stats */}
            <View style={styles.storyStats}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>
                    Bookmarked {formatDate(bookmark.bookmarkedAt)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="pricetag-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>{bookmark.genre}</Text>
                </View>
                
                {bookmark.difficulty && (
                  <View style={styles.statItem}>
                    <Ionicons name="speedometer-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.statText}>{bookmark.difficulty}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = ({ tab }) => (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
      <Ionicons 
        name={tab === 'scenarios' ? 'create-outline' : tab === 'adventures' ? 'book-outline' : 'bookmark-outline'} 
        size={64} 
        color="#4B5563" 
      />
      <Text style={styles.emptyTitle}>
        {tab === 'scenarios' ? "No scenarios created" : 
         tab === 'adventures' ? "No adventures played yet" : 
         "No bookmarks saved"}
      </Text>
      <Text style={styles.emptyDescription}>
        {tab === 'scenarios' ? "Start creating your own scenarios" : 
         tab === 'adventures' ? "Start playing stories to see your adventures here" : 
         "Bookmark your favorite stories to see them here"}
      </Text>
    </Animated.View>
  );

  const AdventuresContent = () => {
    if (loadingStories) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFBF00" />
          <Text style={styles.loadingText}>Loading your adventures...</Text>
        </View>
      );
    }

    if (playedStories.length === 0) {
      return <EmptyState tab="adventures" />;
    }

    return (
      <FlatList
        data={playedStories}
        renderItem={({ item, index }) => <StoryCard story={item} index={index} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        scrollEnabled={false} // Let parent ScrollView handle scrolling
      />
    );
  };

  const ScenariosContent = () => {
    if (loadingScenarios) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFBF00" />
          <Text style={styles.loadingText}>Loading your scenarios...</Text>
        </View>
      );
    }

    if (submittedScenarios.length === 0) {
      return <EmptyState tab="scenarios" />;
    }

    return (
      <FlatList
        data={submittedScenarios}
        renderItem={({ item, index }) => <ScenarioCard scenario={item} index={index} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        scrollEnabled={false} // Let parent ScrollView handle scrolling
      />
    );
  };

  const BookmarksContent = () => {
    if (loadingBookmarks) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFBF00" />
          <Text style={styles.loadingText}>Loading your bookmarks...</Text>
        </View>
      );
    }

    if (bookmarkedStories.length === 0) {
      return <EmptyState tab="bookmarks" />;
    }

    return (
      <FlatList
        data={bookmarkedStories}
        renderItem={({ item, index }) => <BookmarkCard bookmark={item} index={index} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        scrollEnabled={false} // Let parent ScrollView handle scrolling
      />
    );
  };

  if (loading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FFBF00" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </View>
    );
  }

 if (!user || user.isAnonymous) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
        <Text style={styles.errorTitle}>
          {user?.isAnonymous ? "Guest User" : "Not Signed In"}
        </Text>
        <Text style={styles.errorSubtext}>
          {user?.isAnonymous
            ? "You're currently browsing as a guest.\nSign in to unlock full features!"
            : "Please sign in to view your profile."}
        </Text>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleLogoutGuest} 
        >
          <Text style={styles.signInButtonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        >
          {/* Profile Section */}
          <Animated.View
            style={[
              styles.profileSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={{
                uri: userProfile.avatar || `https://api.dicebear.com/9.x/adventurer/jpg?seed=${user.uid}`
              }}
              style={styles.profileImage}
            />
            <Animated.View
              style={[
                styles.userInfo,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.username}>{userProfile.username || 'Unknown User'}</Text>
              <Text style={styles.email}>{userProfile.email}</Text>
            </Animated.View>
          </Animated.View>

          {/* Edit Profile Button */}
          <Animated.View
            style={[
              styles.editButtonContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.editProfileBtn}
              activeOpacity={0.8}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={18} color="#9CA3AF" />
              <Text style={styles.editProfileText}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* SignOut Button */}
          <Animated.View
            style={[
              styles.editlogoutContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.logoutProfileBtn}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert("SignOut", "Are you sure you want to signout?", [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "SignOut",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const auth = getAuth();
                        await auth.signOut();
                      } catch (error) {
                        console.error("Logout error:", error);
                      }
                    },
                  },
                ])
              }
            >
              <Ionicons name="log-out-outline" size={18} color="#9CA3AF" />
              <Text style={styles.editProfileText}>SIGNOUT</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Tabs Section */}
          <Animated.View style={[styles.tabsContainer, { opacity: fadeAnim }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {TABS.map((tab, index) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && styles.tabButtonActive,
                    index === TABS.length - 1 && styles.lastTabButton,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={activeTab === tab.id ? "#FFBF00" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.id
                        ? styles.tabTextActive
                        : styles.tabTextInactive,
                    ]}
                  >
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Content Section */}
          <Animated.View style={[styles.contentSection, { opacity: fadeAnim }]}>
            {activeTab === 'adventures' ? (
              <AdventuresContent />
            ) : activeTab === 'scenarios' ? (
              <ScenariosContent />
            ) : activeTab === 'bookmarks' ? (
              <BookmarksContent />
            ) : (
              <EmptyState tab={activeTab} />
            )}
          </Animated.View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="none"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: modalAnim,
                  transform: [
                    {
                      scale: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Profile Image Preview */}
              <View style={styles.modalImageContainer}>
                <Image
                  source={{
                    uri: selectedAvatar || `https://api.dicebear.com/9.x/adventurer/jpg?seed=${user.uid}`
                  }}
                  style={styles.modalProfileImage}
                />
              </View>

              {/* Avatar Selector */}
              <AvatarSelector />

              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedUsername}
                  onChangeText={setEditedUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateProfile}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
   signInButton: {
    backgroundColor: "#FFBF00",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 15,
  },
  signInButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  errorSubtext: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    // This ensures proper spacing for the scroll content
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30, 
    paddingBottom: 10,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#374151',
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  email:{
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  editButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  editlogoutContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  logoutProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AA4A44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  editProfileText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    paddingVertical: 16,
    backgroundColor: '#1F2937',
  },
  tabsScrollContent: {
    paddingHorizontal: 24,
    paddingRight: 48, // Extra padding to ensure last tab is visible
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
  },
  lastTabButton: {
    marginRight: 0, // Remove margin from last tab
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#FFBF00',
  },
  tabTextInactive: {
    color: '#6B7280',
  },
  contentSection: {
    flex: 1,
    minHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Story Cards Styles
  storiesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  storyCard: {
    marginTop: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  storyCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  bookmarkCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  storyImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  storyImage: {
    width: 80,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  playOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  storyDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 12,
  },
  storyStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  
  // Scenario Cards Styles
  scenarioCard: {
    marginTop: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  scenarioCardContent: {
    padding: 16,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scenarioTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 12,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scenarioDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 16,
  },
  scenarioStats: {
    gap: 12,
  },
  reviewCommentsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 8,
    marginTop: 8,
  },
  reviewCommentsText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  
  // Avatar Selector Styles
  avatarSelectorContainer: {
    marginBottom: 20,
  },
  avatarSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  avatarScrollView: {
    marginBottom: 8,
  },
  avatarOption: {
    marginRight: 12,
    position: 'relative',
  },
  avatarOptionSelected: {
    transform: [{ scale: 1.1 }],
  },
  avatarOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#374151',
  },
  avatarSelectedOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFBF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#374151',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  modalActions: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFBF00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});