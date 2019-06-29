'use strict';
const AWS = require('aws-sdk');

module.exports = class DynamoDBContextStore {
    constructor(region, tableName) {
        this.region = region;
        this.tableName = tableName;
        AWS.config.update({region: region});
        this.docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    }

    get(installedAppId) {
        let params = {
            TableName: this.tableName,
            Key: {
                installedAppId: installedAppId
            },
            ConsistentRead: true
        };
        return new Promise((resolve, reject) => {
            this.docClient.get(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (data.Item) {
                        let result = data.Item;

                        // For backward compatibility with version 1.0.1
                        if (typeof result.config === 'string') {
                            result.config = JSON.parse(result.config);
                        }
                        resolve(result);
                    }
                    else {
                        resolve({});
                    }
                }
            });
        });
    }

    put(params) {
        const data = {
            TableName: this.tableName,
            Item: {
                installedAppId: params.installedAppId,
                locationId: params.locationId,
                authToken: params.authToken,
                refreshToken: params.refreshToken,
                config: params.config,
                state: params.state
            }
        };
        return new Promise((resolve, reject) => {
            this.docClient.put(data, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    update(installedAppId, params) {
        const names = {};
        const values = {};
        const expressions = [];
        for (const name of Object.keys(params)) {

            const expressionNameKeys = [];
            const nameSegs = name.split('.');
            for (const i in nameSegs) {
                const nameKey = `#${nameSegs.slice(0,i+1).join('_')}`;
                names[nameKey] = nameSegs[i];
                expressionNameKeys.push(nameKey)
            }
            const valueKey = `:${nameSegs.join('_')}`;
            values[valueKey] = params[name];
            expressions.push(`${expressionNameKeys.join('.')} = ${valueKey}`)
        }

        const data = {
            TableName: this.tableName,
            Key: {
                installedAppId: installedAppId
            },
            UpdateExpression: 'SET ' + expressions.join(', '),
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values
        };

        return new Promise((resolve, reject) => {
            this.docClient.update(data, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    delete(installedAppId) {
        let params = {
            TableName: this.tableName,
            Key: {
                installedAppId: installedAppId
            }
        };
        return new Promise((resolve, reject) => {
            this.docClient.delete(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
};
