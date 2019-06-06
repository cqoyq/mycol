import { resolve } from 'path';
import { existsSync } from 'fs';

// import exampleRoute from './server/routes/example';
import indexsRoute from './server/routes/indexs';
import tableRoute from './server/routes/table';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'mycol',
    uiExports: {
      app: {
        title: 'Mycol',
        description: 'An alert Kibana plugin',
        main: 'plugins/mycol/app',
      },
      hacks: [
        'plugins/mycol/hack'
      ],
      styleSheetPaths: [resolve(__dirname, 'public/app.scss'), resolve(__dirname, 'public/app.css')].find(p => existsSync(p)),
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init(server, options) { // eslint-disable-line no-unused-vars
      // Add server routes and initialize the plugin here

      // Save server.app data.
      const config = server.registrations.mycol;
      server.app.indexsTableName = "mycol-table-" + config.version;

      const client = server.plugins.elasticsearch.getCluster('data').getClient();
      // exampleRoute(server, client);
      indexsRoute(server, client);
      tableRoute(server, client);
    }
  });
}
