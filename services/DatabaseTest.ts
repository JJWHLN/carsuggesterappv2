import { CarService } from './SimpleCarService';
import { testDatabaseConnection } from './EmergencyCarService';
import { logger } from '@/utils/logger';

/**
 * Quick test to verify your database is working
 * Run this to check if your Supabase schema is accessible
 */
export const runDatabaseTest = async () => {
  logger.info('🧪 Starting CarSuggester Database Test...');
  
  // Test 1: Basic connection
  logger.info('📡 Testing database connection...');
  const connectionWorks = await testDatabaseConnection();
  
  if (!connectionWorks) {
    logger.error('❌ Database connection failed!');
    return false;
  }
  
  logger.info('✅ Database connection successful!');
  
  // Test 2: Fetch cars from your schema
  logger.info('🚗 Testing car listings fetch...');
  const cars = await CarService.getAllCars();
  
  if (cars.length === 0) {
    logger.warn('⚠️ No cars found in car_listings_master table');
    logger.info('💡 This might mean:');
    logger.info('  1. The seed data needs to be inserted');
    logger.info('  2. The table exists but is empty');
    logger.info('  3. Row Level Security is blocking access');
  } else {
    logger.info(`✅ Found ${cars.length} cars in database!`);
    logger.info('📊 Sample car:', cars[0]?.make, cars[0]?.model, cars[0]?.year);
  }
  
  // Test 3: Test popular cars
  logger.info('🔥 Testing popular cars fetch...');
  const popularCars = await CarService.getPopularCars(3);
  logger.info(`✅ Found ${popularCars.length} popular cars`);
  
  // Test 4: Test reviews
  logger.info('📝 Testing reviews fetch...');
  const reviews = await CarService.getFeaturedReviews(2);
  logger.info(`✅ Found ${reviews.length} featured reviews`);
  
  // Summary
  logger.info('🎉 DATABASE TEST SUMMARY:');
  logger.info(`  - Connection: ${connectionWorks ? '✅ Working' : '❌ Failed'}`);
  logger.info(`  - Cars: ${cars.length} found`);
  logger.info(`  - Popular Cars: ${popularCars.length} found`);
  logger.info(`  - Reviews: ${reviews.length} found`);
  
  const isWorking = connectionWorks && cars.length > 0;
  logger.info(`  - Overall Status: ${isWorking ? '✅ READY TO GO!' : '⚠️ NEEDS ATTENTION'}`);
  
  return isWorking;
};
