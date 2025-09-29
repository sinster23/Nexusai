import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { styles } from "../styles/Home";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageBackground,
  StatusBar,
  Image,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  aiDungeonOriginals,
  firstAdventures,
  romance,
  worlds,
  legends,
  horror,
} from "../data/stories";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// AsyncStorage helper functions
const getRecentlyPlayed = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem("recentlyPlayed");
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error reading recently played:", e);
    return [];
  }
};

const saveRecentlyPlayed = async (storyData) => {
  try {
    const existingData = await getRecentlyPlayed();
    // Remove if already exists to avoid duplicates
    const filteredData = existingData.filter(
      (item) => item.title !== storyData.title
    );
    // Add to beginning of array
    const newData = [storyData, ...filteredData].slice(0, 10); // Keep only last 10
    const jsonValue = JSON.stringify(newData);
    await AsyncStorage.setItem("recentlyPlayed", jsonValue);
  } catch (e) {
    console.error("Error saving recently played:", e);
  }
};

const HomeScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recentlyPlayedStories, setRecentlyPlayedStories] = useState([]);
  const scrollViewRef = useRef(null);
  const navigation = useNavigation();

  // Load recently played stories on component mount and when screen focuses
  useEffect(() => {
    const loadRecentlyPlayed = async () => {
      const stories = await getRecentlyPlayed();
      setRecentlyPlayedStories(stories);
    };

    loadRecentlyPlayed();

    // Listen for screen focus to refresh recently played
    const unsubscribe = navigation.addListener("focus", () => {
      loadRecentlyPlayed();
    });

    return unsubscribe;
  }, [navigation]);

  // Memoize slides data to prevent recreation on every render
  const slides = useMemo(
    () => [
      {
        id: 1,
        image: require("../assets/story_assets/disp1.gif"),
        title: "Start your\nfirst adventure.",
        subtitle: "You're seconds away from infinite possibilities.",
        gradientColors: ["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"],
        buttonColors: ["#ff8c00", "#FFBF00"],
        buttonText: "GET STARTED",
        actionType: "randomStory", // New property to identify action
      },
      {
        id: 2,
        image: require("../assets/story_assets/disp2.jpg"),
        title: "Explore new\nworlds awaiting.",
        subtitle: "Discover stories that will captivate your imagination.",
        gradientColors: ["rgba(20,20,60,0.4)", "rgba(0,0,40,0.8)"],
        buttonColors: ["#6b73ff", "#9b59b6"],
        buttonText: "EXPLORE WORLDS",
        actionType: "explore", // Navigate to explore page
      },
      {
        id: 3,
        image: require("../assets/story_assets/disp3.jpg"),
        title: "Create your own\nepic journey.",
        subtitle: "Write, customize and share your unique adventures.",
        gradientColors: ["rgba(0,40,40,0.4)", "rgba(0,20,20,0.8)"],
        buttonColors: ["#1dd1a1", "#10ac84"],
        buttonText: "CREATE STORY",
        actionType: "create", // Navigate to demo page
      },
      {
        id: 4,
        image: require("../assets/story_assets/disp4.jpg"),
        title: "We value your feedback!",
        subtitle: "Help us improve your adventures by sharing your thoughts.",
        gradientColors: ["rgba(80,20,20,0.4)", "rgba(40,0,0,0.8)"],
        buttonColors: ["#e84393", "#d63031"],
        buttonText: "SEND FEEDBACK",
        actionType: "submitFeedback", // New action to submit feedback
      },
    ],
    []
  );

  // Optimized scroll handler with useCallback
  const handleScroll = useCallback((event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);
  }, []);

  // Memoized scroll to slide function
  const scrollToSlide = useCallback((index) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
    setCurrentIndex(index);
  }, []);

  // Function to get random story from aiDungeonOriginals
  const getRandomStory = useCallback(() => {
    if (firstAdventures && firstAdventures.length > 0) {
      const randomIndex = Math.floor(Math.random() * firstAdventures.length);
      return firstAdventures[randomIndex];
    }
    return null;
  }, []);

  // Enhanced start press handler with slide-specific actions
  const handleStartPress = useCallback(() => {
    const currentSlide = slides[currentIndex];

    switch (currentSlide.actionType) {
      case "randomStory":
        // Get random story from aiDungeonOriginals and navigate to StoryPlay
        const randomStory = getRandomStory();
        if (randomStory) {
          navigation.navigate("StoryPlay", {
            storyTitle: randomStory.title,
            storyDescription: randomStory.description,
          });

          // Save to recently played
          saveRecentlyPlayed({
            ...randomStory,
            playedAt: new Date().toISOString(),
          });
        } else {
          console.warn("No stories available in aiDungeonOriginals");
        }
        break;

      case "explore":
        // Navigate to explore page
        navigation.navigate("Explore");
        break;

      case "create":
        // Navigate to demo page
        navigation.navigate("CreateScenario");
        break;

      case "submitFeedback":
        const subject = "Feedback for NexusAI App";
        const body =
          "Hi NexusAI Team,\n\nI would like to share the following feedback:\n";
        const email = "dev.nexusai@gmail.com";

        const mailUrl = `mailto:${email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;

        Linking.openURL(mailUrl).catch(() => {
          Alert.alert(
            "Error",
            "Could not open email client. Please send feedback manually to nexusoriginals@gmail.com"
          );
        });
        break;

      default:
        // Fallback - move to next slide or complete onboarding
        if (currentIndex < slides.length - 1) {
          scrollToSlide(currentIndex + 1);
        } else {
          console.log("Onboarding complete");
        }
        break;
    }
  }, [currentIndex, slides, navigation, getRandomStory, scrollToSlide]);

  // Memoized navigation handler for story details (simplified)
  const navigateToStoryDetails = useCallback(
    (story) => {
      navigation.navigate("StoryDetails", { story });
    },
    [navigation]
  );

  // Memoized navigation handler for category stories
  const navigateToCategoryStories = useCallback(
    (adventures, categoryTitle) => {
      navigation.navigate("CategoryStories", {
        adventures,
        categoryTitle,
      });
    },
    [navigation]
  );

  // Enhanced Recently Played Card Component
  const renderRecentlyPlayedCard = useCallback(
    (story) => {
      const timeDiff = story.playedAt
        ? new Date() - new Date(story.playedAt)
        : 0;
      const timeAgo =
        timeDiff < 3600000
          ? `${Math.floor(timeDiff / 60000)}m ago`
          : timeDiff < 86400000
          ? `${Math.floor(timeDiff / 3600000)}h ago`
          : `${Math.floor(timeDiff / 86400000)}d ago`;

      return (
        <TouchableOpacity
          key={story.id}
          style={recentlyPlayedStyles.recentCard}
          onPress={() => navigateToStoryDetails(story)}
          activeOpacity={0.85}
        >
          <View style={recentlyPlayedStyles.cardContainer}>
            {/* Left Image Section */}
            <View style={recentlyPlayedStyles.imageSection}>
              <Image
                source={story.image}
                style={recentlyPlayedStyles.backgroundImage}
              />
            </View>

            {/* Right Content Section */}
            <View style={recentlyPlayedStyles.contentSection}>
              <LinearGradient
                colors={["rgba(26, 26, 46, 0.95)", "rgba(16, 33, 62, 0.95)"]}
                style={recentlyPlayedStyles.contentGradient}
              >
                {/* Header with time and status */}
                <View style={recentlyPlayedStyles.cardHeader}>
                  <View style={recentlyPlayedStyles.statusContainer}>
                    <View style={recentlyPlayedStyles.statusDot} />
                    <Text style={recentlyPlayedStyles.statusText}>RECENT</Text>
                  </View>
                  <Text style={recentlyPlayedStyles.timeText}>{timeAgo}</Text>
                </View>

                {/* Title and Description */}
                <View style={recentlyPlayedStyles.cardBody}>
                  <Text
                    style={recentlyPlayedStyles.cardTitle}
                    numberOfLines={1}
                  >
                    {story.title}
                  </Text>
                  <Text
                    style={recentlyPlayedStyles.cardDescription}
                    numberOfLines={4}
                  >
                    {story.description}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigateToStoryDetails]
  );

  // Enhanced card component - memoized with useCallback
  const renderEnhancedCard = useCallback(
    (adventure) => (
      <TouchableOpacity
        key={adventure.id}
        style={enhancedStyles.enhancedCard}
        onPress={() => navigateToStoryDetails(adventure)}
        activeOpacity={0.8}
      >
        <View style={enhancedStyles.cardLayout}>
          {/* Left side - Image */}
          <View style={enhancedStyles.imageContainer}>
            <ImageBackground
              source={adventure.image}
              style={enhancedStyles.cardImage}
              imageStyle={enhancedStyles.cardImageStyle}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.3)"]}
                style={enhancedStyles.imageOverlay}
              >
                <View style={enhancedStyles.difficultyBadge}>
                  <Text style={enhancedStyles.difficultyText}>
                    {adventure.difficulty}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Right side - Content */}
          <View style={enhancedStyles.contentContainer}>
            <LinearGradient
              colors={[...adventure.gradientColors, "rgba(0,0,0,0.2)"]}
              style={enhancedStyles.contentGradient}
            >
              <View style={enhancedStyles.cardHeader}>
                <Text style={enhancedStyles.genreTag}>{adventure.genre}</Text>
                <TouchableOpacity
                  style={enhancedStyles.playButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-circle" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={enhancedStyles.cardBody}>
                <Text
                  style={enhancedStyles.enhancedCardTitle}
                  numberOfLines={1}
                >
                  {adventure.title}
                </Text>
                <Text
                  style={enhancedStyles.enhancedCardDescription}
                  numberOfLines={3}
                >
                  {adventure.description}
                </Text>
              </View>

              <View style={enhancedStyles.cardFooter}>
                <View style={enhancedStyles.statsRow}>
                  <View style={enhancedStyles.statItem}>
                    <Ionicons
                      name="thumbs-up-sharp"
                      size={15}
                      color="#FFBF00"
                      style={{ marginRight: 5 }}
                    />
                    <Text style={enhancedStyles.statText}>
                      {adventure.likes}
                    </Text>
                  </View>
                  <View style={enhancedStyles.statItem}>
                    <Ionicons name="play-outline" size={15} color="#64748B" />
                    <Text style={enhancedStyles.statText}>
                      {adventure.plays}
                    </Text>
                  </View>
                </View>
                <Text style={enhancedStyles.timeText}>{adventure.timeAgo}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigateToStoryDetails]
  );

  // Enhanced horizontal section renderer - memoized
  const renderEnhancedSection = useCallback(
    (title, adventures, tadventures, icon) => (
      <View style={enhancedStyles.enhancedSectionContainer} key={title}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginRight: 20,
          }}
        >
          <View style={enhancedStyles.titleContainer}>
            <Ionicons
              name={icon}
              size={20}
              color="#FFBF00"
              style={{ marginRight: 6 }}
            />
            <Text style={enhancedStyles.enhancedSectionTitle}>{title}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigateToCategoryStories(tadventures, title)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={20} color="#C0C0C0" />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={enhancedStyles.horizontalScrollContainer}
          style={enhancedStyles.horizontalScrollView}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
        >
          {adventures.map(renderEnhancedCard)}
        </ScrollView>
      </View>
    ),
    [navigateToCategoryStories, renderEnhancedCard]
  );

  // Recently Played Section renderer
  const renderRecentlyPlayedSection = useCallback(() => {
    if (recentlyPlayedStories.length === 0) return null;

    // Show only the most recent story
    const mostRecentStory = recentlyPlayedStories[0];

    return (
      <View style={recentlyPlayedStyles.sectionContainer}>
        <View style={recentlyPlayedStyles.sectionHeader}>
          <View style={recentlyPlayedStyles.titleContainer}>
            <Ionicons
              name="time-outline"
              size={20}
              color="#FFBF00"
              style={{ marginRight: 6 }}
            />
            <Text style={recentlyPlayedStyles.sectionTitle}>
              RECENTLY PLAYED
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigateToCategoryStories(recentlyPlayedStories, "recent")
            }
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={20} color="#C0C0C0" />
          </TouchableOpacity>
        </View>

        <View style={recentlyPlayedStyles.singleCardContainer}>
          {renderRecentlyPlayedCard(mostRecentStory)}
        </View>
      </View>
    );
  }, [recentlyPlayedStories, renderRecentlyPlayedCard]);

  // Memoize sliced adventure arrays
  const slicedAdventures = useMemo(
    () => ({
      aiDungeonOriginals: aiDungeonOriginals.slice(0, 5),
      firstAdventures: firstAdventures.slice(0, 5),
      romance: romance.slice(0, 5),
      worlds: worlds.slice(0, 5),
      legends: legends.slice(0, 5),
      horror: horror.slice(0, 5),
    }),
    []
  );

  // Memoize dot press handlers
  const dotPressHandlers = useMemo(
    () => slides.map((_, index) => () => scrollToSlide(index)),
    [slides, scrollToSlide]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      <LinearGradient
        colors={["#0a0a1a", "#1a1a2e", "#16213e", "#0a0a1a"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={require("../assets/logo1.png")}
              style={{ width: 30, height: 30 }}
            />
            <Text style={styles.logo}>
              Nexus
              <Text style={{ color: "#FFF" }}>AI</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateScenario")}
            >
              <Ionicons name="create" size={24} color="#A9A9A9" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Promotion")}>
              <Ionicons name="diamond" size={24} color="#FFBF00" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.scrollView}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
          >
            {/* Hero Section */}
            {slides.map((slide, index) => (
              <View key={slide.id} style={styles.slideContainer}>
                <View style={styles.heroSection}>
                  <ImageBackground
                    source={slide.image}
                    style={styles.heroBackground}
                  >
                    <LinearGradient
                      colors={slide.gradientColors}
                      style={styles.heroOverlay}
                    >
                      <Text style={styles.heroTitle}>{slide.title}</Text>
                      <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
                      <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleStartPress}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={slide.buttonColors}
                          style={styles.startButtonGradient}
                        >
                          <Text style={styles.startButtonText}>
                            {slide.buttonText}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <View style={styles.pageIndicator}>
                        {slides.map((_, dotIndex) => (
                          <TouchableOpacity
                            key={dotIndex}
                            onPress={dotPressHandlers[dotIndex]}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.dot,
                                currentIndex === dotIndex && styles.activeDot,
                              ]}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Recently Played Section */}
          {renderRecentlyPlayedSection()}

          {/* Enhanced Horizontal Sections */}
          {renderEnhancedSection(
            "NEXUS ORIGINALS",
            slicedAdventures.aiDungeonOriginals,
            aiDungeonOriginals,
            "star-sharp"
          )}

          {renderEnhancedSection(
            "FOR YOUR FIRST ADVENTURES",
            slicedAdventures.firstAdventures,
            firstAdventures,
            "rocket-sharp"
          )}

          {renderEnhancedSection(
            "WHISPERS OF ROMANCE",
            slicedAdventures.romance,
            romance,
            "heart-circle"
          )}

          {renderEnhancedSection(
            "WORLDS TO EXPLORE",
            slicedAdventures.worlds,
            worlds,
            "planet"
          )}

          {renderEnhancedSection(
            "LEGENDS UNLEASHED",
            slicedAdventures.legends,
            legends,
            "trophy-sharp"
          )}
          {renderEnhancedSection(
            "FEAR REALM",
            slicedAdventures.horror,
            horror,
            "skull"
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// Enhanced styles for Recently Played cards
const recentlyPlayedStyles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  horizontalScrollView: {
    paddingLeft: 20,
  },
  horizontalContainer: {
    paddingRight: 20,
  },
  singleCardContainer: {
    paddingHorizontal: 20,
  },
  recentCard: {
    width: screenWidth - 40, // Full width minus margins
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  cardContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(10, 10, 26, 0.9)",
  },
  imageSection: {
    width: "35%",
    height: "100%",
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  backgroundImageStyle: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  emojiImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 191, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  emojiImage: {
    fontSize: 40,
  },
  imageGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
  },
  contentSection: {
    width: "65%",
    height: "100%",
  },
  contentGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10ac84",
    marginRight: 6,
  },
  statusText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  timeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
  cardBody: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDescription: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

// Enhanced styles for the new card design
const enhancedStyles = StyleSheet.create({
  enhancedSectionContainer: {
    marginVertical: 15,
  },
  horizontalScrollView: {
    paddingLeft: 20,
  },
  horizontalScrollContainer: {
    paddingRight: 20,
  },
  titleContainer: {
    marginLeft: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  enhancedSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  enhancedCard: {
    width: 350,
    height: 180,
    marginRight: 15,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  cardLayout: {
    flex: 1,
    flexDirection: "row",
  },
  imageContainer: {
    width: "40%",
    height: "100%",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  cardImageStyle: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 12,
  },
  contentContainer: {
    width: "60%",
    height: "100%",
  },
  contentGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  difficultyBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  difficultyText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardBody: {
    flex: 1,
    justifyContent: "flex-start",
  },
  genreTag: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  enhancedCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    lineHeight: 20,
  },
  enhancedCardDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    lineHeight: 15,
  },
  cardFooter: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statIcon: {
    fontSize: 9,
    marginRight: 3,
  },
  statText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
  timeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    textAlign: "left",
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
  },
  playButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  playButtonIcon: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default HomeScreen;

// Export the helper functions for use in other components
export { saveRecentlyPlayed, getRecentlyPlayed };
