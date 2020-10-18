# ScaleArmor

Scale Armor is an totally extensible and powerful web development framework aimed at RESTFUL apis.

Write your node.js services with plain javascript or typescript using the latest ecma features

Supports:
* HTTP
* HTTPS
* HTTP2

## Introduction

The framework gives you the freedom to choose which features you are going to use.
Every layer serves as building block of the whole service and be used individually if needed.
This is one of its most important concepts and which allows testing to be done in a much more intuitive way without the need to setup the whole application.

In the next topics we are going to review all the layers and how to combine them to build powerful and elegant services.

## Layers

### App

Apps are the most fundamental object in this framework.
They store endpoints, wrapping around them handlers for errors and unexpected cases.
They can resolve requests to endpoints and properly return the response builder.
Apps are like micro service on their own and should be treated as such.
What makes it even more interesting is that they work 100% standalone which makes tests really straight forward to do so.

Apps are defined as abstract classes so you can extends it as needed. 
Still we offer a simple implementation called SimpleApp which alrady brings everything working out of the box.

See how easy is to work with Apps:

```typescript
const dataList: any[] = [];

// Create our app
const app = new SimpleApp('/foo');

// Add a few endpoints
app.endpoint(Method.Get, '/status', async requestReader => {
    // Just return Status Code 200
    return new JSONStatusResponseBuilder(StatusCodes.Ok);
}).endpoint(Method.Post, '/list', async requestReader => {
    // RequestReader is a raw access to node's native http-server functionality
    // For this example, all we need is the actual request with the body. 
    // So we call requestReader.read() and await for the promise resolution.
    const request = await requestReader.read();

    // We push the json object to our dataList
    dataList.push(request.json);

    // Return Status Code 201
    return new JSONStatusResponseBuilder(StatusCodes.Created);
}).endpoint(Method.Get, '/list', async requestReader => {
    // In this case we do not need the body, so we can just use the head of the request (Does not comes with the body).
    const head = requestReader.head;
    
    // We get the parsed query string by accessing the params
    const { params } = head.params;

    // Get the begin and end of the query then slice the our dataList
    const begin = params.begin || 0;
    const end = Math.max(params.end || -1, dataList.length);
    const result = dataList.slice(begin, end)

    // Return Status Code 200 with the queried result
    // JSONResponseBuilder automatically encodes objects to json string
    return new JSONResponseBuilder(result, StatusCodes.Ok);
});

// We setup a http server for this example
const port = 3000;
const server = new HttpAppServer();

// Add our app so the server can forward requests to it
server.app(app);

// Start the server by listening at our port
server.listen(port, () => {
        // This is called when the server is ready
        console.log(`Http server is listening at port :${port}`);
        console.log(`http://0.0.0.0:${port}/foo/status`);
    });
````

This is the most basic approach to build your services.


