"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const PORT = 3000;
const SERVER_ROOT_FOLDER = "./public";
const determineContentType = (extension) => {
    const map = {
        css: "text/css",
        js: "text/javascript",
        html: "text/html",
        plain: "text/plain"
    };
    if (extension in map) {
        return map[extension];
    }
    else {
        return map.plain;
    }
};
const isModuleRequest = (request) => {
    const referer = request.headers.referer;
    if (!referer) {
        return false;
    }
    else {
        return referer.endsWith(".js");
    }
};
const getPath = (request) => {
    if (!request.url) {
        throw new Error("Request had no URL");
    }
    const parsedUrl = url_1.default.parse(request.url);
    if (isModuleRequest(request)) {
        return `${SERVER_ROOT_FOLDER}${parsedUrl.pathname}.js`;
    }
    else {
        if (parsedUrl.pathname === "/") {
            return `${SERVER_ROOT_FOLDER}${parsedUrl.pathname}index.html`;
        }
        else {
            return `${SERVER_ROOT_FOLDER}${parsedUrl.pathname}`;
        }
    }
};
const requestHandler = (request, response) => {
    console.log(`${request.method} ${request.url}`);
    if (request.url === "/favicon.ico") {
        response.statusCode = 404;
        response.end();
        return;
    }
    const filePathX = getPath(request);
    const extension = path_1.default.parse(filePathX).ext.replace(".", "");
    const contentType = determineContentType(extension);
    fs_1.default.readFile(filePathX, (error, fileData) => {
        if (error) {
            console.error(error);
            response.statusCode = 500;
            response.end("There was an error getting the request file.");
        }
        else {
            response.setHeader("Content-Type", contentType);
            response.end(fileData);
        }
    });
};
http_1.default.createServer(requestHandler).listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
