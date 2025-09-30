import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image,
  Animated,
  FlatList,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { aiDungeonOriginals, worlds, firstAdventures, romance, legends, horror } from '../data/stories';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Constants for pagination
const ITEMS_PER_PAGE = 10;
const INITIAL_LOAD_SIZE = 5;

// Move categories outside component to prevent re-creation
const CATEGORIES = [
  { id: 'all', name: 'All Stories', icon: 'library' },
  { id: 'originals', name: 'AI Originals', icon: 'flash' },
  { id: 'worlds', name: 'Worlds', icon: 'planet' },
  { id: 'adventures', name: 'Adventures', icon: 'star' },
  { id: 'romance', name: 'Romance', icon: 'heart' },
  { id: 'legends', name: 'Legends', icon: 'trophy' },
  { id: 'horror', name: 'Horror', icon: 'skull' }
];

// Create StoryCard outside main component to prevent re-creation
const StoryCard = React.memo(({ story, index, onPress }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      delay: (index % ITEMS_PER_PAGE) * 100,
      useNativeDriver: true,
    }).start();
  }, [index, cardAnim]);

  return (
    <Animated.View 
      style={[
        styles.storyCardContainer,
        {
          opacity: cardAnim,
          transform: [{
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.storyCard}
        activeOpacity={0.85}
        onPress={() => onPress(story)}
      >
        <View style={styles.cardContainer}>
          <View style={styles.imageSection}>
            <Image source={story.image} style={styles.backgroundImage} />
            <LinearGradient
              colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
              style={styles.imageGradient}
            />
          </View>
          
          <View style={styles.contentSection}>
            <LinearGradient
              colors={["rgba(26, 26, 46, 0.95)", "rgba(16, 33, 62, 0.95)"]}
              style={styles.contentGradient}
            > 
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {story.title}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {story.description}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.genreBadge}>
                  <Text style={styles.genreText}>{story.genre}</Text>
                </View>
                <TouchableOpacity style={styles.playButton} activeOpacity={0.8}>
                    <Ionicons name="play-circle" size={20}  color="#64748B" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Create SearchBar as a separate component
const SearchBar = React.memo(({ searchQuery, onSearchChange, onClearSearch, fadeAnim, scaleAnim }) => {
  const searchInputRef = useRef(null);

  return (
    <Animated.View 
      style={[
        styles.searchContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search stories, genres, or keywords..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          blurOnSubmit={false}
          keyboardType="default"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
});

const ExploreScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [displayedItems, setDisplayedItems] = useState(INITIAL_LOAD_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const flatListRef = useRef(null);

  const navigation = useNavigation();

  // Memoize all stories to prevent recreation
  const allStories = useMemo(() => {
    return [
      ...aiDungeonOriginals.map((story) => ({ 
        ...story, 
        category: 'originals',
      })),
      ...worlds.map((story) => ({ 
        ...story, 
        category: 'worlds',
      })),
      ...firstAdventures.map((story) => ({ 
        ...story, 
        category: 'adventures',
      })),
      ...romance.map((story) => ({ 
        ...story, 
        category: 'romance',
      })),
      ...legends.map((story) => ({ 
        ...story, 
        category: 'legends',
      })),
      ...horror.map((story) => ({ 
        ...story, 
        category: 'horror',
      }))
    ];
  }, []); // Empty deps since story data is static

  // Stable callbacks
  const navigateToStoryDetails = useCallback((story) => {
    navigation.navigate("StoryDetails", { story });
  }, [navigation]);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  // Initial loading animation
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
      
      Animated.parallel([
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
      ]).start();
    };

    loadData();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Reset pagination when filters change (NOT search)
  useEffect(() => {
    setDisplayedItems(INITIAL_LOAD_SIZE);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
  }, [selectedCategory, selectedDifficulty, sortBy]);

  // Memoize filtered stories
  const filteredStories = useMemo(() => {
    let filtered = allStories;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(story => story.difficulty === selectedDifficulty);
    }

    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(queryLower) ||
        story.description.toLowerCase().includes(queryLower) ||
        story.genre.toLowerCase().includes(queryLower)
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          const aPlays = parseInt(a.plays.toString().replace('k', '000'));
          const bPlays = parseInt(b.plays.toString().replace('k', '000'));
          return bPlays - aPlays;
        case 'likes':
          return b.likes - a.likes;
        case 'newest':
          return 0;
        default:
          return 0;
      }
    });
  }, [allStories, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  // Get paginated stories for display
  const paginatedStories = useMemo(() => {
    return filteredStories.slice(0, displayedItems);
  }, [filteredStories, displayedItems]);

  // Handle load more functionality
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || displayedItems >= filteredStories.length) return;
    
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setDisplayedItems(prev => Math.min(prev + ITEMS_PER_PAGE, filteredStories.length));
    setIsLoadingMore(false);
  }, [isLoadingMore, displayedItems, filteredStories.length]);

  const handleOnEndReached = useCallback(() => {
    if (!isLoadingMore && displayedItems < filteredStories.length) {
      handleLoadMore();
    }
  }, [handleLoadMore, isLoadingMore, displayedItems, filteredStories.length]);

  // Render functions
  const renderStoryItem = useCallback(({ item, index }) => (
    <StoryCard 
      story={item}
      index={index}
      onPress={navigateToStoryDetails}
    />
  ), [navigateToStoryDetails]);

  const keyExtractor = useCallback((item, index) => 
    `${item.category}-${item.id || item.title}-${index}`, []
  );

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#FFBF00" />
        <Text style={styles.loadingText}>Discovering Stories...</Text>
        <Text style={styles.loadingSubtext}>Preparing your next adventure</Text>
      </View>
    </View>
  );

  // Category Filter Component
  const CategoryFilter = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => handleCategoryChange(category.id)}
            style={[
              styles.categoryButton,
              selectedCategory === category.id ? styles.categoryButtonActive : styles.categoryButtonInactive
            ]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={category.icon} 
              size={16} 
              color={selectedCategory === category.id ? '#000' : '#D1D5DB'} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id ? styles.categoryTextActive : styles.categoryTextInactive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const FilterDropdowns = () => (
    <Animated.View style={[styles.filtersContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.8}
      >
        <Ionicons name="options" size={16} color="#D1D5DB" />
        <Text style={styles.filterButtonText}>Filters</Text>
        <Ionicons 
          name={showFilters ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#D1D5DB" 
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.filterButton} activeOpacity={0.8}>
        <Text style={styles.filterButtonText}>
          {sortBy === 'popularity' ? 'Most Popular' : 
           sortBy === 'likes' ? 'Most Liked' : 'Newest'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#D1D5DB" />
      </TouchableOpacity>
    </Animated.View>
  );

  const EmptyState = () => (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
        <Ionicons name="search" size={64} color="#FFBF00" />
        <Text style={styles.emptyTitle}>No stories found</Text>
        <Text style={styles.emptyDescription}>
          Try adjusting your search or filters to find more stories
        </Text>
    </Animated.View>
  );

  const LoadMoreFooter = () => {
    if (displayedItems >= filteredStories.length) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        {isLoadingMore ? (
          <ActivityIndicator size="small" color="#FFBF00" />
        ) : (
          <TouchableOpacity 
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
            activeOpacity={0.8}
          >
            <Text style={styles.loadMoreText}>Load More Stories</Text>
            <Ionicons name="chevron-down" size={16} color="#FFBF00" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Create a stable header component
  const ListHeaderComponent = useMemo(() => (
    <>
      <SearchBar 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
      />
      <CategoryFilter />
      <FilterDropdowns />
      <Animated.View style={[styles.resultsHeader, { opacity: fadeAnim }]}>
        <Text style={styles.resultsCount}>
          Showing {paginatedStories.length} of {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
        </Text>
      </Animated.View>
    </>
  ), [searchQuery, handleSearchChange, handleClearSearch, fadeAnim, scaleAnim, selectedCategory, paginatedStories.length, filteredStories.length]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={["#1F2937", "#111827"]}
          style={styles.headerGradient}
        />
      </Animated.View>

      {filteredStories.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={paginatedStories}
          renderItem={renderStoryItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={LoadMoreFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          onEndReached={handleOnEndReached}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={false}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          windowSize={10}
          initialNumToRender={INITIAL_LOAD_SIZE}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        />
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {ListHeaderComponent}
          <EmptyState />
        </ScrollView>
      )}
    </View>
  );
};

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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4B5563',
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#FFBF00',
  },
  categoryButtonInactive: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#000000',
  },
  categoryTextInactive: {
    color: '#D1D5DB',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginHorizontal: 8,
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  resultsCount: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  storyCardContainer: {
    marginBottom: 20,
    marginHorizontal: 24,
  },
  storyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    height: 160,
  },
  imageSection: {
    width: '40%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentSection: {
    flex: 1,
    overflow: 'hidden',
  },
  contentGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 10,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  genreBadge: {
    backgroundColor: 'rgba(255, 191, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
  },
  genreText: {
    fontSize: 11,
    color: '#FFBF00',
    fontWeight: '600',
  },
  playButton: {
    borderRadius: 14,
    padding: 6,
    overflow: 'hidden',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 191, 0, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 191, 0, 0.3)',
  },
  loadMoreText: {
    color: '#FFBF00',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ExploreScreen;