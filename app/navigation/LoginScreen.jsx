import React, { useState, useEffect, useRef } from 'react';
import { styles } from '../styles/Login';
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { db, auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { BACKEND_URL } from "@env";

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const titleAnim = useRef(new Animated.Value(-100)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Initial entrance animation sequence
    const entranceSequence = Animated.sequence([
      // Title slides down
      Animated.timing(titleAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Glass container fades and slides up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]),
    ]);
    entranceSequence.start();

    // Continuous pulse animation for the button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  useEffect(() => {
    if (showOtpModal) {
      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalFadeAnim.setValue(0);
      modalScaleAnim.setValue(0.8);
    }
  }, [showOtpModal]);

  const signInAsGuest = async () => {
    setIsLoadingGuest(true);
    try {
      const result = await signInAnonymously(auth);
      console.log("Signed in anonymously:", result.user.uid);
      return result.user;
    } catch (err) {
      console.error("Anonymous sign-in failed:", err);
      setErrorMsg('Failed to sign in as guest');
      throw err;
    } finally {
      setIsLoadingGuest(false);
    }
  };

  const sendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    setIsSendingOtp(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSuccess('OTP sent successfully! Check your email.');
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtpAndCreateAccount = async () => {
    setOtpError('');
    setIsVerifyingOtp(true);

    try {
      // First verify OTP with backend
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: parseInt(otp) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // OTP verified, now create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const avatarUrl = `https://api.dicebear.com/9.x/adventurer/jpg?seed=${user.uid}`;

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: user.email.split("@")[0],
        avatar: avatarUrl,
        createdAt: new Date(),
      });

      // Close modal on success
      setShowOtpModal(false);
      setOtp('');
      setOtpSuccess('');
    } catch (error) {
      setOtpError(error.message || 'Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAuth = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (isLogin) {
      // Login flow
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        setErrorMsg(error.message || 'Authentication error. Try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Signup flow - validate and show OTP modal
      if (password !== confirmPassword) {
        setErrorMsg('Please make sure your passwords match.');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }

      // Open OTP modal and send OTP
      setShowOtpModal(true);
      await sendOtp();
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp('');
    setOtpError('');
    setOtpSuccess('');
  };

  const handleToggle = (loginState) => {
    setErrorMsg('');
    const slideDirection = loginState === isLogin ? 0 : (loginState ? -50 : 50);
    Animated.sequence([
      Animated.timing(formSlideAnim, {
        toValue: slideDirection,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => setIsLogin(loginState), 200);
  };

  const handleInputFocus = () => {
    setErrorMsg('');
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const inputScale = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {/* Background Image */}
      <ImageBackground
        source={require("../assets/bg.jpg")}
        style={styles.backgroundImage}
        blurRadius={0.5}
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />
        <View style={styles.contentContainer}>
          {/* App Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{ translateY: titleAnim }],
              },
            ]}
          >
            <Text style={styles.title}>
              Nexus
              <Text style={{ color: "#FFF" }}>AI</Text>
            </Text>
            <Text style={styles.subtitle}>Beyond Reality, Powered by AI</Text>
          </Animated.View>

          {/* Glass Login Form */}
          <Animated.View
            style={[
              styles.glassContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Animated.View
              style={{ transform: [{ translateX: formSlideAnim }] }}
            >
              <View style={styles.formHeader}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.activeToggle]}
                  onPress={() => handleToggle(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isLogin && styles.activeToggleText,
                    ]}
                  >
                    LOGIN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                  onPress={() => handleToggle(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !isLogin && styles.activeToggleText,
                    ]}
                  >
                    SIGN UP
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Animated.View style={{ transform: [{ scale: inputScale }] }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: inputScale }] }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </Animated.View>

                {!isLogin && (
                  <Animated.View
                    style={{
                      transform: [{ scale: inputScale }],
                      opacity: fadeAnim,
                    }}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </Animated.View>
                )}
              </View>
              {/* Error Message */}
              {errorMsg !== "" && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={styles.errorMsgBox}>
                    <MaterialIcons
                      name="error-outline"
                      size={22}
                      color="#fff"
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorMsgText}>{errorMsg}</Text>
                  </View>
                </Animated.View>
              )}

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={handleAuth}
                  activeOpacity={0.9}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.loginButtonText}>
                        Warping through ...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.authButtonText}>
                      {isLogin ? "ENTER REALM" : "JOIN ADVENTURE"}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
              {isLogin && (
                <Animated.View style={{ opacity: fadeAnim }}>
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>

          {/* Guest Play Option */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            }}
          >
            <TouchableOpacity onPress={signInAsGuest} style={styles.guestButton} activeOpacity={0.8}>
              {isLoadingGuest ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.guestButtonText}>
                    Coming in ...
                  </Text>
                </View>
              ) : (
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeOtpModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalFadeAnim,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Email</Text>
              <TouchableOpacity onPress={closeOtpModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the 6-digit code sent to {email}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="Enter OTP"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            {/* {otpSuccess !== "" && (
              <View style={styles.successMsgBox}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.successMsgText}>{otpSuccess}</Text>
              </View>
            )} */}

            {/* {otpError !== "" && (
              <View style={styles.errorMsgBox}>
                <MaterialIcons name="error-outline" size={20} color="#fff" />
                <Text style={styles.errorMsgText}>{otpError}</Text>
              </View>
            )} */}

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={verifyOtpAndCreateAccount}
              disabled={isVerifyingOtp || otp.length !== 6}
              activeOpacity={0.8}
            >
              {isVerifyingOtp ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.buttonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>VERIFY OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={sendOtp}
              disabled={isSendingOtp}
              activeOpacity={0.7}
            >
              {isSendingOtp ? (
                <ActivityIndicator size="small" color="#6C63FF" />
              ) : (
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default LoginScreen;