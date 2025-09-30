// screens/CategoryStories.js
import React from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  StatusBar
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const { width } = Dimensions.get('window');

export default function CategoryStories({ route, navigation }) {
  const { categoryTitle } = route.params;
  const { adventures }= route.params;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'expert': return '#F44336';
      default: return '#757575';
    }
  };

  const getGradientColors = (item) => {
    return item.gradientColors || ['#2a2a2a', '#1a1a1a'];
  };

  const renderAdventureCard = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => navigation.navigate("StoryDetails", { story: item })}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          />
          <View style={styles.difficultyBadge}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
              style={styles.difficultyBadgeGradient}
            >
              <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                {item.difficulty}
              </Text>
            </LinearGradient>
          </View>
        </View>
        
        <LinearGradient
          colors={getGradientColors(item)}
          style={styles.contentContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.contentInner}>
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <LinearGradient
                colors={['rgba(74, 85, 104, 0.8)', 'rgba(74, 85, 104, 0.6)']}
                style={styles.genreTag}
              >
                <Text style={styles.genreText}>{item.genre}</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#888" />
                <Text style={styles.statText}>{item.timeAgo}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      
      <LinearGradient
        colors={['#0a0a1a', '#1a1a2e', '#16213e']}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header}>{categoryTitle}</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <LinearGradient
              colors={["#0a0a1a", "#1a1a2e", "#16213e", "#0a0a1a"]}
              style={styles.gradient}
            >
      <FlatList
        data={adventures}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAdventureCard}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
      />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1a",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(22, 33, 62, 0.3)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
   gradient: {
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: 'left',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardContainer: {
    width: (width - 32) / 2,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 130,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  difficultyBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  contentContainer: {
    minHeight: 140,
  },
  contentInner: {
    padding: 14,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  genreTag: {
    borderRadius: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  genreText: {
    fontSize: 9,
    color: '#E2E8F0',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  description: {
    fontSize: 12,
    color: "#e0e0e0",
    lineHeight: 17,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statsContainer: {
    flexDirection: 'column',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 4,
    marginTop: 'auto',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: "#bbb",
    marginLeft: 4,
    fontWeight: '500',
  },
});