var http = require('http');
// var querystring = require('querystring');
export default function (server, client) {

  server.app.schedule = require('node-schedule');
  server.app.jobs = [];
  server.app.getJob = (taskid) => {
    let ar = server.app.jobs.filter((item) => {
      return (item.taskid == taskid) ? true : false;
    });
    if (ar.length == 1)
      return ar[0];
    else
      return null;
  };
  server.app.makeWebHookBody = (taskid, data) => {
    let body = {
      taskid: taskid,
      datetime: new Date().toLocaleString(),
      data: data
    };
    return body;
  }
  server.app.executeWebHook = (hostname, port, path, body) => {
    // var postData = querystring.stringify(body);
    var postData = `${JSON.stringify(body)}`;

    var options = {
      hostname: hostname,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    var req = http.request(options, (res) => {
      // console.log(`STATUS: ${res.statusCode}`);
      // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        // console.log(`BODY: ${chunk}`);
      });
      res.on('end', () => {
        // console.log('No more data in response.');
      });
    });

    req.on('error', (e) => {
      // console.log(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
  }
  server.app.executeTask = async (job) => {
    // console.log(new Date().toLocaleString() + ',id:' + job.taskid + ",name:" + job.source.name);
    const id = job.taskid;
    const doc = job.source;

    const indexPattern = doc.indexPattern;
    const dsl = doc.dsl;

    const payload = await client.search({
      index: indexPattern,
      body: dsl,
    });

    let conditionOk = false;      // If the conditionOk is true, then call action.
    let conditionData = {};       // When the conditionOK is true,  the action will send conditionData.
    {
      eval(doc.condition);
    }
    if (conditionOk) {
      // If the conditions are met, execute the action.
      // The body format:{taskid: '', datetime:'', data:{} }
      let body = server.app.makeWebHookBody(id, conditionData);

      const hostname = doc.action.hostname;
      const port = doc.action.port;
      const path = doc.action.path;
      server.app.executeWebHook(hostname, port, path, body);

    }
  };

  server.route([
    {
      // Create task.
      path: '/api/mycol/table/{id}',
      method: 'POST',
      handler: async (req) => {
        const response = await client.create({
          id: req.params.id,
          index: server.app.indexsTableName,
          body: req.payload,
        });
        return response;
      }
    },
    {
      // Delete task.
      path: '/api/mycol/table/{id}',
      method: 'DELETE',
      handler: async (req) => {
        const response = await client.delete({
          id: req.params.id,
          index: server.app.indexsTableName,
        });
        return response;
      }
    },
    {
      // Update task.
      path: '/api/mycol/table/{id}',
      method: 'PUT',
      handler: async (req) => {
        const response = await client.update({
          id: req.params.id,
          index: server.app.indexsTableName,
          body: req.payload,
        });
        return response;
      }
    },
    {
      // Search task.
      path: '/api/mycol/table',
      method: 'PUT',
      handler: async (req) => {
        const response = await client.search({
          index: server.app.indexsTableName,
          body: req.payload,
        });
        return response;
      }
    },
    {
      // Execute webhook.
      path: '/api/mycol/table/webhook/{id}',
      method: 'POST',
      handler: async (req) => {
        let body = server.app.makeWebHookBody(req.params.id, req.payload.body);

        const response = await server.app.executeWebHook(
          req.payload.hostname,
          req.payload.port,
          req.payload.path,
          body);
        return "ok";
      }
    },
    {
      // cron task.
      path: '/api/mycol/table/cron/{id}/{enabled}',
      method: 'GET',
      handler: async (req) => {

        if (req.params.enabled == "true") {
          // Add item to jobs.

          // Get document from es.
          const response = await client.get({
            id: req.params.id,
            index: server.app.indexsTableName,
          });

          // Make scheduleJob.
          let frequency = response._source.frequency;
          let id = req.params.id;
          let j = server.app.schedule.scheduleJob(frequency, function (taskid) {

            let job = server.app.getJob(taskid);
            if (job != null) {
              server.app.executeTask(job);
            }

          }.bind(null, id));

          // Save item to jobs.
          let item = { taskid: id, job: j, source: response._source };
          server.app.jobs.push(item);

        } else {
          // Remove item from jobs.
          let id = req.params.id;
          let ar = server.app.jobs.filter((item) => {
            if (item.taskid == id) {
              // Stop scheduleJob.
              item.job.cancel();
              return false;
            } else {
              return true;
            }
          })
          server.app.jobs = ar;
        }

        return "ok";
      }
    },
  ]);
}
