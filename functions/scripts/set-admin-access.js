/**
 * Script to set admin access for a user
 * Usage: 
 *   node set-admin-access.js <email> <action>
 *   node set-admin-access.js <action> <email>
 * 
 * Where:
 *   <email> is the user's email address
 *   <action> is either "promote" or "demote"
 * 
 * Environment:
 *   Set NODE_ENV=production for production environment
 *   Default is development (uses emulator)
 */

// Set default environment to development if not specified
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Extract arguments
let email = null;
let action = null;

// Get all arguments
const args = process.argv.slice(2);

// Check if we have any arguments
if (args.length === 0) {
  console.error('Usage: node set-admin-access.js <email> <action>');
  console.error('   or: node set-admin-access.js <action> <email>');
  process.exit(1);
}

// Try to identify which argument is which
for (const arg of args) {
  // Check if argument looks like an email
  if (arg.includes('@') && !email) {
    email = arg;
  } 
  // Check if argument is an action
  else if ((arg === 'promote' || arg === 'demote') && !action) {
    action = arg;
  }
}

// If we still don't have both, try to determine by position
if (!email || !action) {
  if (args.length >= 2) {
    // If first arg contains @ and second doesn't, assume email then action
    if (args[0].includes('@') && !args[1].includes('@')) {
      email = args[0];
      action = args[1].toLowerCase();
    } 
    // If second arg contains @ and first doesn't, assume action then email
    else if (!args[0].includes('@') && args[1].includes('@')) {
      action = args[0].toLowerCase();
      email = args[1];
    }
  }
}

// Validate we have both email and action
if (!email) {
  console.error('Error: Email is required and must contain "@"');
  console.error('Usage examples:');
  console.error('  node set-admin-access.js user@example.com promote');
  console.error('  node set-admin-access.js promote user@example.com');
  process.exit(1);
}

if (!action) {
  console.error('Error: Action is required (promote or demote)');
  process.exit(1);
}

// Validate action
if (action !== 'promote' && action !== 'demote') {
  console.error('Error: Action must be either "promote" or "demote"');
  process.exit(1);
}

// Import Firebase Admin SDK directly for the script
const admin = require('firebase-admin');

// Initialize admin based on environment
if (process.env.NODE_ENV === 'production') {
  // Use service account for production
  const serviceAccount = require('../walkmate-d42b4-firebase-adminsdk-fbsvc-909bb7fa19.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('Using production Firebase Admin SDK');
} else {
  // Use emulator for development
  admin.initializeApp({
    projectId: 'walkmate-d42b4'
  });
  
  // Connect to Auth Emulator
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
  console.log(`Using Firebase Auth Emulator at ${authEmulatorHost}`);
}

const auth = admin.auth();

async function setAdminAccess(email, action) {
  try {
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Attempting to ${action} user: ${email}`);
    
    // Get the user by email
    const user = await auth.getUserByEmail(email);
    
    // Get current custom claims
    const customClaims = user.customClaims || {};
    
    let updatedClaims;
    
    if (action === 'promote') {
      // Add admin claim while preserving existing claims
      updatedClaims = {
        ...customClaims,
        admin: true
      };
    } else {
      // Remove admin claim while preserving other claims
      const { admin: _, ...remainingClaims } = customClaims;
      updatedClaims = remainingClaims;
    }
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, updatedClaims);
    
    console.log(`Successfully ${action === 'promote' ? 'promoted' : 'demoted'} ${email}`);
    console.log('Custom claims:', updatedClaims);
    
    // Force token refresh
    console.log('Note: The user will need to sign out and sign back in for the changes to take effect.');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error ${action === 'promote' ? 'promoting' : 'demoting'} user:`, error);
    process.exit(1);
  }
}

setAdminAccess(email, action);
