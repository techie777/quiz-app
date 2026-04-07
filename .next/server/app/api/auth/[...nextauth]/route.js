"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_TECHIE777_Desktop_All_Projects_quiz_app_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.js */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.js\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\TECHIE777\\\\Desktop\\\\All Projects\\\\quiz-app\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.js\",\n    nextConfigOutput,\n    userland: C_Users_TECHIE777_Desktop_All_Projects_quiz_app_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLmpzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNURUNISUU3NzclNUNEZXNrdG9wJTVDQWxsJTIwUHJvamVjdHMlNUNxdWl6LWFwcCU1Q3NyYyU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDVEVDSElFNzc3JTVDRGVza3RvcCU1Q0FsbCUyMFByb2plY3RzJTVDcXVpei1hcHAmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ21EO0FBQ2hJO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcXVpendlYi8/NDhhYSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxURUNISUU3NzdcXFxcRGVza3RvcFxcXFxBbGwgUHJvamVjdHNcXFxccXVpei1hcHBcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcYXV0aFxcXFxbLi4ubmV4dGF1dGhdXFxcXHJvdXRlLmpzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hdXRoL1suLi5uZXh0YXV0aF1cIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXFVzZXJzXFxcXFRFQ0hJRTc3N1xcXFxEZXNrdG9wXFxcXEFsbCBQcm9qZWN0c1xcXFxxdWl6LWFwcFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUuanNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/[...nextauth]/route.js":
/*!*************************************************!*\
  !*** ./src/app/api/auth/[...nextauth]/route.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler),\n/* harmony export */   dynamic: () => (/* binding */ dynamic)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.js\");\n\n\nconst dynamic = \"force-dynamic\";\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(_lib_auth__WEBPACK_IMPORTED_MODULE_1__.authOptions);\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQWlDO0FBQ1E7QUFFbEMsTUFBTUUsVUFBVSxnQkFBZ0I7QUFFdkMsTUFBTUMsVUFBVUgsZ0RBQVFBLENBQUNDLGtEQUFXQTtBQUNPIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcXVpendlYi8uL3NyYy9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS5qcz8yMzJkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOZXh0QXV0aCBmcm9tIFwibmV4dC1hdXRoXCI7XHJcbmltcG9ydCB7IGF1dGhPcHRpb25zIH0gZnJvbSBcIkAvbGliL2F1dGhcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBkeW5hbWljID0gXCJmb3JjZS1keW5hbWljXCI7XHJcblxyXG5jb25zdCBoYW5kbGVyID0gTmV4dEF1dGgoYXV0aE9wdGlvbnMpO1xyXG5leHBvcnQgeyBoYW5kbGVyIGFzIEdFVCwgaGFuZGxlciBhcyBQT1NUIH07XHJcbiJdLCJuYW1lcyI6WyJOZXh0QXV0aCIsImF1dGhPcHRpb25zIiwiZHluYW1pYyIsImhhbmRsZXIiLCJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/[...nextauth]/route.js\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.js":
/*!*************************!*\
  !*** ./src/lib/auth.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n\n\n\n\n\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma),\n    secret: process.env.NEXTAUTH_SECRET,\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    },\n    providers: [\n        // Google OAuth\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET,\n            allowDangerousEmailAccountLinking: true\n        }),\n        // User login with Email PIN\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"email-pin\",\n            name: \"Email PIN\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                pin: {\n                    label: \"PIN\",\n                    type: \"text\"\n                },\n                isNewUser: {\n                    label: \"Is New User\",\n                    type: \"text\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.pin) return null;\n                const email = credentials.email.trim().toLowerCase();\n                const pin = credentials.pin.trim();\n                // Find user\n                let user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.findUnique({\n                    where: {\n                        email\n                    }\n                });\n                if (credentials.isNewUser === \"true\") {\n                    throw new Error(\"New user registration is administratively restricted.\");\n                } else {\n                    if (!user) throw new Error(\"User not found\");\n                    if (!user.pin) throw new Error(\"No PIN set for this account. Please contact admin.\");\n                    if (user.pin !== pin) throw new Error(\"Invalid PIN\");\n                }\n                return {\n                    id: user.id,\n                    name: user.name,\n                    email: user.email,\n                    image: user.image || user.avatar,\n                    pin: user.pin\n                };\n            }\n        }),\n        // Admin login (kept separate for management)\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"admin-login\",\n            name: \"Admin Login\",\n            credentials: {\n                username: {\n                    label: \"Username\",\n                    type: \"text\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.username || !credentials?.password) return null;\n                const admin = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminAccount.findUnique({\n                    where: {\n                        username: credentials.username\n                    }\n                });\n                if (!admin) return null;\n                if (admin.status !== \"active\") return null;\n                const valid = await bcryptjs__WEBPACK_IMPORTED_MODULE_4__[\"default\"].compare(credentials.password, admin.passwordHash);\n                if (!valid) return null;\n                // Log the login\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminActivityLog.create({\n                    data: {\n                        adminId: admin.id,\n                        action: \"login\",\n                        details: \"Admin logged in\"\n                    }\n                });\n                return {\n                    id: admin.id,\n                    name: admin.displayName || admin.username,\n                    email: `admin:${admin.username}`,\n                    role: admin.role,\n                    adminId: admin.id,\n                    username: admin.username\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user, account }) {\n            if (user) {\n                token.userId = user.id;\n                if (account?.provider === \"admin-login\") {\n                    token.role = user.role;\n                    token.adminId = user.adminId;\n                    token.username = user.username;\n                    token.isAdmin = true;\n                } else {\n                    token.role = \"user\";\n                    token.isAdmin = false;\n                }\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.userId;\n                session.user.role = token.role;\n                session.user.isAdmin = token.isAdmin;\n                if (token.isAdmin) {\n                    session.user.adminId = token.adminId;\n                    session.user.username = token.username;\n                    try {\n                        const admin = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminAccount.findUnique({\n                            where: {\n                                id: token.adminId\n                            },\n                            select: {\n                                role: true,\n                                status: true,\n                                displayName: true,\n                                username: true\n                            }\n                        });\n                        if (admin?.status !== \"active\") {\n                            session.user.isAdmin = false;\n                        } else {\n                            session.user.role = admin.role;\n                            session.user.username = admin.username;\n                            session.user.name = admin.displayName || admin.username;\n                            const permRow = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.setting.findUnique({\n                                where: {\n                                    key: `adminPerms:${token.adminId}`\n                                },\n                                select: {\n                                    value: true\n                                }\n                            });\n                            session.user.permissions = permRow?.value || \"{}\";\n                        }\n                    } catch  {\n                        session.user.permissions = \"{}\";\n                    }\n                }\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/signin\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQXdEO0FBQ1U7QUFDUjtBQUNwQjtBQUNSO0FBRXZCLE1BQU1LLGNBQWM7SUFDekJDLFNBQVNKLHdFQUFhQSxDQUFDQywrQ0FBTUE7SUFDN0JJLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsZUFBZTtJQUNuQ0MsU0FBUztRQUNQQyxVQUFVO1FBQ1ZDLFFBQVEsS0FBSyxLQUFLLEtBQUs7SUFDekI7SUFDQUMsV0FBVztRQUNULGVBQWU7UUFDZmQsc0VBQWNBLENBQUM7WUFDYmUsVUFBVVAsUUFBUUMsR0FBRyxDQUFDTyxnQkFBZ0I7WUFDdENDLGNBQWNULFFBQVFDLEdBQUcsQ0FBQ1Msb0JBQW9CO1lBQzlDQyxtQ0FBbUM7UUFDckM7UUFDQSw0QkFBNEI7UUFDNUJsQiwyRUFBbUJBLENBQUM7WUFDbEJtQixJQUFJO1lBQ0pDLE1BQU07WUFDTkMsYUFBYTtnQkFDWEMsT0FBTztvQkFBRUMsT0FBTztvQkFBU0MsTUFBTTtnQkFBUTtnQkFDdkNDLEtBQUs7b0JBQUVGLE9BQU87b0JBQU9DLE1BQU07Z0JBQU87Z0JBQ2xDRSxXQUFXO29CQUFFSCxPQUFPO29CQUFlQyxNQUFNO2dCQUFPO1lBQ2xEO1lBQ0EsTUFBTUcsV0FBVU4sV0FBVztnQkFDekIsSUFBSSxDQUFDQSxhQUFhQyxTQUFTLENBQUNELGFBQWFJLEtBQUssT0FBTztnQkFFckQsTUFBTUgsUUFBUUQsWUFBWUMsS0FBSyxDQUFDTSxJQUFJLEdBQUdDLFdBQVc7Z0JBQ2xELE1BQU1KLE1BQU1KLFlBQVlJLEdBQUcsQ0FBQ0csSUFBSTtnQkFFaEMsWUFBWTtnQkFDWixJQUFJRSxPQUFPLE1BQU01QiwrQ0FBTUEsQ0FBQzRCLElBQUksQ0FBQ0MsVUFBVSxDQUFDO29CQUFFQyxPQUFPO3dCQUFFVjtvQkFBTTtnQkFBRTtnQkFFM0QsSUFBSUQsWUFBWUssU0FBUyxLQUFLLFFBQVE7b0JBQ3BDLE1BQU0sSUFBSU8sTUFBTTtnQkFDbEIsT0FBTztvQkFDTCxJQUFJLENBQUNILE1BQU0sTUFBTSxJQUFJRyxNQUFNO29CQUMzQixJQUFJLENBQUNILEtBQUtMLEdBQUcsRUFBRSxNQUFNLElBQUlRLE1BQU07b0JBQy9CLElBQUlILEtBQUtMLEdBQUcsS0FBS0EsS0FBSyxNQUFNLElBQUlRLE1BQU07Z0JBQ3hDO2dCQUVBLE9BQU87b0JBQ0xkLElBQUlXLEtBQUtYLEVBQUU7b0JBQ1hDLE1BQU1VLEtBQUtWLElBQUk7b0JBQ2ZFLE9BQU9RLEtBQUtSLEtBQUs7b0JBQ2pCWSxPQUFPSixLQUFLSSxLQUFLLElBQUlKLEtBQUtLLE1BQU07b0JBQ2hDVixLQUFLSyxLQUFLTCxHQUFHO2dCQUNmO1lBQ0Y7UUFDRjtRQUNBLDZDQUE2QztRQUM3Q3pCLDJFQUFtQkEsQ0FBQztZQUNsQm1CLElBQUk7WUFDSkMsTUFBTTtZQUNOQyxhQUFhO2dCQUNYZSxVQUFVO29CQUFFYixPQUFPO29CQUFZQyxNQUFNO2dCQUFPO2dCQUM1Q2EsVUFBVTtvQkFBRWQsT0FBTztvQkFBWUMsTUFBTTtnQkFBVztZQUNsRDtZQUNBLE1BQU1HLFdBQVVOLFdBQVc7Z0JBQ3pCLElBQUksQ0FBQ0EsYUFBYWUsWUFBWSxDQUFDZixhQUFhZ0IsVUFBVSxPQUFPO2dCQUM3RCxNQUFNQyxRQUFRLE1BQU1wQywrQ0FBTUEsQ0FBQ3FDLFlBQVksQ0FBQ1IsVUFBVSxDQUFDO29CQUNqREMsT0FBTzt3QkFBRUksVUFBVWYsWUFBWWUsUUFBUTtvQkFBQztnQkFDMUM7Z0JBQ0EsSUFBSSxDQUFDRSxPQUFPLE9BQU87Z0JBQ25CLElBQUlBLE1BQU1FLE1BQU0sS0FBSyxVQUFVLE9BQU87Z0JBQ3RDLE1BQU1DLFFBQVEsTUFBTXRDLHdEQUFjLENBQUNrQixZQUFZZ0IsUUFBUSxFQUFFQyxNQUFNSyxZQUFZO2dCQUMzRSxJQUFJLENBQUNGLE9BQU8sT0FBTztnQkFFbkIsZ0JBQWdCO2dCQUNoQixNQUFNdkMsK0NBQU1BLENBQUMwQyxnQkFBZ0IsQ0FBQ0MsTUFBTSxDQUFDO29CQUNuQ0MsTUFBTTt3QkFBRUMsU0FBU1QsTUFBTW5CLEVBQUU7d0JBQUU2QixRQUFRO3dCQUFTQyxTQUFTO29CQUFrQjtnQkFDekU7Z0JBRUEsT0FBTztvQkFDTDlCLElBQUltQixNQUFNbkIsRUFBRTtvQkFDWkMsTUFBTWtCLE1BQU1ZLFdBQVcsSUFBSVosTUFBTUYsUUFBUTtvQkFDekNkLE9BQU8sQ0FBQyxNQUFNLEVBQUVnQixNQUFNRixRQUFRLENBQUMsQ0FBQztvQkFDaENlLE1BQU1iLE1BQU1hLElBQUk7b0JBQ2hCSixTQUFTVCxNQUFNbkIsRUFBRTtvQkFDakJpQixVQUFVRSxNQUFNRixRQUFRO2dCQUMxQjtZQUNGO1FBQ0Y7S0FDRDtJQUNEZ0IsV0FBVztRQUNULE1BQU1DLEtBQUksRUFBRUMsS0FBSyxFQUFFeEIsSUFBSSxFQUFFeUIsT0FBTyxFQUFFO1lBQ2hDLElBQUl6QixNQUFNO2dCQUNSd0IsTUFBTUUsTUFBTSxHQUFHMUIsS0FBS1gsRUFBRTtnQkFDdEIsSUFBSW9DLFNBQVNFLGFBQWEsZUFBZTtvQkFDdkNILE1BQU1ILElBQUksR0FBR3JCLEtBQUtxQixJQUFJO29CQUN0QkcsTUFBTVAsT0FBTyxHQUFHakIsS0FBS2lCLE9BQU87b0JBQzVCTyxNQUFNbEIsUUFBUSxHQUFHTixLQUFLTSxRQUFRO29CQUM5QmtCLE1BQU1JLE9BQU8sR0FBRztnQkFDbEIsT0FBTztvQkFDTEosTUFBTUgsSUFBSSxHQUFHO29CQUNiRyxNQUFNSSxPQUFPLEdBQUc7Z0JBQ2xCO1lBQ0Y7WUFDQSxPQUFPSjtRQUNUO1FBQ0EsTUFBTTVDLFNBQVEsRUFBRUEsT0FBTyxFQUFFNEMsS0FBSyxFQUFFO1lBQzlCLElBQUk1QyxRQUFRb0IsSUFBSSxFQUFFO2dCQUNoQnBCLFFBQVFvQixJQUFJLENBQUNYLEVBQUUsR0FBR21DLE1BQU1FLE1BQU07Z0JBQzlCOUMsUUFBUW9CLElBQUksQ0FBQ3FCLElBQUksR0FBR0csTUFBTUgsSUFBSTtnQkFDOUJ6QyxRQUFRb0IsSUFBSSxDQUFDNEIsT0FBTyxHQUFHSixNQUFNSSxPQUFPO2dCQUNwQyxJQUFJSixNQUFNSSxPQUFPLEVBQUU7b0JBQ2pCaEQsUUFBUW9CLElBQUksQ0FBQ2lCLE9BQU8sR0FBR08sTUFBTVAsT0FBTztvQkFDcENyQyxRQUFRb0IsSUFBSSxDQUFDTSxRQUFRLEdBQUdrQixNQUFNbEIsUUFBUTtvQkFDdEMsSUFBSTt3QkFDRixNQUFNRSxRQUFRLE1BQU1wQywrQ0FBTUEsQ0FBQ3FDLFlBQVksQ0FBQ1IsVUFBVSxDQUFDOzRCQUNqREMsT0FBTztnQ0FBRWIsSUFBSW1DLE1BQU1QLE9BQU87NEJBQUM7NEJBQzNCWSxRQUFRO2dDQUFFUixNQUFNO2dDQUFNWCxRQUFRO2dDQUFNVSxhQUFhO2dDQUFNZCxVQUFVOzRCQUFLO3dCQUN4RTt3QkFDQSxJQUFJRSxPQUFPRSxXQUFXLFVBQVU7NEJBQzlCOUIsUUFBUW9CLElBQUksQ0FBQzRCLE9BQU8sR0FBRzt3QkFDekIsT0FBTzs0QkFDTGhELFFBQVFvQixJQUFJLENBQUNxQixJQUFJLEdBQUdiLE1BQU1hLElBQUk7NEJBQzlCekMsUUFBUW9CLElBQUksQ0FBQ00sUUFBUSxHQUFHRSxNQUFNRixRQUFROzRCQUN0QzFCLFFBQVFvQixJQUFJLENBQUNWLElBQUksR0FBR2tCLE1BQU1ZLFdBQVcsSUFBSVosTUFBTUYsUUFBUTs0QkFDdkQsTUFBTXdCLFVBQVUsTUFBTTFELCtDQUFNQSxDQUFDMkQsT0FBTyxDQUFDOUIsVUFBVSxDQUFDO2dDQUM5Q0MsT0FBTztvQ0FBRThCLEtBQUssQ0FBQyxXQUFXLEVBQUVSLE1BQU1QLE9BQU8sQ0FBQyxDQUFDO2dDQUFDO2dDQUM1Q1ksUUFBUTtvQ0FBRUksT0FBTztnQ0FBSzs0QkFDeEI7NEJBQ0FyRCxRQUFRb0IsSUFBSSxDQUFDa0MsV0FBVyxHQUFHSixTQUFTRyxTQUFTO3dCQUMvQztvQkFDRixFQUFFLE9BQU07d0JBQ05yRCxRQUFRb0IsSUFBSSxDQUFDa0MsV0FBVyxHQUFHO29CQUM3QjtnQkFDRjtZQUNGO1lBQ0EsT0FBT3REO1FBQ1Q7SUFDRjtJQUNBdUQsT0FBTztRQUNMQyxRQUFRO0lBQ1Y7QUFDRixFQUFFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcXVpendlYi8uL3NyYy9saWIvYXV0aC5qcz84N2JkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHb29nbGVQcm92aWRlciBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9nb29nbGVcIjtcclxuaW1wb3J0IENyZWRlbnRpYWxzUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvY3JlZGVudGlhbHNcIjtcclxuaW1wb3J0IHsgUHJpc21hQWRhcHRlciB9IGZyb20gXCJAbmV4dC1hdXRoL3ByaXNtYS1hZGFwdGVyXCI7XHJcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcclxuaW1wb3J0IGJjcnlwdCBmcm9tIFwiYmNyeXB0anNcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9ucyA9IHtcclxuICBhZGFwdGVyOiBQcmlzbWFBZGFwdGVyKHByaXNtYSksXHJcbiAgc2VjcmV0OiBwcm9jZXNzLmVudi5ORVhUQVVUSF9TRUNSRVQsXHJcbiAgc2Vzc2lvbjogeyBcclxuICAgIHN0cmF0ZWd5OiBcImp3dFwiLFxyXG4gICAgbWF4QWdlOiAzMCAqIDI0ICogNjAgKiA2MCwgLy8gMzAgZGF5c1xyXG4gIH0sXHJcbiAgcHJvdmlkZXJzOiBbXHJcbiAgICAvLyBHb29nbGUgT0F1dGhcclxuICAgIEdvb2dsZVByb3ZpZGVyKHtcclxuICAgICAgY2xpZW50SWQ6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQsXHJcbiAgICAgIGNsaWVudFNlY3JldDogcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9TRUNSRVQsXHJcbiAgICAgIGFsbG93RGFuZ2Vyb3VzRW1haWxBY2NvdW50TGlua2luZzogdHJ1ZSxcclxuICAgIH0pLFxyXG4gICAgLy8gVXNlciBsb2dpbiB3aXRoIEVtYWlsIFBJTlxyXG4gICAgQ3JlZGVudGlhbHNQcm92aWRlcih7XHJcbiAgICAgIGlkOiBcImVtYWlsLXBpblwiLFxyXG4gICAgICBuYW1lOiBcIkVtYWlsIFBJTlwiLFxyXG4gICAgICBjcmVkZW50aWFsczoge1xyXG4gICAgICAgIGVtYWlsOiB7IGxhYmVsOiBcIkVtYWlsXCIsIHR5cGU6IFwiZW1haWxcIiB9LFxyXG4gICAgICAgIHBpbjogeyBsYWJlbDogXCJQSU5cIiwgdHlwZTogXCJ0ZXh0XCIgfSxcclxuICAgICAgICBpc05ld1VzZXI6IHsgbGFiZWw6IFwiSXMgTmV3IFVzZXJcIiwgdHlwZTogXCJ0ZXh0XCIgfSwgLy8gXCJ0cnVlXCIgb3IgXCJmYWxzZVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIGFzeW5jIGF1dGhvcml6ZShjcmVkZW50aWFscykge1xyXG4gICAgICAgIGlmICghY3JlZGVudGlhbHM/LmVtYWlsIHx8ICFjcmVkZW50aWFscz8ucGluKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBlbWFpbCA9IGNyZWRlbnRpYWxzLmVtYWlsLnRyaW0oKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGNvbnN0IHBpbiA9IGNyZWRlbnRpYWxzLnBpbi50cmltKCk7XHJcblxyXG4gICAgICAgIC8vIEZpbmQgdXNlclxyXG4gICAgICAgIGxldCB1c2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7IHdoZXJlOiB7IGVtYWlsIH0gfSk7XHJcblxyXG4gICAgICAgIGlmIChjcmVkZW50aWFscy5pc05ld1VzZXIgPT09IFwidHJ1ZVwiKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZXcgdXNlciByZWdpc3RyYXRpb24gaXMgYWRtaW5pc3RyYXRpdmVseSByZXN0cmljdGVkLlwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKCF1c2VyKSB0aHJvdyBuZXcgRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICAgIGlmICghdXNlci5waW4pIHRocm93IG5ldyBFcnJvcihcIk5vIFBJTiBzZXQgZm9yIHRoaXMgYWNjb3VudC4gUGxlYXNlIGNvbnRhY3QgYWRtaW4uXCIpO1xyXG4gICAgICAgICAgaWYgKHVzZXIucGluICE9PSBwaW4pIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgUElOXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGlkOiB1c2VyLmlkLFxyXG4gICAgICAgICAgbmFtZTogdXNlci5uYW1lLFxyXG4gICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXHJcbiAgICAgICAgICBpbWFnZTogdXNlci5pbWFnZSB8fCB1c2VyLmF2YXRhcixcclxuICAgICAgICAgIHBpbjogdXNlci5waW4sIC8vIEluY2x1ZGUgUElOIGZvciBhZG1pbiB2aWV3IGlmIG5lZWRlZCBpbiBzZXNzaW9uXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgLy8gQWRtaW4gbG9naW4gKGtlcHQgc2VwYXJhdGUgZm9yIG1hbmFnZW1lbnQpXHJcbiAgICBDcmVkZW50aWFsc1Byb3ZpZGVyKHtcclxuICAgICAgaWQ6IFwiYWRtaW4tbG9naW5cIixcclxuICAgICAgbmFtZTogXCJBZG1pbiBMb2dpblwiLFxyXG4gICAgICBjcmVkZW50aWFsczoge1xyXG4gICAgICAgIHVzZXJuYW1lOiB7IGxhYmVsOiBcIlVzZXJuYW1lXCIsIHR5cGU6IFwidGV4dFwiIH0sXHJcbiAgICAgICAgcGFzc3dvcmQ6IHsgbGFiZWw6IFwiUGFzc3dvcmRcIiwgdHlwZTogXCJwYXNzd29yZFwiIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIGFzeW5jIGF1dGhvcml6ZShjcmVkZW50aWFscykge1xyXG4gICAgICAgIGlmICghY3JlZGVudGlhbHM/LnVzZXJuYW1lIHx8ICFjcmVkZW50aWFscz8ucGFzc3dvcmQpIHJldHVybiBudWxsO1xyXG4gICAgICAgIGNvbnN0IGFkbWluID0gYXdhaXQgcHJpc21hLmFkbWluQWNjb3VudC5maW5kVW5pcXVlKHtcclxuICAgICAgICAgIHdoZXJlOiB7IHVzZXJuYW1lOiBjcmVkZW50aWFscy51c2VybmFtZSB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmICghYWRtaW4pIHJldHVybiBudWxsO1xyXG4gICAgICAgIGlmIChhZG1pbi5zdGF0dXMgIT09IFwiYWN0aXZlXCIpIHJldHVybiBudWxsO1xyXG4gICAgICAgIGNvbnN0IHZhbGlkID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUoY3JlZGVudGlhbHMucGFzc3dvcmQsIGFkbWluLnBhc3N3b3JkSGFzaCk7XHJcbiAgICAgICAgaWYgKCF2YWxpZCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIC8vIExvZyB0aGUgbG9naW5cclxuICAgICAgICBhd2FpdCBwcmlzbWEuYWRtaW5BY3Rpdml0eUxvZy5jcmVhdGUoe1xyXG4gICAgICAgICAgZGF0YTogeyBhZG1pbklkOiBhZG1pbi5pZCwgYWN0aW9uOiBcImxvZ2luXCIsIGRldGFpbHM6IFwiQWRtaW4gbG9nZ2VkIGluXCIgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGlkOiBhZG1pbi5pZCxcclxuICAgICAgICAgIG5hbWU6IGFkbWluLmRpc3BsYXlOYW1lIHx8IGFkbWluLnVzZXJuYW1lLFxyXG4gICAgICAgICAgZW1haWw6IGBhZG1pbjoke2FkbWluLnVzZXJuYW1lfWAsXHJcbiAgICAgICAgICByb2xlOiBhZG1pbi5yb2xlLFxyXG4gICAgICAgICAgYWRtaW5JZDogYWRtaW4uaWQsXHJcbiAgICAgICAgICB1c2VybmFtZTogYWRtaW4udXNlcm5hbWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgY2FsbGJhY2tzOiB7XHJcbiAgICBhc3luYyBqd3QoeyB0b2tlbiwgdXNlciwgYWNjb3VudCB9KSB7XHJcbiAgICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgdG9rZW4udXNlcklkID0gdXNlci5pZDtcclxuICAgICAgICBpZiAoYWNjb3VudD8ucHJvdmlkZXIgPT09IFwiYWRtaW4tbG9naW5cIikge1xyXG4gICAgICAgICAgdG9rZW4ucm9sZSA9IHVzZXIucm9sZTtcclxuICAgICAgICAgIHRva2VuLmFkbWluSWQgPSB1c2VyLmFkbWluSWQ7XHJcbiAgICAgICAgICB0b2tlbi51c2VybmFtZSA9IHVzZXIudXNlcm5hbWU7XHJcbiAgICAgICAgICB0b2tlbi5pc0FkbWluID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdG9rZW4ucm9sZSA9IFwidXNlclwiO1xyXG4gICAgICAgICAgdG9rZW4uaXNBZG1pbiA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdG9rZW47XHJcbiAgICB9LFxyXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcclxuICAgICAgaWYgKHNlc3Npb24udXNlcikge1xyXG4gICAgICAgIHNlc3Npb24udXNlci5pZCA9IHRva2VuLnVzZXJJZDtcclxuICAgICAgICBzZXNzaW9uLnVzZXIucm9sZSA9IHRva2VuLnJvbGU7XHJcbiAgICAgICAgc2Vzc2lvbi51c2VyLmlzQWRtaW4gPSB0b2tlbi5pc0FkbWluO1xyXG4gICAgICAgIGlmICh0b2tlbi5pc0FkbWluKSB7XHJcbiAgICAgICAgICBzZXNzaW9uLnVzZXIuYWRtaW5JZCA9IHRva2VuLmFkbWluSWQ7XHJcbiAgICAgICAgICBzZXNzaW9uLnVzZXIudXNlcm5hbWUgPSB0b2tlbi51c2VybmFtZTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFkbWluID0gYXdhaXQgcHJpc21hLmFkbWluQWNjb3VudC5maW5kVW5pcXVlKHtcclxuICAgICAgICAgICAgICB3aGVyZTogeyBpZDogdG9rZW4uYWRtaW5JZCB9LFxyXG4gICAgICAgICAgICAgIHNlbGVjdDogeyByb2xlOiB0cnVlLCBzdGF0dXM6IHRydWUsIGRpc3BsYXlOYW1lOiB0cnVlLCB1c2VybmFtZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGFkbWluPy5zdGF0dXMgIT09IFwiYWN0aXZlXCIpIHtcclxuICAgICAgICAgICAgICBzZXNzaW9uLnVzZXIuaXNBZG1pbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHNlc3Npb24udXNlci5yb2xlID0gYWRtaW4ucm9sZTtcclxuICAgICAgICAgICAgICBzZXNzaW9uLnVzZXIudXNlcm5hbWUgPSBhZG1pbi51c2VybmFtZTtcclxuICAgICAgICAgICAgICBzZXNzaW9uLnVzZXIubmFtZSA9IGFkbWluLmRpc3BsYXlOYW1lIHx8IGFkbWluLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHBlcm1Sb3cgPSBhd2FpdCBwcmlzbWEuc2V0dGluZy5maW5kVW5pcXVlKHtcclxuICAgICAgICAgICAgICAgIHdoZXJlOiB7IGtleTogYGFkbWluUGVybXM6JHt0b2tlbi5hZG1pbklkfWAgfSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdDogeyB2YWx1ZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIHNlc3Npb24udXNlci5wZXJtaXNzaW9ucyA9IHBlcm1Sb3c/LnZhbHVlIHx8IFwie31cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHNlc3Npb24udXNlci5wZXJtaXNzaW9ucyA9IFwie31cIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHNlc3Npb247XHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcGFnZXM6IHtcclxuICAgIHNpZ25JbjogXCIvc2lnbmluXCIsXHJcbiAgfSxcclxufTtcclxuIl0sIm5hbWVzIjpbIkdvb2dsZVByb3ZpZGVyIiwiQ3JlZGVudGlhbHNQcm92aWRlciIsIlByaXNtYUFkYXB0ZXIiLCJwcmlzbWEiLCJiY3J5cHQiLCJhdXRoT3B0aW9ucyIsImFkYXB0ZXIiLCJzZWNyZXQiLCJwcm9jZXNzIiwiZW52IiwiTkVYVEFVVEhfU0VDUkVUIiwic2Vzc2lvbiIsInN0cmF0ZWd5IiwibWF4QWdlIiwicHJvdmlkZXJzIiwiY2xpZW50SWQiLCJHT09HTEVfQ0xJRU5UX0lEIiwiY2xpZW50U2VjcmV0IiwiR09PR0xFX0NMSUVOVF9TRUNSRVQiLCJhbGxvd0Rhbmdlcm91c0VtYWlsQWNjb3VudExpbmtpbmciLCJpZCIsIm5hbWUiLCJjcmVkZW50aWFscyIsImVtYWlsIiwibGFiZWwiLCJ0eXBlIiwicGluIiwiaXNOZXdVc2VyIiwiYXV0aG9yaXplIiwidHJpbSIsInRvTG93ZXJDYXNlIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsIkVycm9yIiwiaW1hZ2UiLCJhdmF0YXIiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiYWRtaW4iLCJhZG1pbkFjY291bnQiLCJzdGF0dXMiLCJ2YWxpZCIsImNvbXBhcmUiLCJwYXNzd29yZEhhc2giLCJhZG1pbkFjdGl2aXR5TG9nIiwiY3JlYXRlIiwiZGF0YSIsImFkbWluSWQiLCJhY3Rpb24iLCJkZXRhaWxzIiwiZGlzcGxheU5hbWUiLCJyb2xlIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJhY2NvdW50IiwidXNlcklkIiwicHJvdmlkZXIiLCJpc0FkbWluIiwic2VsZWN0IiwicGVybVJvdyIsInNldHRpbmciLCJrZXkiLCJ2YWx1ZSIsInBlcm1pc3Npb25zIiwicGFnZXMiLCJzaWduSW4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.js\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.js":
/*!***************************!*\
  !*** ./src/lib/prisma.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\n// Add a connection timeout to prevent the build from hanging if the DB is unreachable\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log:  true ? [\n        \"query\",\n        \"error\",\n        \"warn\"\n    ] : 0\n});\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQThDO0FBRTlDLE1BQU1DLGtCQUFrQkM7QUFFeEIsc0ZBQXNGO0FBQy9FLE1BQU1DLFNBQVNGLGdCQUFnQkUsTUFBTSxJQUFJLElBQUlILHdEQUFZQSxDQUFDO0lBQy9ESSxLQUFLQyxLQUFzQyxHQUFHO1FBQUM7UUFBUztRQUFTO0tBQU8sR0FBRyxDQUFTO0FBQ3RGLEdBQUc7QUFFSCxJQUFJQSxJQUFxQyxFQUFFO0lBQ3pDSixnQkFBZ0JFLE1BQU0sR0FBR0E7QUFDM0I7QUFFQSxpRUFBZUEsTUFBTUEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3F1aXp3ZWIvLi9zcmMvbGliL3ByaXNtYS5qcz9lY2UyIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xyXG5cclxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsVGhpcztcclxuXHJcbi8vIEFkZCBhIGNvbm5lY3Rpb24gdGltZW91dCB0byBwcmV2ZW50IHRoZSBidWlsZCBmcm9tIGhhbmdpbmcgaWYgdGhlIERCIGlzIHVucmVhY2hhYmxlXHJcbmV4cG9ydCBjb25zdCBwcmlzbWEgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID8/IG5ldyBQcmlzbWFDbGllbnQoe1xyXG4gIGxvZzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IFtcInF1ZXJ5XCIsIFwiZXJyb3JcIiwgXCJ3YXJuXCJdIDogW1wiZXJyb3JcIl0sXHJcbn0pO1xyXG5cclxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIikge1xyXG4gIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWE7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHByaXNtYTsiXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsVGhpcyIsInByaXNtYSIsImxvZyIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();