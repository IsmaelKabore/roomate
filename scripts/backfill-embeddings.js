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
      projectId: process.env.FIREBASE_PROJECT_ID || "roomate-64dcb",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@roomate-64dcb.iam.gserviceaccount.com",
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD02yVqFYvt0adk\na8bpFlsuopEFH9XMCUfFHaX08giYq1YrZEXLo0rh4njslcAyd804Tsf+gkn19WDc\nSSmSP1B3iSyoUUCD/iC1Fl91EOEy5WEEmC3698x+FKFKyfRGFLS6G8tbBOcsBliw\nUJP7/nlcOYBSqTLrikLYJEVnsiMSs/K/fIh0Nt/1ykmON/lRJhYugPmkUkqd2rVC\nBChidfjdncUc4NCEgs72A4wuPhnu7nlthbLU/LjXkwgT/clrwzdMSC/mbBtyoUNc\nb1JApbSRsc/D+ooF7qqqpXgSgafbchIiZSR2fguNFYreLGn0mib56Zp6THjtVN2x\ntzZGnWYlAgMBAAECggEACQqekxBAnoODXt3r9mdw7oPqPvox9trQ36J8olLdpmWN\nRQTq3t4kwbqPJI1TD4oE9fNSxz8gZAivjvLUqiXUXtWd5Ik7jKQxqP4ugDAjYLG/\np1/HMuE7l9xDKHPUpVHWapjkJXRE5QdG9xvCmyeGa7Vj26mLy87LMRgFyBJ34RTZ\nf9JYlfoB9Vu1c6l8Wk9B6mEP0XfnYJS+SmNs6Af+tpulIJcYsVeUQnPMmnNw39v/\nvZhSm7j6uUnydeQidzWqny3Dj44Vo4h3ekeU8XLt9T0JH85G0K2z1qLgMJ8RePSz\n5o1ZXNGucPJ/gq44vwbbrlot7tfhH8iyir6EeLgxAQKBgQD+SvVo0/stXgRkBLWO\nihg3gev96wb3E2LNHXAYgSApnbbM5mDjpUNEYawDjBZuRHvxCy4WYxrlLZ6mWrL+\nVm46MCWTGvBoLB9AANP8zvDO6BQASVVskWmv/qeRPrURhG4UBTeQp435ARE6OYjy\ngb2+3iVKHMbkL+CMzmOtkcbh1QKBgQD2f/gPFtx/db7UQUPKbdARRyLtEcKP/6ph\nQL9MBg2V2a0G/3e/+Qfww7o5sPXPtO76dqVyjJVnGZe9j/kW5RR6RSOXk+C0X6xu\ni4VppVfec4+YzhEpaeLcl9EsRox4t69GIG5Tr02qLSJPP790Wsin3+hALYPkU3n+\nb0YTk8NLEQKBgQDNO3g3Y6a75b5LbtWNNfz3h58MbsxPStEZ1GFtFYH8tHIdiu21\nrOLOZLnsnvpXgmQ5lZlbrh69yoTZpCgER4Ns6QDaagqPONT71e9BgU8u3nWOCaGt\nHusahL9+5QpEGgqxk8hVsjVOO0NJJ7hUaMvYKPgViYYoEk/7tHMUWawXBQKBgHlD\nGtTRekd5tRbVxHOg8eqOBDB7vCr6quaM446Sq7w8CVKX+mEGMVHP95zJ4SL871Nn\napyfbB/8BxnJ6c/Jgflkac33gWM6bak0Gb2PCVr1nn6dYPPukxvR06TkT9ZTBnaJ\nHb0tUBeXfHlf8t9aibuL+sUXnvqD1k/EjcSzvC8BAoGAH22uqWMXKF1D9eO9Ruzc\nIx/CD8PZkTcmqfS5MtstWWEiCGdSBgZ1APKpVa3TP6ZZdB2WRZnwfT7jUc+HMdYd\ngvcVQlNjXggWE2okD3VA29HX5Pv9ZK6Ej0m2lf7yfJ3N8ABgV81DK68x3giMTjj0\nf/ribrpp4higS881I/zspSM=\n-----END PRIVATE KEY-----").replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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"
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