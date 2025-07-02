#!/usr/bin/env node

/**
 * Backfill Embeddings Script
 * 
 * This script finds posts in Firestore that don't have embeddings
 * and generates them using OpenAI's text-embedding-ada-002 model.
 * 
 * Usage: node scripts/backfill-embeddings.js
 */

const admin = require('firebase-admin');
const OpenAI = require('openai');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID ,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = admin.firestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate OpenAI embedding with retry logic
 */
async function generateEmbedding(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text.trim(),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for text: "${text.substring(0, 50)}..."`);
      console.error(error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Check if a post needs an embedding
 */
function needsEmbedding(post) {
  return !post.embedding || 
         !Array.isArray(post.embedding) || 
         post.embedding.length === 0 ||
         post.embedding.every(val => val === 0);
}

/**
 * Generate combined text for embedding
 */
function getCombinedText(post) {
  const title = post.title || '';
  const description = post.description || '';
  const address = post.address || '';
  
  return `${title}\n${description}\n${address}`.trim();
}

/**
 * Main backfill function
 */
async function backfillEmbeddings() {
  console.log('🚀 Starting embedding backfill process...\n');
  
  try {
    // Get all posts
    console.log('📋 Fetching all posts from Firestore...');
    const postsSnapshot = await db.collection('posts').get();
    const totalPosts = postsSnapshot.size;
    console.log(`Found ${totalPosts} total posts\n`);
    
    // Filter posts that need embeddings
    const postsToUpdate = [];
    postsSnapshot.forEach(doc => {
      const post = { id: doc.id, ...doc.data() };
      if (needsEmbedding(post)) {
        postsToUpdate.push(post);
      }
    });
    
    console.log(`🔍 Found ${postsToUpdate.length} posts that need embeddings\n`);
    
    if (postsToUpdate.length === 0) {
      console.log('✅ All posts already have embeddings! Nothing to do.');
      return;
    }
    
    // Process each post
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < postsToUpdate.length; i++) {
      const post = postsToUpdate[i];
      const progress = `[${i + 1}/${postsToUpdate.length}]`;
      
      try {
        console.log(`${progress} Processing post ${post.id}...`);
        
        // Generate combined text
        const combinedText = getCombinedText(post);
        if (!combinedText.trim()) {
          console.log(`${progress} ⚠️  Skipping post ${post.id} - no text content`);
          continue;
        }
        
        console.log(`${progress} Generating embedding for: "${combinedText.substring(0, 100)}..."`);
        
        // Generate embedding
        const embedding = await generateEmbedding(combinedText);
        
        // Update post in Firestore
        await db.collection('posts').doc(post.id).update({
          embedding: embedding,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        successCount++;
        console.log(`${progress} ✅ Successfully updated post ${post.id} (embedding length: ${embedding.length})\n`);
        
        // Add small delay to avoid rate limiting
        if (i < postsToUpdate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        errorCount++;
        console.error(`${progress} ❌ Failed to update post ${post.id}:`);
        console.error(error.message);
        console.log(''); // Empty line for readability
      }
    }
    
    // Summary
    console.log('\n🎉 Backfill process completed!');
    console.log(`✅ Successfully updated: ${successCount} posts`);
    console.log(`❌ Failed to update: ${errorCount} posts`);
    console.log(`📊 Total processed: ${successCount + errorCount} posts`);
    
  } catch (error) {
    console.error('💥 Fatal error during backfill process:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  backfillEmbeddings()
    .then(() => {
      console.log('\n👋 Backfill script finished. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillEmbeddings }; 