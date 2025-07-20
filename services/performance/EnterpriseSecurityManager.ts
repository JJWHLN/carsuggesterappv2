/**
 * Enterprise Security Manager
 * 
 * Phase 2 Week 8 - Performance Optimization & Advanced Features
 * 
 * Features:
 * - Advanced authentication and authorization
 * - Data encryption and protection
 * - Security audit logging
 * - Threat detection and prevention
 * - Compliance management
 * - Security monitoring and alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enforcement: 'strict' | 'permissive' | 'audit_only';
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'compliance';
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'audit' | 'encrypt' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'security_violation' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  details: Record<string, any>;
  remediation?: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export interface ThreatDetection {
  id: string;
  type: 'brute_force' | 'sql_injection' | 'xss' | 'csrf' | 'data_exfiltration' | 'anomalous_behavior';
  confidence: number;
  riskScore: number;
  indicators: ThreatIndicator[];
  timestamp: number;
  source: string;
  mitigated: boolean;
  mitigationActions: string[];
}

export interface ThreatIndicator {
  type: string;
  value: string;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  count: number;
}

export interface EncryptionConfig {
  algorithm: 'AES-256' | 'ChaCha20' | 'RSA-4096';
  keyDerivation: 'PBKDF2' | 'Argon2' | 'scrypt';
  keySize: number;
  iterations: number;
  saltSize: number;
}

export interface ComplianceFramework {
  name: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'ISO27001';
  requirements: ComplianceRequirement[];
  status: 'compliant' | 'non_compliant' | 'partial' | 'unknown';
  lastAssessment: number;
  nextAssessment: number;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  evidence: string[];
  lastReview: number;
  reviewer: string;
}

export interface SecurityAudit {
  id: string;
  type: 'access' | 'data_modification' | 'configuration_change' | 'security_event';
  userId: string;
  resource: string;
  action: string;
  timestamp: number;
  success: boolean;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface SecurityAlert {
  id: string;
  type: 'policy_violation' | 'threat_detected' | 'anomaly' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  actions: string[];
}

export interface UserPermissions {
  userId: string;
  roles: string[];
  permissions: string[];
  dataAccess: DataAccessPermissions;
  restrictions: UserRestrictions;
  expiresAt?: number;
}

export interface DataAccessPermissions {
  canRead: string[];
  canWrite: string[];
  canDelete: string[];
  canExport: string[];
  restrictions: DataRestriction[];
}

export interface DataRestriction {
  field: string;
  condition: string;
  value: any;
}

export interface UserRestrictions {
  ipWhitelist?: string[];
  timeRestrictions?: TimeRestriction[];
  locationRestrictions?: string[];
  deviceRestrictions?: string[];
  maxSessions?: number;
  sessionTimeout?: number;
}

export interface TimeRestriction {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timezone: string;
}

export class EnterpriseSecurityManager {
  private static instance: EnterpriseSecurityManager | null = null;
  private readonly STORAGE_KEY = '@security_data';
  private readonly AUDIT_LOG_KEY = '@security_audit';
  private readonly THREAT_DB_KEY = '@threat_indicators';
  
  private securityPolicies: SecurityPolicy[] = [];
  private auditLog: SecurityAudit[] = [];
  private threatIndicators: ThreatIndicator[] = [];
  private securityEvents: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private userPermissions: Map<string, UserPermissions> = new Map();
  
  private readonly encryptionConfig: EncryptionConfig = {
    algorithm: 'AES-256',
    keyDerivation: 'PBKDF2',
    keySize: 256,
    iterations: 100000,
    saltSize: 32
  };
  
  private monitoringEnabled: boolean = true;
  private threatDetectionEnabled: boolean = true;
  private auditingEnabled: boolean = true;

  private constructor() {
    this.initialize();
  }

  static getInstance(): EnterpriseSecurityManager {
    if (!EnterpriseSecurityManager.instance) {
      EnterpriseSecurityManager.instance = new EnterpriseSecurityManager();
    }
    return EnterpriseSecurityManager.instance;
  }

  // Initialize security manager
  async initialize(): Promise<void> {
    try {
      await this.loadSecurityData();
      await this.initializeDefaultPolicies();
      this.startSecurityMonitoring();
      
      console.log('Enterprise Security Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Security Manager:', error);
    }
  }

  // Authentication and Authorization
  async authenticate(credentials: { email: string; password: string }): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      // Audit authentication attempt
      await this.auditAction({
        type: 'access',
        userId: credentials.email,
        resource: 'authentication',
        action: 'login_attempt',
        timestamp: Date.now(),
        success: false,
        details: { email: credentials.email }
      });
      
      // Check for brute force attempts
      if (await this.detectBruteForce(credentials.email)) {
        await this.createAlert({
          type: 'threat_detected',
          severity: 'high',
          title: 'Brute Force Attack Detected',
          description: `Multiple failed login attempts for user ${credentials.email}`,
          timestamp: Date.now(),
          acknowledged: false,
          resolved: false,
          actions: ['block_user', 'require_2fa', 'notify_admin']
        });
        
        return { success: false, error: 'Account temporarily locked due to security concerns' };
      }
      
      // Perform authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) {
        await this.auditAction({
          type: 'access',
          userId: credentials.email,
          resource: 'authentication',
          action: 'login_failed',
          timestamp: Date.now(),
          success: false,
          details: { error: error.message }
        });
        
        return { success: false, error: error.message };
      }
      
      // Successful authentication
      await this.auditAction({
        type: 'access',
        userId: data.user?.id || credentials.email,
        resource: 'authentication',
        action: 'login_success',
        timestamp: Date.now(),
        success: true,
        details: { userId: data.user?.id }
      });
      
      return { 
        success: true, 
        user: data.user, 
        token: data.session?.access_token 
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Check user permissions
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const permissions = this.userPermissions.get(userId);
      if (!permissions) {
        await this.createSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          source: 'permission_check',
          target: resource,
          userId,
          timestamp: Date.now(),
          details: { action, resource, reason: 'no_permissions_found' },
          status: 'new'
        });
        return false;
      }
      
      // Check role-based permissions
      const hasPermission = this.evaluatePermissions(permissions, resource, action);
      
      // Audit permission check
      await this.auditAction({
        type: 'access',
        userId,
        resource,
        action: `check_permission_${action}`,
        timestamp: Date.now(),
        success: hasPermission,
        details: { permissions: permissions.permissions, roles: permissions.roles }
      });
      
      if (!hasPermission) {
        await this.createSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          source: 'permission_check',
          target: resource,
          userId,
          timestamp: Date.now(),
          details: { action, resource, reason: 'insufficient_permissions' },
          status: 'new'
        });
      }
      
      return hasPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Encrypt sensitive data
  async encryptData(data: string, key?: string): Promise<string> {
    try {
      // Simple encryption simulation - in production, use proper crypto library
      const encryptionKey = key || await this.getEncryptionKey();
      const encrypted = this.simpleEncrypt(data, encryptionKey);
      
      await this.auditAction({
        type: 'access',
        userId: 'system',
        resource: 'encryption',
        action: 'encrypt_data',
        timestamp: Date.now(),
        success: true,
        details: { dataLength: data.length, algorithm: this.encryptionConfig.algorithm }
      });
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  // Decrypt sensitive data
  async decryptData(encryptedData: string, key?: string): Promise<string> {
    try {
      const decryptionKey = key || await this.getEncryptionKey();
      const decrypted = this.simpleDecrypt(encryptedData, decryptionKey);
      
      await this.auditAction({
        type: 'access',
        userId: 'system',
        resource: 'encryption',
        action: 'decrypt_data',
        timestamp: Date.now(),
        success: true,
        details: { dataLength: encryptedData.length, algorithm: this.encryptionConfig.algorithm }
      });
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // Create security policy
  async createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newPolicy: SecurityPolicy = {
        ...policy,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      this.securityPolicies.push(newPolicy);
      await this.saveSecurityData();
      
      await this.auditAction({
        type: 'configuration_change',
        userId: 'admin',
        resource: 'security_policy',
        action: 'create',
        timestamp: Date.now(),
        success: true,
        details: { policyId: newPolicy.id, policyName: newPolicy.name }
      });
      
      console.log(`Security policy ${newPolicy.name} created`);
      return newPolicy.id;
    } catch (error) {
      console.error('Error creating security policy:', error);
      throw error;
    }
  }

  // Detect and analyze threats
  async detectThreats(data: Record<string, any>): Promise<ThreatDetection[]> {
    if (!this.threatDetectionEnabled) return [];
    
    const threats: ThreatDetection[] = [];
    
    try {
      // SQL Injection detection
      if (this.detectSQLInjection(data)) {
        threats.push({
          id: this.generateId(),
          type: 'sql_injection',
          confidence: 0.85,
          riskScore: 8,
          indicators: [
            {
              type: 'pattern',
              value: 'sql_injection_pattern',
              confidence: 0.85,
              firstSeen: Date.now(),
              lastSeen: Date.now(),
              count: 1
            }
          ],
          timestamp: Date.now(),
          source: 'user_input',
          mitigated: false,
          mitigationActions: ['sanitize_input', 'block_request']
        });
      }
      
      // XSS detection
      if (this.detectXSS(data)) {
        threats.push({
          id: this.generateId(),
          type: 'xss',
          confidence: 0.78,
          riskScore: 7,
          indicators: [
            {
              type: 'script_tag',
              value: 'script_in_input',
              confidence: 0.78,
              firstSeen: Date.now(),
              lastSeen: Date.now(),
              count: 1
            }
          ],
          timestamp: Date.now(),
          source: 'user_input',
          mitigated: false,
          mitigationActions: ['escape_html', 'validate_input']
        });
      }
      
      // Anomalous behavior detection
      const anomaly = await this.detectAnomalousBehavior(data);
      if (anomaly) {
        threats.push(anomaly);
      }
      
      // Process detected threats
      for (const threat of threats) {
        await this.processThreat(threat);
      }
      
      return threats;
    } catch (error) {
      console.error('Error detecting threats:', error);
      return [];
    }
  }

  // Get security compliance status
  async getComplianceStatus(): Promise<ComplianceFramework[]> {
    try {
      // Mock compliance frameworks - in production, implement actual compliance checks
      const frameworks: ComplianceFramework[] = [
        {
          name: 'GDPR',
          requirements: [
            {
              id: 'gdpr_consent',
              title: 'User Consent Management',
              description: 'Obtain and manage user consent for data processing',
              category: 'data_protection',
              status: 'met',
              evidence: ['consent_forms', 'audit_logs'],
              lastReview: Date.now() - 7 * 24 * 60 * 60 * 1000,
              reviewer: 'compliance_officer'
            }
          ],
          status: 'compliant',
          lastAssessment: Date.now() - 30 * 24 * 60 * 60 * 1000,
          nextAssessment: Date.now() + 90 * 24 * 60 * 60 * 1000
        },
        {
          name: 'ISO27001',
          requirements: [
            {
              id: 'iso_access_control',
              title: 'Access Control Management',
              description: 'Implement proper access controls and user management',
              category: 'access_control',
              status: 'partial',
              evidence: ['access_logs', 'user_reviews'],
              lastReview: Date.now() - 14 * 24 * 60 * 60 * 1000,
              reviewer: 'security_team'
            }
          ],
          status: 'partial',
          lastAssessment: Date.now() - 60 * 24 * 60 * 60 * 1000,
          nextAssessment: Date.now() + 120 * 24 * 60 * 60 * 1000
        }
      ];
      
      return frameworks;
    } catch (error) {
      console.error('Error getting compliance status:', error);
      return [];
    }
  }

  // Get security audit logs
  getAuditLogs(filters?: {
    userId?: string;
    type?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): SecurityAudit[] {
    let logs = [...this.auditLog];
    
    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.type) {
        logs = logs.filter(log => log.type === filters.type);
      }
      
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get security alerts
  getSecurityAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): SecurityAlert[] {
    let alerts = [...this.alerts];
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  // Acknowledge security alert
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
      }
      
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = Date.now();
      
      await this.saveSecurityData();
      
      await this.auditAction({
        type: 'security_event',
        userId,
        resource: 'security_alert',
        action: 'acknowledge',
        timestamp: Date.now(),
        success: true,
        details: { alertId, alertType: alert.type }
      });
      
      console.log(`Alert ${alertId} acknowledged by ${userId}`);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Generate security report
  async generateSecurityReport(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<{
    summary: Record<string, number>;
    threats: ThreatDetection[];
    alerts: SecurityAlert[];
    compliance: ComplianceFramework[];
    recommendations: string[];
  }> {
    try {
      const now = Date.now();
      const timeframes = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const since = now - timeframes[timeframe];
      
      // Filter data by timeframe
      const recentEvents = this.securityEvents.filter(e => e.timestamp >= since);
      const recentAlerts = this.alerts.filter(a => a.timestamp >= since);
      const recentAudits = this.auditLog.filter(a => a.timestamp >= since);
      
      // Calculate summary statistics
      const summary = {
        totalEvents: recentEvents.length,
        criticalAlerts: recentAlerts.filter(a => a.severity === 'critical').length,
        highAlerts: recentAlerts.filter(a => a.severity === 'high').length,
        mediumAlerts: recentAlerts.filter(a => a.severity === 'medium').length,
        lowAlerts: recentAlerts.filter(a => a.severity === 'low').length,
        resolvedAlerts: recentAlerts.filter(a => a.resolved).length,
        auditEntries: recentAudits.length,
        failedAuthentications: recentAudits.filter(a => 
          a.action === 'login_failed' || a.action === 'login_attempt'
        ).length,
        policyViolations: recentEvents.filter(e => e.type === 'security_violation').length
      };
      
      // Get compliance status
      const compliance = await this.getComplianceStatus();
      
      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(summary, recentEvents);
      
      return {
        summary,
        threats: [], // Would include actual threat detections
        alerts: recentAlerts,
        compliance,
        recommendations
      };
    } catch (error) {
      console.error('Error generating security report:', error);
      throw error;
    }
  }

  // Private methods

  private async loadSecurityData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.securityPolicies = data.policies || [];
        this.securityEvents = data.events || [];
        this.alerts = data.alerts || [];
      }
      
      const auditStored = await AsyncStorage.getItem(this.AUDIT_LOG_KEY);
      if (auditStored) {
        this.auditLog = JSON.parse(auditStored);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  }

  private async saveSecurityData(): Promise<void> {
    try {
      const data = {
        policies: this.securityPolicies,
        events: this.securityEvents.slice(-1000), // Keep last 1000 events
        alerts: this.alerts.slice(-500) // Keep last 500 alerts
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      // Save audit log separately due to size
      await AsyncStorage.setItem(
        this.AUDIT_LOG_KEY, 
        JSON.stringify(this.auditLog.slice(-2000)) // Keep last 2000 audit entries
      );
    } catch (error) {
      console.error('Error saving security data:', error);
    }
  }

  private async initializeDefaultPolicies(): Promise<void> {
    if (this.securityPolicies.length === 0) {
      const defaultPolicies: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Strong Authentication',
          description: 'Enforce strong password requirements and MFA',
          rules: [
            {
              id: 'pwd_complexity',
              name: 'Password Complexity',
              condition: 'password_length >= 8 AND contains_uppercase AND contains_number',
              action: 'audit',
              severity: 'high'
            }
          ],
          enforcement: 'strict',
          category: 'authentication',
          enabled: true
        },
        {
          name: 'Data Protection',
          description: 'Protect sensitive data with encryption and access controls',
          rules: [
            {
              id: 'encrypt_pii',
              name: 'Encrypt PII',
              condition: 'data_type == "PII"',
              action: 'encrypt',
              severity: 'critical'
            }
          ],
          enforcement: 'strict',
          category: 'data_protection',
          enabled: true
        }
      ];
      
      for (const policy of defaultPolicies) {
        await this.createSecurityPolicy(policy);
      }
    }
  }

  private startSecurityMonitoring(): void {
    if (!this.monitoringEnabled) return;
    
    // Monitor every 5 minutes
    setInterval(async () => {
      await this.performSecurityCheck();
    }, 5 * 60 * 1000);
  }

  private async performSecurityCheck(): Promise<void> {
    try {
      // Check for suspicious patterns
      await this.checkSuspiciousActivity();
      
      // Validate security policies
      await this.validateSecurityPolicies();
      
      // Clean up old data
      await this.cleanupOldData();
    } catch (error) {
      console.error('Error during security check:', error);
    }
  }

  private async checkSuspiciousActivity(): Promise<void> {
    // Check for multiple failed logins
    const recentFailedLogins = this.auditLog.filter(entry => 
      entry.action === 'login_failed' && 
      Date.now() - entry.timestamp < 60 * 60 * 1000 // Last hour
    );
    
    if (recentFailedLogins.length > 5) {
      await this.createAlert({
        type: 'anomaly',
        severity: 'medium',
        title: 'Suspicious Login Activity',
        description: `${recentFailedLogins.length} failed login attempts in the last hour`,
        timestamp: Date.now(),
        acknowledged: false,
        resolved: false,
        actions: ['investigate', 'monitor']
      });
    }
  }

  private async validateSecurityPolicies(): Promise<void> {
    for (const policy of this.securityPolicies) {
      if (policy.enabled && policy.enforcement === 'strict') {
        // Validate policy compliance
        const violations = await this.checkPolicyViolations(policy);
        
        if (violations.length > 0) {
          await this.createAlert({
            type: 'policy_violation',
            severity: 'high',
            title: `Policy Violation: ${policy.name}`,
            description: `${violations.length} violations detected for policy ${policy.name}`,
            timestamp: Date.now(),
            acknowledged: false,
            resolved: false,
            actions: ['review_policy', 'investigate_violations']
          });
        }
      }
    }
  }

  private async checkPolicyViolations(policy: SecurityPolicy): Promise<any[]> {
    // Mock policy violation check - in production, implement actual checks
    return [];
  }

  private async cleanupOldData(): Promise<void> {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Clean up old events
    this.securityEvents = this.securityEvents.filter(e => e.timestamp > thirtyDaysAgo);
    
    // Clean up old audit logs (keep for longer period)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    this.auditLog = this.auditLog.filter(a => a.timestamp > ninetyDaysAgo);
    
    await this.saveSecurityData();
  }

  private async detectBruteForce(email: string): Promise<boolean> {
    const recentAttempts = this.auditLog.filter(entry => 
      entry.userId === email &&
      entry.action === 'login_failed' &&
      Date.now() - entry.timestamp < 15 * 60 * 1000 // Last 15 minutes
    );
    
    return recentAttempts.length >= 5;
  }

  private evaluatePermissions(permissions: UserPermissions, resource: string, action: string): boolean {
    // Check direct permissions
    const permissionKey = `${resource}:${action}`;
    if (permissions.permissions.includes(permissionKey)) {
      return true;
    }
    
    // Check role-based permissions
    for (const role of permissions.roles) {
      if (this.roleHasPermission(role, resource, action)) {
        return true;
      }
    }
    
    return false;
  }

  private roleHasPermission(role: string, resource: string, action: string): boolean {
    // Mock role permission check - in production, implement proper RBAC
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*:*'],
      'user': ['cars:read', 'reviews:read', 'favorites:write'],
      'dealer': ['cars:write', 'reviews:read', 'listings:write']
    };
    
    const permissions = rolePermissions[role] || [];
    return permissions.includes('*:*') || permissions.includes(`${resource}:${action}`);
  }

  private async getEncryptionKey(): Promise<string> {
    // In production, use proper key management
    return 'mock_encryption_key_256_bits_long';
  }

  private simpleEncrypt(data: string, key: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  private simpleDecrypt(encryptedData: string, key: string): string {
    // Simple XOR decryption for demo
    const data = atob(encryptedData);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  private detectSQLInjection(data: Record<string, any>): boolean {
    const sqlPatterns = [
      /('|(\\')|(;)|(\")|(\#)|(--)|(\*)|(\|)|(\\\\))/i,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i
    ];
    
    const dataString = JSON.stringify(data).toLowerCase();
    return sqlPatterns.some(pattern => pattern.test(dataString));
  }

  private detectXSS(data: Record<string, any>): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:|vbscript:|data:/gi,
      /on\w+\s*=/gi
    ];
    
    const dataString = JSON.stringify(data);
    return xssPatterns.some(pattern => pattern.test(dataString));
  }

  private async detectAnomalousBehavior(data: Record<string, any>): Promise<ThreatDetection | null> {
    // Mock anomaly detection - in production, use ML-based detection
    const randomRisk = Math.random();
    
    if (randomRisk > 0.9) {
      return {
        id: this.generateId(),
        type: 'anomalous_behavior',
        confidence: randomRisk,
        riskScore: Math.floor(randomRisk * 10),
        indicators: [
          {
            type: 'behavioral_anomaly',
            value: 'unusual_access_pattern',
            confidence: randomRisk,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            count: 1
          }
        ],
        timestamp: Date.now(),
        source: 'behavior_analysis',
        mitigated: false,
        mitigationActions: ['monitor', 'investigate']
      };
    }
    
    return null;
  }

  private async processThreat(threat: ThreatDetection): Promise<void> {
    // Create security event
    await this.createSecurityEvent({
      type: 'threat_detected',
      severity: threat.riskScore > 7 ? 'critical' : threat.riskScore > 5 ? 'high' : 'medium',
      source: 'threat_detection',
      target: threat.source,
      timestamp: threat.timestamp,
      details: { threat },
      status: 'new'
    });
    
    // Create alert if high risk
    if (threat.riskScore > 6) {
      await this.createAlert({
        type: 'threat_detected',
        severity: threat.riskScore > 8 ? 'critical' : 'high',
        title: `${threat.type.toUpperCase()} Threat Detected`,
        description: `High-risk ${threat.type} threat detected with confidence ${threat.confidence}`,
        timestamp: threat.timestamp,
        acknowledged: false,
        resolved: false,
        actions: threat.mitigationActions
      });
    }
  }

  private async auditAction(audit: Omit<SecurityAudit, 'id'>): Promise<void> {
    if (!this.auditingEnabled) return;
    
    const auditEntry: SecurityAudit = {
      ...audit,
      id: this.generateId()
    };
    
    this.auditLog.push(auditEntry);
    
    // Keep audit log size manageable
    if (this.auditLog.length > 5000) {
      this.auditLog = this.auditLog.slice(-3000);
    }
  }

  private async createSecurityEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateId()
    };
    
    this.securityEvents.push(securityEvent);
    await this.saveSecurityData();
  }

  private async createAlert(alert: Omit<SecurityAlert, 'id'>): Promise<void> {
    const securityAlert: SecurityAlert = {
      ...alert,
      id: this.generateId()
    };
    
    this.alerts.push(securityAlert);
    await this.saveSecurityData();
    
    console.log(`Security alert created: ${alert.title} (${alert.severity})`);
  }

  private generateSecurityRecommendations(
    summary: Record<string, number>, 
    events: SecurityEvent[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (summary.failedAuthentications > 10) {
      recommendations.push('Implement account lockout policies to prevent brute force attacks');
    }
    
    if (summary.criticalAlerts > 0) {
      recommendations.push('Review and address all critical security alerts immediately');
    }
    
    if (summary.policyViolations > 5) {
      recommendations.push('Review security policies and ensure proper enforcement');
    }
    
    const authEvents = events.filter(e => e.type === 'authentication');
    if (authEvents.length > 100) {
      recommendations.push('Consider implementing multi-factor authentication');
    }
    
    return recommendations;
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default EnterpriseSecurityManager;
