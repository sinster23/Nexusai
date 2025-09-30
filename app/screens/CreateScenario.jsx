import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FORMSPREE_URL } from "@env";
// Add Firebase imports
import { db, auth } from '../firebase'; // Import your Firebase config
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, deleteUser, signOut } from 'firebase/auth';

const CreateScenarioScreen = () => {
    const [storyTitle, setStoryTitle] = useState('');
    const [storyDescription, setStoryDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(true);
    
    // Authentication state
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    // Get safe area insets for proper spacing
    const insets = useSafeAreaInsets();
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const modalAnim = useRef(new Animated.Value(0)).current;
    
    const navigation = useNavigation();

    // Authentication check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [navigation]);

    useEffect(() => {
        // Only start animations if user is authenticated
        if (!authLoading && user) {
            // Start modal animation on component mount
            if (showGuidelines) {
                Animated.timing(modalAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            }

            // Start main animations after a delay
            const timer = setTimeout(() => {
                Animated.stagger(150, [
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
                ]).start();
            }, showGuidelines ? 0 : 100);

            return () => clearTimeout(timer);
        }
    }, [showGuidelines, authLoading, user]);

    // Firebase helper function to save scenario submission
    const saveScenarioToFirebase = async (scenarioData) => {
        try {
            const docRef = await addDoc(collection(db, 'scenarioSubmissions'), {
                title: scenarioData.title,
                description: scenarioData.description,
                status: 'pending', // pending, approved, rejected
                submittedAt: serverTimestamp(),
                submittedBy: user.uid, // Use authenticated user's ID
                submitterEmail: user.email,
                submitterName: user.displayName || 'Anonymous',
                reviewedAt: null,
                reviewedBy: null,
                reviewComments: null,
                wordCount: scenarioData.description.split(' ').length,
                charCount: scenarioData.description.length,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            console.log('Scenario submission saved to Firebase with ID: ', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving scenario to Firebase: ', error);
            throw error;
        }
    };

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

    const handleSubmit = async () => {
        // Double check authentication before submitting
        if (!user) {
            Alert.alert('Authentication Required', 'Please log in to submit scenarios.');
            return;
        }

        // Validation
        if (!storyTitle.trim() || !storyDescription.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (storyTitle.length < 5) {
            Alert.alert('Error', 'Story title must be at least 5 characters long.');
            return;
        }

        if (storyDescription.length < 20) {
            Alert.alert('Error', 'Story description must be at least 20 characters long.');
            return;
        }

        setIsSubmitting(true);
       
        try {
            // Prepare scenario data
            const scenarioData = {
                title: storyTitle.trim(),
                description: storyDescription.trim(),
            };

            // Save to Firebase first
            const firebaseDocId = await saveScenarioToFirebase(scenarioData);
            
            // Then submit to Formspree for backup/notification
            const response = await fetch(FORMSPREE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...scenarioData,
                    firebaseId: firebaseDocId,
                    submissionTime: new Date().toISOString(),
                    userId: user.uid,
                    userEmail: user.email,
                    userName: user.displayName || 'Anonymous',
                }),
            });

            if (response.ok) {
                Alert.alert(
                    'Success!', 
                    'Your scenario has been submitted successfully and is now under review. You will be notified once it\'s approved!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Clear form
                                setStoryTitle('');
                                setStoryDescription('');
                                // Optionally navigate back
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                // Firebase save was successful but Formspree failed
                // This is okay, we still have the data in Firebase
                console.warn('Formspree submission failed, but Firebase save was successful');
                Alert.alert(
                    'Submitted!', 
                    'Your scenario has been submitted and is under review!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setStoryTitle('');
                                setStoryDescription('');
                                navigation.goBack();
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error during submission:', error);
            Alert.alert(
                'Error', 
                'Failed to submit scenario. Please check your internet connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseGuidelines = () => {
        Animated.timing(modalAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowGuidelines(false);
        });
    };

    // Show loading screen while checking authentication
    if (authLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <StatusBar barStyle="light-content" backgroundColor="#111827" />
                <ActivityIndicator size="large" color="#FFBF00" />
                <Text style={styles.loadingText}>Checking authentication...</Text>
            </View>
        );
    }

    // Don't render the main content if user is not authenticated
    if (!user || user.isAnonymous) {
        return (
            <View style={[styles.container, styles.authRequiredContainer]}>
                <StatusBar barStyle="light-content" backgroundColor="#111827" />
                <View style={styles.authRequiredContent}>
                    <Ionicons name="lock-closed-outline" size={64} color="#FFBF00" />
                    <Text style={styles.authRequiredTitle}>Authentication Required</Text>
                    <Text style={styles.authRequiredMessage}>
                        You need to be logged in to create and submit scenarios.
                    </Text>
                    <View style={styles.authButtonsContainer}>
                        <TouchableOpacity 
                            style={styles.signupButton}
                            onPress={handleLogoutGuest} // Adjust route name as needed
                            activeOpacity={0.8}
                        >
                            <Text style={styles.signupButtonText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        style={styles.goBackButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back-outline" size={18} color="#9CA3AF" />
                        <Text style={styles.goBackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <Animated.View 
                            style={[
                                styles.header,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="create-outline" size={32} color="#FFBF00" />
                            </View>
                            <Text style={styles.headerTitle}>Create Scenario</Text>
                            <Text style={styles.headerSubtitle}>
                                Welcome, {user.displayName || user.email}! Share your story with the community
                            </Text>
                        </Animated.View>

                        {/* Form */}
                        <Animated.View 
                            style={[
                                styles.formContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Story Title Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    <Ionicons name="text-outline" size={16} color="#FFBF00" />
                                    {' '}Story Title *
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={storyTitle}
                                    onChangeText={setStoryTitle}
                                    placeholder="Enter an engaging title for your story"
                                    placeholderTextColor="#6B7280"
                                    maxLength={100}
                                    returnKeyType="next"
                                />
                                <Text style={[
                                    styles.charCounter,
                                    storyTitle.length > 90 && styles.charCounterWarning
                                ]}>
                                    {storyTitle.length}/100 characters
                                </Text>
                            </View>

                            {/* Story Description Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>
                                    <Ionicons name="document-text-outline" size={16} color="#FFBF00" />
                                    {' '}Story Description *
                                </Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={storyDescription}
                                    onChangeText={setStoryDescription}
                                    placeholder="Describe your story scenario in detail. Include setting, characters, and the initial situation..."
                                    placeholderTextColor="#6B7280"
                                    maxLength={1000}
                                    multiline
                                    textAlignVertical="top"
                                    returnKeyType="default"
                                />
                                <Text style={[
                                    styles.charCounter,
                                    storyDescription.length > 900 && styles.charCounterWarning
                                ]}>
                                    {storyDescription.length}/1000 characters
                                </Text>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity 
                                style={[
                                    styles.submitButton, 
                                    isSubmitting && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                activeOpacity={0.8}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#000000" />
                                        <Text style={styles.submitButtonText}>Submit for Review</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Guidelines Modal */}
                <Modal
                    visible={showGuidelines}
                    transparent={true}
                    animationType="none"
                    onRequestClose={handleCloseGuidelines}
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
                                <View style={styles.modalHeaderLeft}>
                                    <Ionicons name="information-circle" size={24} color="#FFBF00" />
                                    <Text style={styles.modalTitle}>Submission Guidelines</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {/* Guidelines Content */}
                            <ScrollView 
                                style={styles.modalScrollView}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.modalDescription}>
                                    Please read these guidelines carefully before submitting your scenario:
                                </Text>

                                <View style={styles.modalGuidelinesList}>
                                    <View style={styles.modalGuidelineItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.modalGuidelineText}>Keep content appropriate for all audiences</Text>
                                    </View>
                                    <View style={styles.modalGuidelineItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.modalGuidelineText}>Ensure your story is original and not plagiarized</Text>
                                    </View>
                                    <View style={styles.modalGuidelineItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.modalGuidelineText}>Reviews typically take 24-48 hours</Text>
                                    </View>
                                    <View style={styles.modalGuidelineItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.modalGuidelineText}>Be descriptive and engaging in your scenario</Text>
                                    </View>
                                    <View style={styles.modalGuidelineItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.modalGuidelineText}>Avoid excessive violence or mature themes</Text>
                                    </View>
                                    <View style={styles.modalGuidelineItem}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.modalGuidelineText}>Include clear setting and character descriptions</Text>
                                    </View>
                                </View>

                                {/* Important Note */}
                                <View style={styles.importantNote}>
                                    <Ionicons name="warning" size={20} color="#F59E0B" />
                                    <Text style={styles.importantNoteText}>
                                        Scenarios that don't follow these guidelines may be rejected or require revisions.
                                    </Text>
                                </View>
                            </ScrollView>

                            {/* Modal Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.understoodButton}
                                    onPress={handleCloseGuidelines}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="alert-circle-outline" size={18} color="#000000" />
                                    <Text style={styles.understoodButtonText}>I have read and understood</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </Modal>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  // Loading styles
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  // Auth required styles
  authRequiredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  authRequiredContent: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
    maxWidth: 400,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  authRequiredMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  authButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#FFBF00',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFBF00',
  },
  signupButtonText: {
    color: '#FFBF00',
    fontSize: 16,
    fontWeight: '600',
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  goBackButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 6,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingTop: 20,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCounter: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 6,
  },
  charCounterWarning: {
    color: '#F59E0B',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFBF00',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  guidelines: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  guidelinesList: {
    gap: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
  },
  guidelineText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalGuidelinesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modalGuidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modalGuidelineText: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  importantNoteText: {
    fontSize: 14,
    color: '#F59E0B',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  understoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFBF00',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  understoodButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
});

export default CreateScenarioScreen;