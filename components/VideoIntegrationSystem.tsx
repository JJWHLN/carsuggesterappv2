import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInDown,
  ZoomIn,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Mock video component for now (can be replaced with expo-av later)
const Video = ({ ref, style, source, shouldPlay, isLooping, isMuted, resizeMode, onPlaybackStatusUpdate, ...props }: any) => (
  <View style={[style, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
    <Text style={{ color: 'white', fontSize: 16 }}>Video Player</Text>
    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>
      {source?.uri || 'No video source'}
    </Text>
  </View>
);

const ResizeMode = {
  CONTAIN: 'contain' as const,
};

import { 
  Plus as Play, Minus as Pause, MessageCircle as Volume2, MessageCircle as VolumeX, 
  ArrowRight as Maximize, ArrowLeft as Minimize, RefreshCw as RotateCw,
  Share, Heart, Camera, Zap, Award, X, ChevronLeft, ChevronRight, Eye, Clock, MessageCircle
} from '@/utils/ultra-optimized-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { OptimizedImage } from './ui/OptimizedImage';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';
import { Car } from '@/types/database';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CarVideo {
  id: string;
  carId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  views: number;
  likes: number;
  type: 'exterior' | 'interior' | 'driving' | 'review' | 'comparison' | '360_tour';
  quality: '720p' | '1080p' | '4K';
  thumbnailUrl: string;
  videoUrl: string;
  timestamp: Date;
  isExclusive?: boolean;
  isPremium?: boolean;
  dealer?: {
    id: string;
    name: string;
    logo: string;
    verified: boolean;
  };
}

interface VideoPlayerProps {
  video: CarVideo;
  isVisible: boolean;
  isFullscreen: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
}

interface VideoGalleryProps {
  car: Car;
  videos: CarVideo[];
  onVideoSelect: (video: CarVideo) => void;
  onRequestMoreVideos?: () => void;
}

interface VideoIntegrationSystemProps {
  car: Car;
  visible: boolean;
  onClose: () => void;
  onVideoInteraction?: (action: string, videoId: string) => void;
}

// Mock video data generator
const generateMockVideos = (carId: string): CarVideo[] => [
  {
    id: 'vid-1',
    carId,
    title: 'Complete Exterior Walkthrough',
    description: 'Detailed 4K tour of the exterior design, paint quality, and unique features',
    duration: 180,
    views: 15420,
    likes: 892,
    type: 'exterior',
    quality: '4K',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isExclusive: true,
    dealer: {
      id: 'dealer-1',
      name: 'Premium Motors',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      verified: true,
    },
  },
  {
    id: 'vid-2',
    carId,
    title: 'Luxury Interior Features',
    description: 'Experience the premium interior design, technology, and comfort features',
    duration: 240,
    views: 12350,
    likes: 721,
    type: 'interior',
    quality: '1080p',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isPremium: true,
  },
  {
    id: 'vid-3',
    carId,
    title: 'Dynamic Driving Experience',
    description: 'Feel the power and performance on the road with this driving showcase',
    duration: 320,
    views: 23540,
    likes: 1245,
    type: 'driving',
    quality: '1080p',
    thumbnailUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'vid-4',
    carId,
    title: '360° Virtual Tour',
    description: 'Interactive 360-degree experience - explore every angle',
    duration: 150,
    views: 8920,
    likes: 456,
    type: '360_tour',
    quality: '4K',
    thumbnailUrl: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400&h=300&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    isExclusive: true,
  },
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  isVisible,
  isFullscreen,
  onClose,
  onToggleFullscreen,
  onVideoEnd,
  autoPlay = true,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);
  
  const videoRef = useRef<any>(null);
  const [status, setStatus] = useState<any>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const controlsOpacity = useSharedValue(1);
  const hideControlsTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoPlay && isVisible) {
      playVideo();
    }
  }, [isVisible, autoPlay]);

  useEffect(() => {
    if (showControls) {
      controlsOpacity.value = withTiming(1, { duration: 300 });
      resetHideTimer();
    } else {
      controlsOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [showControls]);

  const resetHideTimer = () => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  const playVideo = async () => {
    if (videoRef.current) {
      await videoRef.current.playAsync();
      setIsPlaying(true);
      resetHideTimer();
    }
  };

  const pauseVideo = async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  const togglePlayPause = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await pauseVideo();
    } else {
      await playVideo();
    }
  };

  const toggleMute = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
    }
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    if (!showControls) {
      resetHideTimer();
    }
  };

  const handleStatusUpdate = (status: any) => {
    setStatus(status);
    if (status.positionMillis) {
      setCurrentTime(status.positionMillis / 1000);
    }
    if (status.didJustFinish && onVideoEnd) {
      onVideoEnd();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.playerContainer, isFullscreen && styles.fullscreenContainer]}>
        <StatusBar hidden={isFullscreen} backgroundColor="black" />
        
        {/* Video */}
        <TouchableOpacity 
          style={styles.videoWrapper}
          activeOpacity={1}
          onPress={handleVideoPress}
        >
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: video.videoUrl }}
            shouldPlay={isPlaying}
            isLooping={false}
            isMuted={isMuted}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handleStatusUpdate}
          />
        </TouchableOpacity>

        {/* Controls Overlay */}
        <Animated.View style={[styles.controlsOverlay, controlsStyle]}>
          {/* Top Controls */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.topControls}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {video.title}
              </Text>
              <View style={styles.videoMeta}>
                <Eye size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.videoMetaText}>
                  {video.views.toLocaleString()} views
                </Text>
                <Clock size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.videoMetaText}>
                  {formatTime(video.duration)}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onToggleFullscreen} style={styles.fullscreenButton}>
              {isFullscreen ? (
                <Minimize size={20} color="white" />
              ) : (
                <Maximize size={20} color="white" />
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* Center Play/Pause Button */}
          <TouchableOpacity 
            style={styles.centerPlayButton}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <View style={styles.centerPlayButtonInner}>
              {isPlaying ? (
                <Pause size={32} color="white" />
              ) : (
                <Play size={32} color="white" />
              )}
            </View>
          </TouchableOpacity>

          {/* Bottom Controls */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.bottomControls}
          >
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(currentTime / video.duration) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(video.duration)}
              </Text>
            </View>
            
            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                {isMuted ? (
                  <VolumeX size={20} color="white" />
                ) : (
                  <Volume2 size={20} color="white" />
                )}
              </TouchableOpacity>

              <View style={styles.spacer} />

              <TouchableOpacity style={styles.actionButton}>
                <Heart size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Share size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Video Type Badge */}
        {video.type === '360_tour' && (
          <View style={styles.specialBadge}>
            <RotateCw size={16} color="white" />
            <Text style={styles.specialBadgeText}>360° Tour</Text>
          </View>
        )}

        {video.isExclusive && (
          <View style={[styles.specialBadge, { backgroundColor: colors.primary }]}>
            <Award size={16} color="white" />
            <Text style={styles.specialBadgeText}>Exclusive</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const VideoGallery: React.FC<VideoGalleryProps> = ({
  car,
  videos,
  onVideoSelect,
  onRequestMoreVideos,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const getVideoTypeIcon = (type: CarVideo['type']) => {
    switch (type) {
      case 'exterior': return Camera;
      case 'interior': return Eye;
      case 'driving': return Zap;
      case '360_tour': return RotateCw;
      case 'review': return MessageCircle;
      default: return Play;
    }
  };

  const getVideoTypeColor = (type: CarVideo['type']) => {
    switch (type) {
      case 'exterior': return '#10B981';
      case 'interior': return '#8B5CF6';
      case 'driving': return '#F59E0B';
      case '360_tour': return '#EF4444';
      case 'review': return '#3B82F6';
      default: return colors.primary;
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <View style={styles.galleryContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryContent}
      >
        {videos.map((video, index) => {
          const Icon = getVideoTypeIcon(video.type);
          const typeColor = getVideoTypeColor(video.type);
          
          return (
            <Animated.View
              key={video.id}
              entering={FadeIn.delay(index * 100).springify()}
            >
              <TouchableOpacity
                style={styles.videoCard}
                onPress={() => onVideoSelect(video)}
                activeOpacity={0.8}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                  <OptimizedImage
                    source={{ uri: video.thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  
                  {/* Play overlay */}
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Play size={20} color="white" />
                    </View>
                  </View>

                  {/* Duration badge */}
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>

                  {/* Quality badge */}
                  <View style={[styles.qualityBadge, { backgroundColor: typeColor }]}>
                    <Text style={styles.qualityText}>{video.quality}</Text>
                  </View>

                  {/* Special badges */}
                  {video.isExclusive && (
                    <View style={styles.exclusiveBadge}>
                      <Award size={12} color="white" />
                    </View>
                  )}
                </View>

                {/* Video Info */}
                <View style={styles.videoCardInfo}>
                  <View style={styles.videoTypeRow}>
                    <Icon size={14} color={typeColor} />
                    <Text style={[styles.videoTypeText, { color: typeColor }]}>
                      {video.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  
                  <Text style={[styles.videoCardTitle, { color: colors.text }]} numberOfLines={2}>
                    {video.title}
                  </Text>
                  
                  <View style={styles.videoStats}>
                    <View style={styles.statItem}>
                      <Eye size={12} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {formatViews(video.views)}
                      </Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Heart size={12} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {formatViews(video.likes)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Load More Button */}
        {onRequestMoreVideos && (
          <TouchableOpacity
            style={styles.loadMoreCard}
            onPress={onRequestMoreVideos}
            activeOpacity={0.8}
          >
            <View style={styles.loadMoreContent}>
              <ChevronRight size={24} color={colors.primary} />
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                View More
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export const VideoIntegrationSystem: React.FC<VideoIntegrationSystemProps> = ({
  car,
  visible,
  onClose,
  onVideoInteraction,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const [videos] = useState(() => generateMockVideos(car.id));
  const [selectedVideo, setSelectedVideo] = useState<CarVideo | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleVideoSelect = useCallback(async (video: CarVideo) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setSelectedVideo(video);
    setIsPlayerVisible(true);
    
    if (onVideoInteraction) {
      onVideoInteraction('play', video.id);
    }
  }, [onVideoInteraction]);

  const handlePlayerClose = useCallback(() => {
    setIsPlayerVisible(false);
    setSelectedVideo(null);
    setIsFullscreen(false);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleVideoEnd = useCallback(() => {
    if (onVideoInteraction && selectedVideo) {
      onVideoInteraction('complete', selectedVideo.id);
    }
  }, [onVideoInteraction, selectedVideo]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Camera size={24} color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Video Showcase
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {car.make} {car.model} • {videos.length} videos
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Video Gallery */}
      <VideoGallery
        car={car}
        videos={videos}
        onVideoSelect={handleVideoSelect}
        onRequestMoreVideos={() => console.log('Load more videos')}
      />

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          isVisible={isPlayerVisible}
          isFullscreen={isFullscreen}
          onClose={handlePlayerClose}
          onToggleFullscreen={handleToggleFullscreen}
          onVideoEnd={handleVideoEnd}
          autoPlay={true}
        />
      )}
    </View>
  );
};

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontWeight: '700',
    },
    headerSubtitle: {
      ...Typography.bodySmall,
      marginTop: 2,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    
    // Gallery Styles
    galleryContainer: {
      flex: 1,
    },
    galleryContent: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    videoCard: {
      width: 280,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      ...Shadows.medium,
    },
    thumbnailContainer: {
      position: 'relative',
      width: '100%',
      height: 160,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    playButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255,255,255,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationBadge: {
      position: 'absolute',
      bottom: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    durationText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    qualityBadge: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    qualityText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '700',
    },
    exclusiveBadge: {
      position: 'absolute',
      top: Spacing.sm,
      left: Spacing.sm,
      backgroundColor: colors.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoCardInfo: {
      padding: Spacing.md,
    },
    videoTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: Spacing.xs,
    },
    videoTypeText: {
      ...Typography.caption,
      fontWeight: '600',
    },
    videoCardTitle: {
      ...Typography.bodyText,
      fontWeight: '600',
      lineHeight: 20,
      marginBottom: Spacing.sm,
    },
    videoStats: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      ...Typography.caption,
    },
    loadMoreCard: {
      width: 120,
      height: 160,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    loadMoreContent: {
      alignItems: 'center',
      gap: Spacing.sm,
    },
    loadMoreText: {
      ...Typography.bodyText,
      fontWeight: '600',
    },
    
    // Player Styles
    playerContainer: {
      flex: 1,
      backgroundColor: 'black',
    },
    fullscreenContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    videoWrapper: {
      flex: 1,
    },
    video: {
      flex: 1,
    },
    controlsOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'space-between',
    },
    topControls: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: Spacing.lg,
    },
    videoInfo: {
      flex: 1,
      marginHorizontal: Spacing.lg,
    },
    videoTitle: {
      color: 'white',
      ...Typography.sectionTitle,
      fontWeight: '600',
    },
    videoMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: 4,
    },
    videoMetaText: {
      color: 'rgba(255,255,255,0.8)',
      ...Typography.caption,
    },
    fullscreenButton: {
      padding: Spacing.sm,
    },
    centerPlayButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -35 }, { translateY: -35 }],
    },
    centerPlayButtonInner: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.8)',
    },
    bottomControls: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
      paddingTop: Spacing.lg,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    progressBar: {
      flex: 1,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
    },
    progressFill: {
      height: '100%',
      backgroundColor: 'white',
      borderRadius: 2,
    },
    timeText: {
      color: 'white',
      ...Typography.caption,
      fontWeight: '500',
    },
    bottomButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    muteButton: {
      padding: Spacing.sm,
    },
    spacer: {
      flex: 1,
    },
    actionButton: {
      padding: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    specialBadge: {
      position: 'absolute',
      top: 100,
      right: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 20,
    },
    specialBadgeText: {
      color: 'white',
      ...Typography.caption,
      fontWeight: '600',
    },
  });
};
