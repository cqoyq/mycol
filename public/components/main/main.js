import React, { Component, Fragment } from 'react';
import {
  EuiPage,
  EuiPageHeader,
  EuiTitle,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentBody,
  EuiText,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiPanel,
  EuiBasicTable,
  EuiLink,
  EuiCode,
  EuiFieldText,
  EuiTextArea,
  EuiCodeEditor,
  EuiForm,
  EuiFormRow,
  EuiDescribedFormGroup,
  EuiFilePicker,
  EuiRange,
  EuiSelect,
  EuiSwitch,
  EuiButton,
  EuiCallOut,
  EuiGlobalToastList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiConfirmModal,
  EuiOverlayMask,
  EUI_MODAL_CONFIRM_BUTTON,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { router } from './router';

// import { createDataStore } from './server/routes/example';
// const store = createDataStore();

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.router = new router(props);
    this.state = {
      // Tab's property
      selectedTabId: 'listItem',
      // Table's property
      sortField: 'firstName',
      sortDirection: 'asc',
      tableItems: [],   //  {id: '', name: '', remark: '',type: '',enabled: '', indexPattern:'', createDate: new Date().toLocaleString()}
      // New's property
      isNewTask: true,    // New task is true, update task is false.
      taskIdForUpdate: 0, // When the task is updated, save task's id.
      taskEmailAction: {
        address: "",
      },
      taskWebHookAction: {
        hostname: "",
        port: 8080,
        path: "",
      },
      taskWebHookInvalid: {
        hostname: false,
        port: false,
        path: false,
      },
      taskData: {
        id: 0,
        enabled: false,
        createDate: '',
        name: "",
        remark: "",
        frequency: "",
        indexPattern: "",
        dsl: "",
        condition: "",
        type: "webhook",
        action: {},
      },
      taskDataInvalid: {
        name: false,
        frequency: false,
        indexPattern: false,
        dsl: false,
        condition: false,
        message: [],
      },
      taskIndexsPattern: [],
      // Toast's property
      toasts: [],
      // Delete modal's property
      isDestroyModalVisible: false,
      modalData: {},
    };
  }

  /** 
   * Tab event and method
   */
  onSelectedTabChanged = id => {

    // console.log("call onSelectedTabChanged-" + id);

    switch (id) {
      case 'newItem':
        // Reset invalid state.
        this.resetInvalidState();

        // Reset task data.
        this.resetTaskData();

        // Set new flag.
        this.state.isNewTask = true;

        break;

      case 'listItem':

        // Get table data.
        this.getTableData();

        break;

      default:
        break;
    }

    this.setState({
      selectedTabId: id,
    });
  };

  renderTabs() {
    const tabs = [
      {
        id: 'listItem',
        name: 'List',
        disabled: false,
      },
      {
        id: 'newItem',
        name: 'New or Update',
        disabled: false,
      },
    ];
    const tabItem = tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        disabled={tab.disabled}
        key={index}>
        {tab.name}
      </EuiTab>
    ));
    return (
      <EuiTabs>
        {tabItem}
      </EuiTabs>);
  };



  /**
   * Table event and method
   */
  onTableChange = ({ sort = {} }) => {
    const { field: sortField, direction: sortDirection } = sort;

    this.setState({
      sortField,
      sortDirection,
    });
  };

  onTablePlay(item) {

    if (item.enabled) {
      this.addFailToast('Execute task', 'Make sure the task is not running before performing the operation!');
      return;
    }

    this.router.getOneTaskByName(item.name).then((resp) => {
      const isfind = resp.data.hits.total.value;
      if (isfind == 1) {
        const id = resp.data.hits.hits[0]._id;
        const doc = resp.data.hits.hits[0]._source;

        const indexPattern = doc.indexPattern;
        const dsl = doc.dsl;

        this.router.executeDSL(indexPattern, dsl).then((dslResp) => {

          let payload = dslResp.data;   // Response for dsl.
          let conditionOk = false;      // If the conditionOk is true, then call action.
          let conditionData = {};       // When the conditionOK is true,  the action will send conditionData.
          {
            eval(doc.condition);
          }
          if (conditionOk) {
            // console.log("conditionOk");

            // If the conditions are met, execute the action.
            // The body format:{taskid: '', datetime:'', data:{} }
            // this.state.taskWebHookAction.body = {
            //   taskid: id,
            //   datetime: new Date().toLocaleString(),
            //   data: conditionData
            // };
            let port = Number(doc.action.port);
            let data = {
              hostname: doc.action.hostname,
              port: port,
              path: doc.action.path,
              body: conditionData,
            };
            this.router.executeWebHook(id, data);


          }
        });
      }
    });
  }

  onTableEdit(item) {
    if (item.enabled) {
      this.addFailToast('Execute task', 'Make sure the task is not running before performing the operation!');
      return;
    }

    // Set isNewTask is false.
    this.state.isNewTask = false;

    // Reset invalid state.
    this.resetInvalidState();

    // Find item.
    this.router.getOneTaskByName(item.name).then((resp) => {
      const isfind = resp.data.hits.total.value;
      if (isfind == 1) {

        this.state.taskIdForUpdate = Number(resp.data.hits.hits[0]._id);

        const source = resp.data.hits.hits[0]._source;
        this.resetTaskData(source);

        this.setState({
          selectedTabId: 'newItem',
        });
      }
    });
  }

  onTableDelete(item) {

    if (item.enabled) {
      this.addFailToast('Execute task', 'Make sure the task is not running before performing the operation!');
      return;
    }

    this.state.modalData = item;
    this.setState({ isDestroyModalVisible: true });

    // this.router.deleteTask(item.id).then(() => {

    //   let ar = this.state.tableItems.filter((value) => {
    //     return (value.id != item.id) ? true : false;
    //   });

    //   this.setState({
    //     tableItems: ar,
    //   });
    // });
  }

  onTableClone(item) {
    // Find item.
    this.router.getOneTaskByName(item.name).then((resp) => {
      const isfind = resp.data.hits.total.value;
      if (isfind == 1) {

        let cloneItem = resp.data.hits.hits[0]._source;
        cloneItem.enabled = false;
        cloneItem.createDate = new Date();
        cloneItem.name = cloneItem.name + "_" + cloneItem.createDate.toLocaleString();

        // Get total task number.
        this.router.getLastTask().then((lastResp) => {

          // Add new task
          let id = Number(lastResp.data.hits.hits[0]._id) + 1;

          this.router.createTask(id, cloneItem).then(() => {

            let newItem = {
              id: id,
              name: cloneItem.name,
              remark: cloneItem.remark,
              type: cloneItem.type,
              enabled: cloneItem.enabled,
              indexPattern: cloneItem.indexPattern,
              createDate: cloneItem.createDate.toLocaleString(),
            };
            let ar = this.state.tableItems;
            ar.push(newItem);

            this.setState({
              tableItems: ar,
            });

            // this.onSelectedTabChanged('listItem');
            // this.addSuccessToast('New or update task', 'Clone success!');
          });

        });
      }
    });
  }

  getTableData() {
    // Get table new data.
    let items = [];
    this.router.getAllTask().then((resp) => {
      let ar = resp.data.hits.hits;
      ar.forEach(v => {
        let item = {
          id: v._id,
          name: v._source.name,
          remark: v._source.remark,
          type: v._source.type,
          enabled: v._source.enabled,
          indexPattern: v._source.indexPattern,
          createDate: new Date(v._source.createDate).toLocaleString(),
        };

        items.push(item);
      });

      this.setState({
        tableItems: items,
      });
    });
  }

  setTableData(id, checked) {

    let items = this.state.tableItems;

    items.forEach((item) => {
      if (item.id == id) {
        item.enabled = checked;
      }
    });

    this.setState({
      tableItems: items,
    });

  }

  renderConfirmDeleteModal() {
    if (!this.state.isDestroyModalVisible)
      return;

    return (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Do you delete task"
          onCancel={() => {
            this.setState({ isDestroyModalVisible: false });
          }}
          onConfirm={() => {
            let item = this.state.modalData;
            this.router.deleteTask(item.id).then(() => {

              this.state.isDestroyModalVisible = false;

              let ar = this.state.tableItems.filter((value) => {
                return (value.id != item.id) ? true : false;
              });

              this.setState({
                tableItems: ar,
              });
            });

          }}
          cancelButtonText="No, don't do it"
          confirmButtonText="Yes, do it"
          buttonColor="danger"
          defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}>
          <p>You&rsquo;re about to destroy task.</p>
          <p>Are you sure you want to do this?</p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  renderTable() {

    if (this.state.selectedTabId != "listItem") {
      return;
    }

    const { sortField, sortDirection } = this.state;

    // Define action data.
    const actions = [
      {
        name: 'Play',
        description: 'Play task',
        icon: 'play',
        type: 'icon',
        onClick: (item) => {
          this.onTablePlay(item);
        },
        isPrimary: true,
      },
      {
        name: 'Delete',
        description: 'Delete task',
        icon: 'trash',
        color: 'danger',
        type: 'icon',
        onClick: (item) => {
          this.onTableDelete(item);
        },
        isPrimary: true,
      },
      {
        name: 'Edit',
        description: 'Edit task',
        icon: 'pencil',
        type: 'icon',
        onClick: (item) => {
          this.onTableEdit(item);
        },
      },
      {
        name: 'Clone',
        description: 'Clone task',
        icon: 'copy',
        type: 'icon',
        onClick: (item) => {
          this.onTableClone(item);
        },
      },
    ];

    // Define column data.
    const columns = [
      {
        field: 'id',
        name: 'id',
        width: '50px',
      },
      {
        field: 'name',
        name: 'Task name',
        width: '200px',
        sortable: true,
        render: (name, item) => (
          <EuiLink onClick={() => {
            this.onTableEdit(item);
          }}>
            {name}
          </EuiLink >
        ),
      },
      {
        field: 'remark',
        name: 'Remark',
        width: '300px',
        truncateText: true,
      },
      {
        field: 'indexPattern',
        name: 'index-pattern',
        width: '200px',
      },
      {
        field: 'type',
        name: 'Task type',
        width: '150px',
      },
      {
        field: 'createDate',
        name: 'Create Date',
        width: '150px',
      },
      {
        field: 'enabled',
        name: 'Valid',
        dataType: 'boolean',
        render: (value, item) => {
          return <EuiSwitch
            checked={value}
            onChange={e => {
              this.router.setCronTask(item.id, e.target.checked);
              this.router.updateTaskEnabled(item.id, e.target.checked);
              this.setTableData(item.id, e.target.checked);
            }}
          />;
        },
        width: '100px',
      },
      {
        name: 'Actions',
        actions,
        width: '100px',
      },
    ];

    // Define row data.
    const items = this.state.tableItems;
    // const items = [
    //   { "name": "a1", "remark": "aaa1", "type": "a-1", "createDate": "2019-05-27 12:25:00" },
    //   { "name": "a2", "remark": "aaa2", "type": "a-2", "createDate": "2019-05-27 14:25:00" },
    // ];

    const getRowProps = item => {
      const { id } = item;
      return {
        'data-test-subj': `row-${id}`,
        className: 'customRowClass',
        // onClick: () => console.log(`Clicked row ${id}`),
      };
    };

    const getCellProps = (item, column) => {
      const { id } = item;
      const { field } = column;
      return {
        className: 'customCellClass',
        'data-test-subj': `cell-${id}-${field}`,
        textOnly: true,
      };
    };
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    return (
      <EuiBasicTable
        items={items}
        columns={columns}
        rowProps={getRowProps}
        cellProps={getCellProps}
        sorting={sorting}
        onChange={this.onTableChange}
      />
    );
  };





  /**
   * New Item event and method
   */
  setTaskName = (name) => {
    this.state.taskData.name = name;
    return this.state.taskData;
  };

  setTaskRemark = (remark) => {
    this.state.taskData.remark = remark;
    return this.state.taskData;
  };

  setTaskFrequency = (frequency) => {
    this.state.taskData.frequency = frequency;
    return this.state.taskData;
  };

  setTaskIndexPattern = (index) => {
    this.state.taskData.indexPattern = index;
    return this.state.taskData;
  };

  setTaskDSL = (dsl) => {
    this.state.taskData.dsl = dsl;
    return this.state.taskData;
  };

  setTaskCondition = (condition) => {
    this.state.taskData.condition = condition;
    return this.state.taskData;
  };

  setTaskType = (type) => {
    this.state.taskData.type = type;
    return this.state.taskData;
  };

  setTaskAction = (action) => {
    this.state.taskData.action = action;
    return this.state.taskData;
  };

  setTaskWebHookHostName = (hostname) => {
    this.state.taskWebHookAction.hostname = hostname;
    return this.state.taskWebHookAction;
  };

  setTaskWebHookPort = (port) => {
    this.state.taskWebHookAction.port = port;
    return this.state.taskWebHookAction;
  };

  setTaskWebHookPath = (path) => {
    this.state.taskWebHookAction.path = path;
    return this.state.taskWebHookAction;
  };

  setTaskInvalidMessage = (message) => {
    this.state.taskDataInvalid.message = message;
    return this.state.taskDataInvalid;
  };

  resetInvalidState() {
    this.state.taskDataInvalid.name = false;
    this.state.taskDataInvalid.frequency = false;
    this.state.taskDataInvalid.indexPattern = false;
    this.state.taskDataInvalid.dsl = false;
    this.state.taskDataInvalid.condition = false;
    this.state.taskDataInvalid.message = [];

    this.state.taskWebHookInvalid.hostname = false;
    this.state.taskWebHookInvalid.port = false;
    this.state.taskWebHookInvalid.path = false;
  }

  resetTaskData(source) {
    this.state.taskData.id = (source != undefined) ? source.id : 0;
    this.state.taskData.enabled = (source != undefined) ? source.enabled : false;
    this.state.taskData.name = (source != undefined) ? source.name : "";
    this.state.taskData.remark = (source != undefined) ? source.remark : "";

    if (this.state.taskIndexsPattern.length > 0) {
      this.state.taskData.indexPattern = (source != undefined) ? source.indexPattern : this.state.taskIndexsPattern[0].value;
    } else {
      this.state.taskData.indexPattern = "";
    }


    this.state.taskData.dsl = (source != undefined) ? source.dsl : "";
    this.state.taskData.condition = (source != undefined) ? source.condition : "";
    this.state.taskData.type = (source != undefined) ? source.type : "webhook";
    this.state.taskData.frequency = (source != undefined) ? source.frequency : "";

    switch (this.state.taskData.type) {
      case 'webhook':
        this.state.taskWebHookAction.hostname = (source != undefined) ? source.action.hostname : "";
        this.state.taskWebHookAction.port = (source != undefined) ? source.action.port : 8080;
        this.state.taskWebHookAction.path = (source != undefined) ? source.action.path : "";
        break;
      case 'email':
        break;
      default:
        break;
    }
  }

  renderInValidState() {
    if (this.state.taskDataInvalid.message.length > 0) {

      const taskInvalidMessageItem = this.state.taskDataInvalid.message.map((item, index) => (
        <li key={index}>{item}</li>
      ));

      return (
        <Fragment>
          <EuiCallOut title="Sorry, there was an error" color="danger" iconType="cross" hide="true">
            {taskInvalidMessageItem}
          </EuiCallOut>
          <EuiSpacer />
        </Fragment>
      );
    }
  }

  renderWehHookAction() {
    if (this.state.taskData.type != "webhook") {
      return;
    }

    return (
      <Fragment>
        <EuiFormRow label="Hostname" isInvalid={this.state.taskWebHookInvalid.hostname}>
          <EuiFieldText placeholder="localhost"
            isInvalid={this.state.taskWebHookInvalid.hostname}
            value={this.state.taskWebHookAction.hostname}
            onChange={e => {
              this.setState({
                taskWebHookAction: this.setTaskWebHookHostName(e.target.value),
              });
            }}
          />
        </EuiFormRow>
        <EuiFormRow label="Port" isInvalid={this.state.taskWebHookInvalid.port}>
          <EuiFieldText placeholder="8080"
            isInvalid={this.state.taskWebHookInvalid.port}
            value={this.state.taskWebHookAction.port}
            onChange={e => {
              this.setState({
                taskWebHookAction: this.setTaskWebHookPort(e.target.value),
              });
            }}
          />
        </EuiFormRow>
        <EuiFormRow label="Path" isInvalid={this.state.taskWebHookInvalid.path}>
          <EuiFieldText placeholder="/test-api"
            isInvalid={this.state.taskWebHookInvalid.path}
            value={this.state.taskWebHookAction.path}
            onChange={e => {
              this.setState({
                taskWebHookAction: this.setTaskWebHookPath(e.target.value),
              });
            }}
          />
        </EuiFormRow>
      </Fragment>
    );
  }

  renderCancelButton() {
    if (this.state.isNewTask) {
      return;
    }

    return (
      <EuiFlexItem grow={false}>
        <EuiButton fill onClick={() => {
          this.onSelectedTabChanged('listItem');
        }}>
          Cancel
         </EuiButton>
      </EuiFlexItem>
    );
  }

  renderIndexPattern() {

    this.router.getIndexsPattern().then((resp) => {
      let items = [];
      resp.data.hits.hits.forEach(n => {
        let title = n._source["index-pattern"].title;

        let item = { value: title, text: title };
        items.push(item);
      });

      // If items isn't equal to taskIndexsPattern, flush state.
      let str1 = "";
      let str2 = "";
      str1 = str1.concat(JSON.stringify(items));
      str2 = str2.concat(JSON.stringify(this.state.taskIndexsPattern));

      if (str1 != str2) {

        if (items.length > 0) {
          // Set default value.
          this.state.taskData.indexPattern = items[0].value;
        }

        this.setState({
          taskIndexsPattern: items,
        });
      }

    });

    return (
      <EuiFormRow label="Index pattern" isInvalid={this.state.taskDataInvalid.indexPattern}>
        <EuiSelect
          isInvalid={this.state.taskDataInvalid.indexPattern}
          options={this.state.taskIndexsPattern}
          value={this.state.taskData.indexPattern}
          onChange={e => {
            this.setState({
              taskData: this.setTaskIndexPattern(e.target.value),
            });
          }}
          aria-label="Use aria labels when no actual label is in use"
        />
      </EuiFormRow>
    );
  }

  renderNewItem() {

    if (this.state.selectedTabId != "newItem") {
      return;
    }

    const renderInValidState = this.renderInValidState();
    const renderWehHookAction = this.renderWehHookAction();
    const renderCancelButton = this.renderCancelButton();
    const renderIndexPattern = this.renderIndexPattern();

    return (
      <EuiForm>
        <EuiDescribedFormGroup
          title={<strong>Task base</strong>}
          titleSize="m"
          description="After the task is defined, the system will run the task according to the defined conditions.">
          <EuiFormRow label="Task name" isInvalid={this.state.taskDataInvalid.name}>
            <EuiFieldText placeholder="New task"
              isInvalid={this.state.taskDataInvalid.name}
              value={this.state.taskData.name}
              onChange={e => {
                this.setState({
                  taskData: this.setTaskName(e.target.value),
                });
              }}
            />
          </EuiFormRow>

          <EuiFormRow label="Task remark" >
            <EuiTextArea
              placeholder="the task's remark is not required"
              value={this.state.taskData.remark}
              onChange={e => {
                this.setState({
                  taskData: this.setTaskRemark(e.target.value),
                });
              }}
              compressed
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>

        <EuiDescribedFormGroup
          title={<strong>Task frequency</strong>}
          titleSize="m"
          description={<Fragment>
            Define the frequency of task execution, use cron grammar.<EuiSpacer />For example:
            <li><EuiCode>0 6 * * *</EuiCode>   -- 6 am every day</li>
            <li><EuiCode>0 */2 * * *</EuiCode> -- Every 2 hours</li>
            <li><EuiCode>0 23-7/2，8 * * *</EuiCode> -- Every two hours between 11 pm and 8 am, 8 am</li>
            <li><EuiCode>0 11 4 * 1-3</EuiCode> -- The 4th of every month and every Monday through Wednesday at 11 am</li>
            <li><EuiCode>0 4 1 1 *</EuiCode> -- January 1st at 4 am</li>
          </Fragment>}>
          <EuiFormRow>
            <EuiFieldText placeholder="this is required"
              isInvalid={this.state.taskDataInvalid.frequency}
              value={this.state.taskData.frequency}
              onChange={e => {
                this.setState({
                  taskData: this.setTaskFrequency(e.target.value),
                });
              }}
            />
          </EuiFormRow>
        </EuiDescribedFormGroup >

        <EuiDescribedFormGroup
          title={<strong>Task search</strong>}
          titleSize="m"
          description="Provides task search DSL definitions." >

          {renderIndexPattern}

          <EuiFormRow label="DSL grammar" isInvalid={this.state.taskDataInvalid.dsl}>
            <EuiCodeEditor
              mode="javascript"
              width="150%"
              value={this.state.taskData.dsl}
              onChange={value => {
                this.setState({
                  taskData: this.setTaskDSL(value),
                });
              }}
              setOptions={{
                fontSize: '14px',
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
              }}
              onBlur={() => {
                console.log('blur');
              }} // eslint-disable-line no-console
              aria-label="Code Editor"
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>

        <EuiDescribedFormGroup
          title={<strong>Task condition</strong>}
          titleSize="m"
          description={
            <Fragment>
              Provides task condition definitions.
            </Fragment>
          }>
          <EuiFormRow label="Condition grammar" isInvalid={this.state.taskDataInvalid.condition}>
            <EuiCodeEditor
              mode="javascript"
              // theme="github"
              width="150%"
              value={this.state.taskData.condition}
              onChange={value => {
                this.setState({
                  taskData: this.setTaskCondition(value),
                });
              }}
              setOptions={{
                fontSize: '14px',
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
              }}
              onBlur={() => {
                console.log('blur');
              }} // eslint-disable-line no-console
              aria-label="Code Editor"
            />
          </EuiFormRow>
        </EuiDescribedFormGroup>

        <EuiDescribedFormGroup
          title={<strong>Task Action</strong>}
          titleSize="m"
          description="When the condition is satisfied, the processing method is called." >
          <EuiFormRow label="Type">
            <EuiSelect
              options={[
                { value: 'webhook', text: 'WebHook' },
                // { value: 'email', text: 'Email' },
              ]}
              value={this.state.taskData.type}
              onChange={e => {
                this.state.taskData.type = e.target.value;
                switch (this.state.taskData.type) {
                  case 'webhook':
                    this.setState({
                      taskData: this.setTaskAction(this.state.taskWebHookAction),
                    });
                    break;
                  case 'email':
                    this.setState({
                      taskData: this.setTaskAction(this.state.taskEmailAction),
                    });
                    break;
                  default:
                    break;
                }

              }}
              aria-label="Use aria labels when no actual label is in use"
            />
          </EuiFormRow>
          {renderWehHookAction}

        </EuiDescribedFormGroup>

        {renderInValidState}

        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={() => {

              // Reset invalid state.
              this.resetInvalidState();

              // console.log(this.state.taskData.indexPattern);
              let message = [];

              // Check name
              if (this.state.taskData.name == "") {
                this.state.taskDataInvalid.name = true;
                message.push("The name is invalid!");
              }

              // Check frequency
              if (this.state.taskData.frequency == "") {
                this.state.taskDataInvalid.frequency = true;
                message.push("The frequency is invalid!");
              }

              // Check index-pattern
              if (this.state.taskData.indexPattern == "") {
                this.state.taskDataInvalid.indexPattern = true;
                message.push("The index-pattern is invalid!");
              }

              // Check dsl
              if (this.state.taskData.dsl == "") {
                this.state.taskDataInvalid.dsl = true;
                message.push("The search is invalid!");
              }

              // Check condition
              if (this.state.taskData.condition == "") {
                this.state.taskDataInvalid.condition = true;
                message.push("The condition is invalid!");
              }

              // Check action
              switch (this.state.taskData.type) {
                case 'webhook':
                  if (this.state.taskWebHookAction.hostname == "") {

                    this.state.taskWebHookInvalid.hostname = true;
                    message.push("The action's hostname is invalid!");
                  }
                  if (this.state.taskWebHookAction.port < 80 || this.state.taskWebHookAction.port > 65535) {

                    this.state.taskWebHookInvalid.port = true;
                    message.push("The action's port is invalid!");
                  }
                  if (this.state.taskWebHookAction.path == "") {

                    this.state.taskWebHookInvalid.path = true;
                    message.push("The action's path is invalid!");
                  }
                  break;
                case 'email':

                  break;
                default:
                  break;
              }


              // If there are no errors, submit the information.
              if (message.length == 0) {

                // If isNewTask is true, do new task, otherwise do update task.
                if (this.state.isNewTask) {

                  // Check if the new task can exist.
                  this.router.getOneTaskByName(this.state.taskData.name).then((resp) => {

                    const isfind = resp.data.hits.total.value;
                    if (isfind == 0) {

                      // If the task is the first time, id equals 1, otherwise add 1 to the maximum.
                      this.router.getTotalTask().then((totalResp) => {

                        let ar = totalResp.data.split(" ");
                        if (ar.length == 3) {
                          let doc_num = Number(ar[2]);
                          if (doc_num == 0) {
                            // Add new task the first time.
                            let id = 1;
                            this.state.taskData.id = id;
                            this.state.taskData.createDate = new Date();

                            this.router.createTask(id, this.state.taskData).then(() => {
                              this.addSuccessToast('New or update task', 'Save success!');
                            });

                          } else {
                            // Calculate max task id.
                            this.router.getLastTask().then((totalResp) => {

                              // Add new task
                              let id = Number(totalResp.data.hits.hits[0]._id) + 1;
                              this.state.taskData.id = id;
                              this.state.taskData.createDate = new Date();

                              this.router.createTask(id, this.state.taskData).then(() => {
                                this.addSuccessToast('New or update task', 'Save success!');
                              });
                            });
                          }
                        }


                      });

                    } else {
                      this.addFailToast('New or update task', 'The task has exist!');
                    }
                  });
                } else {

                  // Check if the new task can exist.
                  this.router.getTotalTaskExcludeIdAndName(this.state.taskData.name, this.state.taskIdForUpdate).then((resp) => {
                    const isfind = resp.data.hits.total.value;
                    if (isfind == 0) {
                      switch (this.state.taskData.type) {
                        case 'webhook':
                          this.router.updateTaskAndWebHookAction(this.state.taskIdForUpdate, this.state.taskData).then((resp) => {
                            this.addSuccessToast('New or update task', 'Update success!');
                          });
                          break;
                        case 'email':
                          break;
                        default:
                          break;
                      }
                    } else {
                      this.addFailToast('New or update task', 'The task has exist!');
                    }
                  });

                }

              } else {

                // There is error, to redraw error.
                this.setState({
                  taskDataInvalid: this.setTaskInvalidMessage(message),
                });
              }
            }}>
              Save
            </EuiButton>
          </EuiFlexItem>

          {renderCancelButton}

        </EuiFlexGroup>
      </EuiForm >

    );
  };




  /**
  * Toast event and method
  */
  addSuccessToast = (t, content) => {
    const toast = {
      id: this.state.toasts.length + 1,
      title: t,
      color: 'success',
      iconType: 'clock',
      // toastLifeTimeMs: 3000,
      text: (
        <p>
          {content}
        </p>
      ),
    };

    this.setState({
      toasts: this.state.toasts.concat(toast),
    });
  };

  addFailToast = (t, content) => {
    const toast = {
      id: this.state.toasts.length + 1,
      title: t,
      color: 'danger',
      iconType: 'alert',
      // toastLifeTimeMs: 3000,
      text: (
        <p>
          {content}
        </p>
      ),
    };

    this.setState({
      toasts: this.state.toasts.concat(toast),
    });
  };

  removeToast = removedToast => {
    this.setState(prevState => ({
      toasts: prevState.toasts.filter(toast => toast.id !== removedToast.id),
    }));
  };

  renderToast() {
    return (
      <EuiGlobalToastList
        toasts={this.state.toasts}
        dismissToast={this.removeToast}
        toastLifeTimeMs={3000}
      />
    );
  }



  // Global method
  initStatAndData() {
    // Initialization state.
    this.state.taskData.action = this.state.taskWebHookAction;

    // Get table data.
    this.getTableData();
  }

  componentDidMount() {
    /*
       FOR EXAMPLE PURPOSES ONLY.  There are much better ways to
       manage state and update your UI than this.
    */

    // Check to see if the index exists and is not created it.
    this.router.getIndexsTable().then((resp) => {
      if (!resp.data) {
        this.router.createIndexsTable().then(() => {
          this.initStatAndData();
        });
      } else {
        this.initStatAndData();
      }
    });

  }


  render() {

    // console.log("call render");
    // console.log(this.state.tableItems);

    // EUI object
    const tabPart = this.renderTabs();
    const tablePart = this.renderTable();
    const newItemPart = this.renderNewItem();
    const renderToast = this.renderToast();
    const renderConfirmDeleteModal = this.renderConfirmDeleteModal();

    // Other's object
    const { title } = this.props;
    return (
      <Fragment>
        <EuiPanel paddingSize="l">
          {/* Title part */}
          <EuiText grow={false}>
            <h3>MyCol Plugin</h3>
            <p>This is a Moniter and Alert plugin. When the task condition is satisfied, the corresponding processing method
              will be called to execute, and the task supports cycle processing.</p>
          </EuiText>
          {/* Tab part */}
          {tabPart}
          {/* Content part */}
          <EuiSpacer />
          {tablePart}
          {renderConfirmDeleteModal}
          {newItemPart}
          {renderToast}
        </EuiPanel>
      </Fragment>
    );
  }
}
