export class router {
    constructor(props) {
        this.props = props;
    }

    // Webhook
    executeWebHook(taskid, data) {
        const { httpClient } = this.props;
        return httpClient.post('../api/mycol/table/webhook/' + taskid, JSON.stringify(data));
    }

    // Table
    getAllTask() {
        let data = {
            "query": { "match_all": {} }
        };
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/table', JSON.stringify(data));
    }

    getTotalTaskExcludeIdAndName(name, id) {
        let data = {
            "query": {
                "bool": {
                    "must_not": [
                        {
                            "match": {
                                "_id": id
                            }
                        }
                    ],
                    "must": [
                        {
                            "match": {
                                "name": name
                            }
                        }
                    ]
                }
            },
            "size": 0
        };
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/table', JSON.stringify(data));
    }

    getOneTaskByName(name) {
        let data = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "name": name
                            }
                        }
                    ]
                }
            }
        };
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/table', JSON.stringify(data));
    }

    getTotalTask() {
        const { httpClient } = this.props;
        return httpClient.get('../api/mycol/indexs/doc/mycol-table-7.0.1');
    }

    getLastTask() {
        let data = {
            "query": { "match_all": {} },
            "sort": [
                {
                    "createDate": {
                        "order": "desc"
                    }
                }
            ],
            "size": 1
        };
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/table', JSON.stringify(data));
    }

    createTask(id, data) {
        const { httpClient } = this.props;
        return httpClient.post('../api/mycol/table/' + id, JSON.stringify(data));
    }

    deleteTask(id) {
        const { httpClient } = this.props;
        return httpClient.delete('../api/mycol/table/' + id);
    }

    setCronTask(id, enabled) {
        const { httpClient } = this.props;
        return httpClient.get('../api/mycol/table/cron/' + id + "/" + enabled);
    }

    updateTaskEnabled(id, enabled) {
        let doc_enabled = (enabled) ? "ctx._source.enabled = true" : "ctx._source.enabled = false";
        let data = {
            "script": {
                "source": doc_enabled
            }
        };
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/table/' + id, JSON.stringify(data));
    }

    updateTaskAndWebHookAction(id, taskData) {
        let doc_enabled = (taskData.enabled) ? "ctx._source.enabled = true;" : "ctx._source.enabled = false;";
        let doc_name = "ctx._source.name = params.name;";
        let doc_remark = "ctx._source.remark = params.remark;";
        let doc_frequency = "ctx._source.frequency = params.frequency;";
        let doc_indexPattern = "ctx._source.indexPattern = params.indexPattern;";
        let doc_dsl = "ctx._source.dsl = params.dsl;";
        let doc_condition = "ctx._source.condition = params.condition;";
        let doc_type = "ctx._source.type = params.type;";

        let doc_action_url = "ctx._source.action.url = params.actionUrl;";

        let doc = doc_enabled + doc_name + doc_remark + doc_frequency + doc_indexPattern + doc_dsl + doc_condition + doc_type + doc_action_url;

        let data = {
            "script": {
                "source": doc,
                "params": {
                    "name": taskData.name,
                    "remark": taskData.remark,
                    "frequency": taskData.frequency,
                    "indexPattern": taskData.indexPattern,
                    "type": taskData.type,
                    "dsl": taskData.dsl,
                    "condition": taskData.condition,
                    "actionUrl": taskData.action.url,
                }
            }
        };
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/table/' + id, JSON.stringify(data));
    }



    // Indexs
    getIndexsTable() {
        const { httpClient } = this.props;
        return httpClient.get('../api/mycol/indexs/table');
    }

    createIndexsTable() {
        const { httpClient } = this.props;
        return httpClient.post('../api/mycol/indexs/table');
    }

    getIndexsPattern() {
        const { httpClient } = this.props;
        return httpClient.get('../api/mycol/indexs/pattern');
    }

    executeDSL(indexPattern, body) {
        const { httpClient } = this.props;
        return httpClient.put('../api/mycol/indexs/dsl/' + indexPattern, JSON.stringify(body));
    }
}