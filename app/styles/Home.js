import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: "#36454F",
  },
  gradient: {
    flex: 1,
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    backgroundColor: "#ff8c00",
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFBF00",
    letterSpacing: 2,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 18,
  },
    slideContainer: {
    width: screenWidth,
  },
  heroSection: {
    marginBottom: 20,
    width: "100%",
    height: 280,
    overflow: "hidden",
  },
  heroBackground: {
    flex: 1,
    justifyContent: "center",
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
    scrollView: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#cccccc",
    marginBottom: 20,
    lineHeight: 22,
  },
  startButton: {
    alignSelf: "flex-start",
    borderRadius: 25,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#ff8c00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  startButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeDot: {
    backgroundColor: "#FFBF00",
    width: 24,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    marginBottom: 15,
    letterSpacing: 1,
  },
  adventureCard: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 140, 0, 0.1)",
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(255, 140, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#aaaaaa",
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeAgo: {
    fontSize: 12,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  statsText: {
    fontSize: 12,
    color: "#888",
  },
  privateContainer: {
    flexDirection: "row",
    gap: 10,
  },
  privateText: {
    fontSize: 12,
    color: "#ff8c00",
  },
  playerCount: {
    fontSize: 12,
    color: "#888",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 140, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  playButtonText: {
    fontSize: 16,
    color: "#ff8c00",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 15,
    paddingBottom: 30,
    backgroundColor: "rgba(10, 10, 26, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 140, 0, 0.1)",
  },
  navItem: {
    alignItems: "center",
    flex: 1,
  },
  navItemCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 140, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navIconCenter: {
    fontSize: 24,
    color: "#ff8c00",
  },
  navLabel: {
    fontSize: 12,
    color: "#ff8c00",
    fontWeight: "600",
  },

})