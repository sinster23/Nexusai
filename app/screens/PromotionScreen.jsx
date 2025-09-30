import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Linking,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RAZORPAY_PAYMENT_LINK } from "@env";
import { useNavigation } from '@react-navigation/native';

const SelfPromotionScreen = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  
  // Get safe area insets for proper spacing
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  
  const navigation = useNavigation();

  useEffect(() => {
    // Start animations
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

    // Start pulse animation for donation button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handleLinkedInPress = async () => {
    try {
      const linkedInUrl = 'https://www.linkedin.com/in/upayan-dutta-564977320/'; // Replace with your actual LinkedIn URL
      const canOpen = await Linking.canOpenURL(linkedInUrl);
      
      if (canOpen) {
        await Linking.openURL(linkedInUrl);
      } else {
        Alert.alert('Error', 'Unable to open LinkedIn profile');
      }
    } catch (error) {
      console.error('Error opening LinkedIn:', error);
      Alert.alert('Error', 'Failed to open LinkedIn profile');
    }
  };

  const handleGitHubPress = async () => {
    try {
      const githubUrl = 'https://github.com/sinster23/Nexusai'; // Replace with your actual GitHub URL
      const canOpen = await Linking.canOpenURL(githubUrl);
      
      if (canOpen) {
        await Linking.openURL(githubUrl);
      } else {
        Alert.alert('Error', 'Unable to open GitHub profile');
      }
    } catch (error) {
      console.error('Error opening GitHub:', error);
      Alert.alert('Error', 'Failed to open GitHub profile');
    }
  };

  const handleDonatePress = () => {
    setShowDonationModal(true);
    // Animate modal appearance
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDonationModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDonationModal(false);
    });
  };

  const processRazorpayPayment = async () => {
    setIsProcessing(true);

    try {
      const canOpen = await Linking.canOpenURL(RAZORPAY_PAYMENT_LINK);
      
      if (canOpen) {
        await Linking.openURL(RAZORPAY_PAYMENT_LINK);
      } else {
        Alert.alert('Error', 'Unable to open the payment page');
      }
    } catch (error) {
      console.log('Payment Error:', error);
      Alert.alert(
        'Payment Failed',
        'Unable to open the payment page. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      closeDonationModal();
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
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
            <Text style={styles.headerTitle}>About the <Text style={{ color: '#FFBF00', fontStyle: 'italic', fontWeight: 'normal' }}>Developer</Text></Text>
            <Text style={styles.headerSubtitle}>Connect with me and support the app</Text>
          </Animated.View>

          {/* Developer Info Card */}
          <Animated.View 
            style={[
              styles.infoCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.developerInfo}>
              <View style={styles.avatarContainer}>
                <Image source={require('../assets/avatar.jpg')} style={{width: 60, height: 60, borderRadius: 30}} />
              </View>
              <View style={styles.developerDetails}>
                <Text style={styles.developerName}>Upayan Dutta</Text>
                <Text style={styles.developerTitle}>Developer</Text>
                <Text style={styles.developerDescription}>
                  I built this app just for fun. Hope you find it entertaining and useful!
                  This app is completely free and open-source on my github.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Social Links */}
          <Animated.View 
            style={[
              styles.socialSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>
              <Ionicons name="link-outline" size={18} color="#FFBF00" />
              {' '}Connect with Me
            </Text>

            {/* LinkedIn Card */}
            <TouchableOpacity 
              style={styles.socialCard}
              onPress={handleLinkedInPress}
              activeOpacity={0.8}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
              </View>
              <View style={styles.socialContent}>
                <Text style={styles.socialTitle}>LinkedIn Profile</Text>
                <Text style={styles.socialDescription}>
                  View my professional experience and connect with me
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* GitHub Card */}
            <TouchableOpacity 
              style={styles.socialCard}
              onPress={handleGitHubPress}
              activeOpacity={0.8}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-github" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.socialContent}>
                <Text style={styles.socialTitle}>GitHub Repository</Text>
                <Text style={styles.socialDescription}>
                  Check out the full source code for NexusAi
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </Animated.View>

          {/* Support Section */}
          <Animated.View 
            style={[
              styles.supportSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>
              <Ionicons name="heart-outline" size={18} color="#FFBF00" />
              {' '}Support Development
            </Text>

            <View style={styles.supportCard}>
              <View style={styles.supportHeader}>
                <Ionicons name="cafe-outline" size={28} color="#FFBF00" />
                <View style={styles.supportHeaderText}>
                  <Text style={styles.supportTitle}>Buy Me a Coffee</Text>
                  <Text style={styles.supportSubtitle}>Help keep this app free and ad-free</Text>
                </View>
              </View>

              <Text style={styles.supportDescription}>
                Your support helps me maintain and improve this app. Every donation, 
                no matter how small, is greatly appreciated and motivates me to keep 
                adding new features!
              </Text>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.benefitText}>Keeps the app completely free</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.benefitText}>No ads or premium subscriptions</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.benefitText}>Funds new feature development</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.benefitText}>Supports server and maintenance costs</Text>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity 
                  style={styles.donateButton}
                  onPress={handleDonatePress}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <Ionicons name="gift-outline" size={20} color="#000000" />
                  <Text style={styles.donateButtonText}>
                    {isProcessing ? 'Processing...' : 'Make a Donation'}
                  </Text>
                  <View style={styles.heartContainer}>
                    <Ionicons name="heart" size={16} color="#EF4444" />
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.donationNote}>
                💝 Donate any amount you wish • Secure payment via Razorpay
              </Text>
            </View>
          </Animated.View>

          {/* Thank You Message */}
          <Animated.View 
            style={[
              styles.thankYouCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.thankYouTitle}>Thank You!</Text>
            <Text style={styles.thankYouText}>
              Whether you connect, donate, or simply use the app - thank you for 
              being part of this journey. Your support and feedback make this 
              project possible! 
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Donation Modal */}
        <Modal
          visible={showDonationModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeDonationModal}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.donationModalContent,
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
              <View style={styles.donationModalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="gift" size={24} color="#FFBF00" />
                  <Text style={styles.donationModalTitle}>Support Development</Text>
                </View>
                <TouchableOpacity
                  onPress={closeDonationModal}
                  style={styles.modalCloseButton}
                  disabled={isProcessing}
                >
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <View style={styles.donationModalBody}>
                {/* Donation Icon */}
                <View style={styles.donationIconContainer}>
                  <Ionicons name="heart" size={48} color="#EF4444" />
                </View>

                <Text style={styles.donationModalDescription}>
                  Your support means the world to me! You'll be redirected to Razorpay where you can donate any amount you're comfortable with.
                </Text>

                {/* Features supported by donations */}
                <View style={styles.supportFeatures}>
                  <Text style={styles.supportFeaturesTitle}>Your donation helps with:</Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="server-outline" size={16} color="#FFBF00" />
                      <Text style={styles.featureText}>Server maintenance</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="code-slash-outline" size={16} color="#FFBF00" />
                      <Text style={styles.featureText}>New feature development</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#FFBF00" />
                      <Text style={styles.featureText}>Keeping the app ad-free</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="cafe-outline" size={16} color="#FFBF00" />
                      <Text style={styles.featureText}>Coffee to fuel coding sessions</Text>
                    </View>
                  </View>
                </View>

                {/* Payment Security Info */}
                <View style={styles.securityInfo}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                  <Text style={styles.securityText}>
                    Secure payment powered by Razorpay
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.donationModalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeDonationModal}
                    disabled={isProcessing}
                  >
                    <Text style={styles.cancelButtonText}>Maybe Later</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.proceedButton,
                      isProcessing && styles.proceedButtonDisabled
                    ]}
                    onPress={processRazorpayPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <Ionicons name="card" size={18} color="#000000" />
                        <Text style={styles.proceedButtonText}>
                          Donate Now
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalFooterNote}>
                  You can enter any amount on the next page
                </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
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
  infoCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 191, 0, 0.3)',
  },
  developerDetails: {
    flex: 1,
  },
  developerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  developerTitle: {
    fontSize: 14,
    color: '#FFBF00',
    marginBottom: 8,
    fontWeight: '500',
  },
  developerDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  socialSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  socialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  socialContent: {
    flex: 1,
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  socialDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  supportSection: {
    marginBottom: 24,
  },
  supportCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  supportDescription: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 24,
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 10,
    flex: 1,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFBF00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    position: 'relative',
  },
  donateButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  heartContainer: {
    position: 'absolute',
    right: 16,
  },
  donationNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  thankYouCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 12,
  },
  thankYouText: {
    fontSize: 15,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Donation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  donationModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  donationModalHeader: {
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
  donationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalCloseButton: {
    padding: 4,
  },
  donationModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  donationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  donationModalDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  supportFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  supportFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 8,
    flex: 1,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '500',
  },
  donationModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '500',
  },
  proceedButton: {
    flex: 2,
    backgroundColor: '#FFBF00',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  proceedButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  proceedButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooterNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SelfPromotionScreen;