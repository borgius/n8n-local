"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleCredentialsApi = void 0;
var ExampleCredentialsApi = /** @class */ (function () {
    function ExampleCredentialsApi() {
        this.name = 'exampleCredentialsApi';
        this.displayName = 'Example Credentials API';
        this.properties = [
            // The credentials to get from user and save encrypted.
            // Properties can be defined exactly in the same way
            // as node properties.
            {
                displayName: 'User Name',
                name: 'username',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
            },
        ];
        // This credential is currently not used by any node directly
        // but the HTTP Request node can use it to make requests.
        // The credential is also testable due to the `test` property below
        this.authenticate = {
            type: 'generic',
            properties: {
                auth: {
                    username: '={{ $credentials.username }}',
                    password: '={{ $credentials.password }}',
                },
                qs: {
                    // Send this as part of the query string
                    n8n: 'rocks',
                },
            },
        };
        // The block below tells how this credential can be tested
        this.test = {
            request: {
                baseURL: 'https://example.com/',
                url: '',
            },
        };
    }
    return ExampleCredentialsApi;
}());
exports.ExampleCredentialsApi = ExampleCredentialsApi;
