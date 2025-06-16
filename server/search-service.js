// server/search-service.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function textSearch(query, filters = {}, forcedFileStorage = false) {
  try {
    // Check if we're using file-based storage
    const flagPath = path.join(__dirname, 'data', 'using-file-storage.flag');
    if (forcedFileStorage || fs.existsSync(flagPath)) {
      console.log('Using file-based storage for text search');
      
      // Read analysis results from file
      const analysisPath = path.join(__dirname, 'data', 'analysis_results.json');
      if (!fs.existsSync(analysisPath)) {
        return [];
      }
      
      try {
        const allResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
        if (!Array.isArray(allResults)) return [];
        
        // Simple text search implementation for file-based storage
        return allResults
          .filter(item => {
            // Text search
            const searchText = `${item.location || ''} ${item.description || ''}`.toLowerCase();
            const matches = query.toLowerCase().split(' ').every(word => searchText.includes(word));
            
            // Apply filters
            const filtersMatch = Object.entries(filters).every(([key, value]) => 
              item[key] === value
            );
            
            return matches && filtersMatch;
          })
          .slice(0, 20);
      } catch (err) {
        console.error('Error reading analysis results for search:', err);
        return [];
      }
    }
    
    // If not using file storage, use MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    const searchQuery = {
      $search: {
        index: "environmental_text_index",
        text: {
          query: query,
          path: ["location", "description"]
        }
      }
    };
    
    if (Object.keys(filters).length > 0) {
      searchQuery.$search.filter = {
        compound: {
          must: Object.entries(filters).map(([key, value]) => ({
            equals: { path: key, value }
          }))
        }
      };
    }
    
    const results = await db.collection('analysis_results')
      .aggregate([searchQuery, { $limit: 20 }])
      .toArray();
      
    await client.close();
    return results;
  } catch (error) {
    console.error('Error performing text search:', error);
    throw error;
  }
}

async function findSimilarPatterns(pm25, pm10, temperature, forcedFileStorage = false) {
  try {
    // Create a simple embedding (for production, use a proper embedding model)
    const simpleVector = [
      pm25 / 100,  // Normalize to 0-1 range
      pm10 / 200,  // Normalize to 0-1 range
      (temperature + 20) / 60  // Normalize from -20 to 40 range to 0-1
    ];
    
    // Check if we're using file-based storage
    const flagPath = path.join(__dirname, 'data', 'using-file-storage.flag');
    if (forcedFileStorage || fs.existsSync(flagPath)) {
      console.log('Using file-based storage for vector search');
      
      // Read analysis results from file
      const analysisPath = path.join(__dirname, 'data', 'analysis_results.json');
      if (!fs.existsSync(analysisPath)) {
        return [];
      }
      
      try {
        const allResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
        if (!Array.isArray(allResults)) return [];
        
        // Simple vector similarity calculation using Euclidean distance
        return allResults
          .map(item => {
            if (!item.environmentalVector || !Array.isArray(item.environmentalVector)) {
              return { ...item, similarity: 0 };
            }
            
            // Calculate Euclidean distance
            const distance = Math.sqrt(
              Math.pow(simpleVector[0] - item.environmentalVector[0], 2) +
              Math.pow(simpleVector[1] - item.environmentalVector[1], 2) +
              Math.pow(simpleVector[2] - item.environmentalVector[2], 2)
            );
            
            // Convert distance to similarity (inverse)
            const similarity = 1 / (1 + distance);
            
            return { ...item, similarity };
          })
          .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (descending)
          .slice(0, 10); // Limit to 10 results
      } catch (err) {
        console.error('Error reading analysis results for vector search:', err);
        return [];
      }
    }
    
    // If not using file storage, use MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    const results = await db.collection('analysis_results')
      .aggregate([
        {
          $vectorSearch: {
            index: "environmental_vector_index",
            path: "environmentalVector",
            queryVector: simpleVector,
            numCandidates: 100,
            limit: 10
          }
        }
      ])
      .toArray();
    
    await client.close();
    return results;
  } catch (error) {
    console.error('Error finding similar patterns:', error);
    throw error;
  }
}

// Function to generate vector embeddings for environmental data
async function generateEmbeddings(data) {
  // Simple vector embedding generation
  // In a production app, you'd use a proper embedding model
  return [
    data.pm25 / 100,
    data.pm10 / 200,
    (data.temperature + 20) / 60
  ];
}

module.exports = { textSearch, findSimilarPatterns, generateEmbeddings };
