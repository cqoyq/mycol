# mycol guide

This kibana plug-in can define periodic tasks, and determine whether to trigger response operations based on conditions after the task is executed.
Note that the current operation only supports webhook and Kibana version 7.0.1.

# Plug-in compilation preconditions
- Install plug-in dependencies.
  `cd /yourpath/kibana-extra/mycol`
  `npm install node-schedule`
- Once you have completed install, use the following yarn scripts.
  `yarn kbn bootstrap`

# Debug mycol plug-in
In the mycol plug-in path, execute the command.
  `cd /yourpath/kibana-extra/mycol`
  `yarn start`

# Plug-in compilation
- Execute the command.
  `yarn build`
- After successful compilation, the plug-in generation path is `/yourpath/kibana-extra/mycol/build`.

# Install plug-in.
In the kibana installation path, execute the command.
  `cd /yourpath/kibana`
  `bin/kibana-plugin install file:///yourpath/kibana-extra/mycol/build/mycol-7.0.1.zip`