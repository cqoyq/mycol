export default function (server, client) {

  server.route([
    {
      // Check if the index exists.
      path: '/api/mycol/indexs/table',
      method: 'GET',
      handler: async (req) => {
        const response = await client.indices.exists({
          index: server.app.indexsTableName,
        });
        return response;
      }
    },
    {
      // Create the index.
      path: '/api/mycol/indexs/table',
      method: 'POST',
      handler: async (req) => {
        const response = await client.indices.create({
          index: server.app.indexsTableName,
        });
        return response;
      }
    },
    {
      // Get the index-pattern in kibana.
      path: '/api/mycol/indexs/pattern',
      method: 'GET',
      handler: async (req) => {
        const response = await client.search({
          index: ".kibana_1",
          body: {
            "query": {
              "bool": {
                "must": [
                  {
                    "match_phrase": {
                      "type": "index-pattern"
                    }
                  }
                ]
              }
            },
            "_source": ["index-pattern.title"]
          }
        });
        return response;
      }
    },
    {
      // Get the number of document in index.
      path: '/api/mycol/indexs/doc/{indexName}',
      method: 'GET',
      handler: async (req) => {
        const response = await client.cat.count({
          index: req.params.indexName,
        });
        return response;
      }
    },
    {
      // Execute dsl search.
      path: '/api/mycol/indexs/dsl/{indexName}',
      method: 'PUT',
      handler: async (req) => {
        const response = await client.search({
          index: req.params.indexName,
          body: req.payload,
        });
        return response;
      }
    },
  ]);
}
