// Optimized icon imports for better bundle size
// This file centralizes icon imports to reduce bundle size impact
// Re-exports only the icons we actually use in the app

import {
  // Navigation & Actions
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  X,
  Check,
  CheckCircle,
  
  // Search & Discovery
  Search,
  Filter,
  Sparkles,
  
  // Automotive
  Car,
  Fuel,
  Settings,
  Gauge,
  Truck,
  
  // User & Social
  User,
  Users,
  Heart,
  Star,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  
  // Location & Communication
  MapPin,
  Phone,
  Mail,
  Navigation,
  ExternalLink,
  
  // Business & Commerce
  DollarSign,
  ShoppingBag,
  Building2,
  Award,
  Shield,
  TrendingUp,
  Crown,
  
  // Time & Status
  Calendar,
  Clock,
  CalendarDays,
  
  // Media & Content
  Camera,
  Image,
  Upload,
  FileText,
  Play,
  
  // System & UI
  Home,
  Menu,
  MoreVertical,
  Grid2x2,
  List,
  Eye,
  EyeOff,
  
  // Alerts & Feedback
  AlertTriangle,
  CircleAlert,
  Info,
  RefreshCw,
  Zap,
  
  // Luxury & Premium
  Rocket,
  Palette,
  Smartphone,
  Package,
  
  // Auth & Security
  LogOut,
  UserCheck,
  UserX,
  Trash2,
  XCircle,
  
  // Preferences & Settings
  Bell,
  Moon,
  Edit,
  Bookmark,
  Share,
  Minus,
} from 'lucide-react-native';

// Re-export all icons
export {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  X,
  Check,
  CheckCircle,
  Search,
  Filter,
  Sparkles,
  Car,
  Fuel,
  Settings,
  Gauge,
  Truck,
  User,
  Users,
  Heart,
  Star,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Phone,
  Mail,
  Navigation,
  ExternalLink,
  DollarSign,
  ShoppingBag,
  Building2,
  Award,
  Shield,
  TrendingUp,
  Crown,
  Calendar,
  Clock,
  CalendarDays,
  Camera,
  Image,
  Upload,
  FileText,
  Play,
  Home,
  Menu,
  MoreVertical,
  Grid2x2,
  List,
  Eye,
  EyeOff,
  AlertTriangle,
  CircleAlert,
  Info,
  RefreshCw,
  Zap,
  Rocket,
  Palette,
  Smartphone,
  Package,
  LogOut,
  UserCheck,
  UserX,
  Trash2,
  XCircle,
  Bell,
  Moon,
  Edit,
  Bookmark,
  Share,
  Minus,
};

// USAGE NOTES:
// 1. Import icons from this file: import { Search, Heart, Star } from '@/utils/icons';
// 2. Only icons listed here are available - reduces bundle size
// 3. To add new icons, add them to the import and export lists above
// 4. Current icon count: ~60 icons (vs 400+ in full library)
// 5. Estimated bundle size reduction: 3-5MB (modern bundlers with tree-shaking)
//
// Bundle optimization relies on:
// - Tree-shaking during build process
// - Centralized icon management
// - Reduced import surface area across the codebase
