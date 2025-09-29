// services/StorySessionService.js - Fixed Version
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

class StorySessionService {
  constructor() {
    this.collectionName = 'storySessions';
  }

  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  getCurrentUserSync() {
    return auth.currentUser;
  }

  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // FIXED: Simplified checkExistingSession to avoid index requirements
  async checkExistingSession(storyTitle) {
    const user = this.getCurrentUserSync();
    if (!user) {
      console.log('User not authenticated, skipping session check');
      return null;
    }

    console.log('Checking for existing sessions for story:', storyTitle);

    try {
      // Use simple query with only userId to avoid composite index requirement
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No sessions found for user');
        return null;
      }

      // Filter and sort in memory to avoid index requirements
      const matchingSessions = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            sessionId: data.sessionId || doc.id,
            ...data
          };
        })
        .filter(session => {
          // Check if this session matches our criteria
          const isMatchingStory = session.storyTitle === storyTitle;
          const isNotCompleted = session.isCompleted !== true;
          const hasProgress = session.storyParts && session.storyParts.length > 0;
          
          console.log(`Session ${session.sessionId}: story=${isMatchingStory}, completed=${!isNotCompleted}, parts=${session.storyParts?.length || 0}`);
          
          return isMatchingStory && isNotCompleted && hasProgress;
        })
        .sort((a, b) => {
          // Sort by lastUpdated (most recent first)
          const aTime = a.lastUpdated?.toMillis?.() || a.lastUpdated?.getTime?.() || 0;
          const bTime = b.lastUpdated?.toMillis?.() || b.lastUpdated?.getTime?.() || 0;
          return bTime - aTime;
        });

      if (matchingSessions.length === 0) {
        console.log('No matching active sessions found for story:', storyTitle);
        return null;
      }

      const mostRecentSession = matchingSessions[0];
      console.log('Found existing session:', mostRecentSession.sessionId, 'with', mostRecentSession.storyParts?.length || 0, 'parts');
      
      return mostRecentSession;

    } catch (error) {
      console.error('Failed to check existing session:', error);
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  }

  // FIXED: Enhanced session loading with better error handling
  async loadSession(sessionId) {
    const user = this.getCurrentUserSync();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Loading session:', sessionId, 'for user:', user.uid);

    try {
      const docRef = doc(db, this.collectionName, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('Session document does not exist:', sessionId);
        throw new Error('Session not found');
      }

      const sessionData = docSnap.data();
      console.log('Raw session data loaded:', {
        hasUserId: !!sessionData.userId,
        hasStoryTitle: !!sessionData.storyTitle,
        hasStoryParts: !!sessionData.storyParts,
        storyPartsCount: sessionData.storyParts?.length || 0,
        hasCurrentChoices: !!sessionData.currentChoices,
        choicesCount: sessionData.currentChoices?.length || 0,
        awaitingInput: sessionData.awaitingInput,
        isCompleted: sessionData.isCompleted
      });

      // Verify ownership
      if (sessionData.userId !== user.uid) {
        console.error('Access denied - session belongs to different user');
        throw new Error('Access denied');
      }

      // Validate essential data
      if (!sessionData.storyParts || !Array.isArray(sessionData.storyParts)) {
        console.error('Invalid session data - missing or invalid storyParts');
        throw new Error('Invalid session data');
      }

      console.log('Session loaded successfully:', sessionId);
      return {
        ...sessionData,
        sessionId: sessionData.sessionId || sessionId // Ensure sessionId is present
      };

    } catch (error) {
      console.error('Failed to load session:', sessionId, error);
      throw error;
    }
  }

  // FIXED: Enhanced session saving with better validation
  async saveSession(sessionData) {
    const user = this.getCurrentUserSync();
    if (!user) {
      console.log('User not authenticated, skipping save');
      return sessionData.sessionId;
    }

    // Enhanced validation
    if (!sessionData.storyTitle?.trim()) {
      console.error('Cannot save session: missing story title');
      throw new Error('Story title is required');
    }

    if (!sessionData.storyParts || !Array.isArray(sessionData.storyParts) || sessionData.storyParts.length === 0) {
      console.log('No story parts to save, skipping save operation');
      return sessionData.sessionId;
    }

    console.log('Saving session for user:', user.uid);
    console.log('Session data structure:', {
      sessionId: sessionData.sessionId,
      storyTitle: sessionData.storyTitle,
      storyPartsLength: sessionData.storyParts?.length || 0,
      hasCurrentChoices: !!sessionData.currentChoices,
      hasStoryContext: !!sessionData.storyContext,
      awaitingInput: sessionData.awaitingInput,
      isCompleted: sessionData.isCompleted
    });

    const sessionId = sessionData.sessionId || this.generateSessionId();
    const docRef = doc(db, this.collectionName, sessionId);

    try {
      // Prepare clean session data
      const cleanData = this.cleanSessionData({
        ...sessionData,
        sessionId,
        userId: user.uid
      });

      if (sessionData.sessionId) {
        // Check if session exists
        console.log('Checking if session exists:', sessionId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          console.log('Updating existing session:', sessionId);
          await updateDoc(docRef, {
            ...cleanData,
            lastUpdated: serverTimestamp()
          });
        } else {
          console.log('Session not found, creating new one:', sessionId);
          await setDoc(docRef, {
            ...cleanData,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          });
        }
      } else {
        console.log('Creating new session:', sessionId);
        await setDoc(docRef, {
          ...cleanData,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }

      console.log('Session saved successfully:', sessionId);
      return sessionId;

    } catch (error) {
      console.error('Failed to save session:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        sessionId: sessionId
      });
      throw error;
    }
  }

  // FIXED: Enhanced data cleaning with better validation
  cleanSessionData(sessionData) {
    const cleanData = {
      storyTitle: String(sessionData.storyTitle || '').trim(),
      storyDescription: String(sessionData.storyDescription || '').trim(),
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      lastUpdated: serverTimestamp(),
    };

    // Clean story parts with validation
    if (sessionData.storyParts && Array.isArray(sessionData.storyParts)) {
      cleanData.storyParts = sessionData.storyParts
        .filter(part => part && (part.content || part.isUserChoice)) // Filter out invalid parts
        .map(part => ({
          id: Number(part.id) || 1,
          content: String(part.content || ''),
          isUserChoice: Boolean(part.isUserChoice),
          timestamp: part.timestamp || new Date().toISOString()
        }));
    }

    // Clean choices
    if (sessionData.currentChoices && Array.isArray(sessionData.currentChoices)) {
      cleanData.currentChoices = sessionData.currentChoices
        .filter(choice => choice && String(choice).trim()) // Filter out empty choices
        .map(choice => String(choice).trim());
    }

    // Clean other fields
    if (sessionData.storyContext && String(sessionData.storyContext).trim()) {
      cleanData.storyContext = String(sessionData.storyContext).trim();
    }

    if (sessionData.userAnswers && typeof sessionData.userAnswers === 'object') {
      cleanData.userAnswers = {};
      Object.entries(sessionData.userAnswers).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          cleanData.userAnswers[key] = String(value);
        }
      });
    }

    if (sessionData.customizationQuestions && Array.isArray(sessionData.customizationQuestions)) {
      cleanData.customizationQuestions = sessionData.customizationQuestions.map(q => ({
        question: String(q.question || ''),
        type: String(q.type || 'text'),
        ...(q.options && Array.isArray(q.options) && { options: q.options.map(o => String(o)) }),
        ...(q.maxLength && { maxLength: Number(q.maxLength) })
      }));
    }

    if (typeof sessionData.awaitingInput === 'boolean') {
      cleanData.awaitingInput = sessionData.awaitingInput;
    }

    if (typeof sessionData.isCompleted === 'boolean') {
      cleanData.isCompleted = sessionData.isCompleted;
    }

    if (sessionData.currentSceneImage && String(sessionData.currentSceneImage).trim()) {
      cleanData.currentSceneImage = String(sessionData.currentSceneImage).trim();
    }

    if (sessionData.progress && typeof sessionData.progress === 'object') {
      cleanData.progress = {
        totalParts: Number(sessionData.progress.totalParts || 0),
        lastChoiceIndex: Number(sessionData.progress.lastChoiceIndex || 0)
      };
    }

    return cleanData;
  }

  // FIXED: Simplified session retrieval for user
  async getUserSessions(limitCount = 20) {
    const user = this.getCurrentUserSync();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Loading sessions for user:', user.uid);

    try {
      // Use simple query to avoid index issues
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            sessionId: data.sessionId || doc.id,
            ...data
          };
        })
        .sort((a, b) => {
          // Sort by lastUpdated in memory
          const aTime = a.lastUpdated?.toMillis?.() || a.lastUpdated?.getTime?.() || 0;
          const bTime = b.lastUpdated?.toMillis?.() || b.lastUpdated?.getTime?.() || 0;
          return bTime - aTime;
        });

      console.log('Loaded', sessions.length, 'sessions');
      return sessions;
    } catch (error) {
      console.error('Failed to load user sessions:', error);
      throw error;
    }
  }

  // Delete operations remain the same...
  async deleteSession(sessionId) {
    const user = this.getCurrentUserSync();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Deleting session:', sessionId);

    try {
      const docRef = doc(db, this.collectionName, sessionId);
      await deleteDoc(docRef);
      console.log('Session deleted successfully:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', sessionId, error);
      throw error;
    }
  }

  async deleteAllStorySessions(storyTitle) {
    const user = this.getCurrentUserSync();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('Deleting all sessions for story:', storyTitle);

    try {
      // Get all user sessions and filter by story title in memory
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const sessionsToDelete = querySnapshot.docs
        .filter(doc => doc.data().storyTitle === storyTitle)
        .map(doc => doc.ref);
      
      const deletePromises = sessionsToDelete.map(docRef => deleteDoc(docRef));
      await Promise.all(deletePromises);
      
      console.log(`Deleted ${sessionsToDelete.length} sessions for story:`, storyTitle);
      return sessionsToDelete.length;
    } catch (error) {
      console.error('Failed to delete story sessions:', error);
      throw error;
    }
  }
}

export default new StorySessionService();