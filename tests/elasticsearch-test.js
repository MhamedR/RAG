const { Client } = require('@elastic/elasticsearch');

// Create an Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
  tls: {
    rejectUnauthorized: false, // Only for testing, not recommended for production
  },
});

// Test the connection
async function testElasticsearchConnection() {
  try {
    // Check if Elasticsearch is running
    const info = await client.info();
    console.log('Elasticsearch cluster info:');
    console.log(`Cluster name: ${info.cluster_name}`);
    console.log(`Cluster version: ${info.version.number}`);
    console.log('✅ Elasticsearch connection successful!');
    
    // Test if we can create a test index with vector capabilities
    try {
      // Create a test index with vector field
      const indexName = 'vector-test-' + Date.now();
      await client.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              embedding: { 
                type: 'dense_vector',
                dims: 3,
                index: true,
                similarity: 'cosine'
              }
            }
          }
        }
      });
      
      console.log(`✅ Test index "${indexName}" created successfully with vector capabilities`);
      
      // Clean up by deleting the test index
      await client.indices.delete({ index: indexName });
      console.log(`✅ Test index "${indexName}" deleted successfully`);
    } catch (error) {
      console.error('❌ Vector test failed:', error.message);
      console.error('Dense vector fields might not be properly configured');
    }
  } catch (error) {
    console.error('❌ Elasticsearch connection error:', error.message);
    if (error.meta && error.meta.body) {
      console.error('Error details:', JSON.stringify(error.meta.body, null, 2));
    }
  } finally {
    // Close the connection
    await client.close();
  }
}

// Run the test
testElasticsearchConnection(); 