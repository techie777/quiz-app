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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.js\");\n\n\n\n\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma),\n    secret: process.env.NEXTAUTH_SECRET,\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60\n    },\n    providers: [\n        // Google OAuth\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET,\n            allowDangerousEmailAccountLinking: true\n        }),\n        // User login with Email PIN\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"email-pin\",\n            name: \"Email PIN\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                pin: {\n                    label: \"PIN\",\n                    type: \"text\"\n                },\n                isNewUser: {\n                    label: \"Is New User\",\n                    type: \"text\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.pin) return null;\n                const email = credentials.email.trim().toLowerCase();\n                const pin = credentials.pin.trim();\n                // Find user\n                let user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.findUnique({\n                    where: {\n                        email\n                    }\n                });\n                if (credentials.isNewUser === \"true\") {\n                    throw new Error(\"New user registration is administratively restricted.\");\n                } else {\n                    if (!user) throw new Error(\"User not found\");\n                    if (!user.pin) throw new Error(\"No PIN set for this account. Please contact admin.\");\n                    if (user.pin !== pin) throw new Error(\"Invalid PIN\");\n                }\n                return {\n                    id: user.id,\n                    name: user.name,\n                    email: user.email,\n                    image: user.image || user.avatar,\n                    pin: user.pin\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user, account }) {\n            if (user) {\n                token.userId = user.id;\n                token.role = \"user\";\n                token.isAdmin = false;\n                // Enforce 1-user-1-device: bump sessionVersion on each fresh sign-in.\n                // Old tokens will become invalid when their sessionVersion mismatches.\n                try {\n                    const updated = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.update({\n                        where: {\n                            id: user.id\n                        },\n                        data: {\n                            sessionVersion: {\n                                increment: 1\n                            },\n                            lastLoginAt: new Date()\n                        },\n                        select: {\n                            sessionVersion: true\n                        }\n                    });\n                    token.sessionVersion = updated.sessionVersion;\n                } catch  {\n                    // If DB is temporarily unavailable, fall back to existing token behavior.\n                    token.sessionVersion = token.sessionVersion ?? 0;\n                }\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.userId;\n                session.user.role = token.role;\n                session.user.isAdmin = token.isAdmin;\n                // Validate sessionVersion against DB for single-device enforcement.\n                try {\n                    const row = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.findUnique({\n                        where: {\n                            id: token.userId\n                        },\n                        select: {\n                            sessionVersion: true\n                        }\n                    });\n                    const dbV = row?.sessionVersion ?? 0;\n                    const tokV = Number.isFinite(token.sessionVersion) ? token.sessionVersion : Number(token.sessionVersion ?? 0);\n                    if (tokV !== dbV) {\n                        return null;\n                    }\n                } catch  {\n                // If DB read fails, don't hard-lock users out.\n                }\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/signin\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QixLQUFLLEVBQUU7WUFDOUIsSUFBSTVCLFFBQVFvQixJQUFJLEVBQUU7Z0JBQ2hCcEIsUUFBUW9CLElBQUksQ0FBQ1gsRUFBRSxHQUFHbUIsTUFBTUUsTUFBTTtnQkFDOUI5QixRQUFRb0IsSUFBSSxDQUFDVyxJQUFJLEdBQUdILE1BQU1HLElBQUk7Z0JBQzlCL0IsUUFBUW9CLElBQUksQ0FBQ1ksT0FBTyxHQUFHSixNQUFNSSxPQUFPO2dCQUVwQyxvRUFBb0U7Z0JBQ3BFLElBQUk7b0JBQ0YsTUFBTVMsTUFBTSxNQUFNaEQsK0NBQU1BLENBQUMyQixJQUFJLENBQUNDLFVBQVUsQ0FBQzt3QkFDdkNDLE9BQU87NEJBQUViLElBQUltQixNQUFNRSxNQUFNO3dCQUFDO3dCQUMxQlUsUUFBUTs0QkFBRUosZ0JBQWdCO3dCQUFLO29CQUNqQztvQkFDQSxNQUFNTSxNQUFNRCxLQUFLTCxrQkFBa0I7b0JBQ25DLE1BQU1PLE9BQU9DLE9BQU9DLFFBQVEsQ0FBQ2pCLE1BQU1RLGNBQWMsSUFBSVIsTUFBTVEsY0FBYyxHQUFHUSxPQUFPaEIsTUFBTVEsY0FBYyxJQUFJO29CQUMzRyxJQUFJTyxTQUFTRCxLQUFLO3dCQUNoQixPQUFPO29CQUNUO2dCQUNGLEVBQUUsT0FBTTtnQkFDTiwrQ0FBK0M7Z0JBQ2pEO1lBQ0Y7WUFDQSxPQUFPMUM7UUFDVDtJQUNGO0lBQ0E4QyxPQUFPO1FBQ0xDLFFBQVE7SUFDVjtBQUNGLEVBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9xdWl6d2ViLy4vc3JjL2xpYi9hdXRoLmpzPzg3YmQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdvb2dsZVByb3ZpZGVyIGZyb20gXCJuZXh0LWF1dGgvcHJvdmlkZXJzL2dvb2dsZVwiO1xyXG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiO1xyXG5pbXBvcnQgeyBQcmlzbWFBZGFwdGVyIH0gZnJvbSBcIkBuZXh0LWF1dGgvcHJpc21hLWFkYXB0ZXJcIjtcclxuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IGF1dGhPcHRpb25zID0ge1xyXG4gIGFkYXB0ZXI6IFByaXNtYUFkYXB0ZXIocHJpc21hKSxcclxuICBzZWNyZXQ6IHByb2Nlc3MuZW52Lk5FWFRBVVRIX1NFQ1JFVCxcclxuICBzZXNzaW9uOiB7IFxyXG4gICAgc3RyYXRlZ3k6IFwiand0XCIsXHJcbiAgICBtYXhBZ2U6IDMwICogMjQgKiA2MCAqIDYwLCAvLyAzMCBkYXlzXHJcbiAgfSxcclxuICBwcm92aWRlcnM6IFtcclxuICAgIC8vIEdvb2dsZSBPQXV0aFxyXG4gICAgR29vZ2xlUHJvdmlkZXIoe1xyXG4gICAgICBjbGllbnRJZDogcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9JRCxcclxuICAgICAgY2xpZW50U2VjcmV0OiBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX1NFQ1JFVCxcclxuICAgICAgYWxsb3dEYW5nZXJvdXNFbWFpbEFjY291bnRMaW5raW5nOiB0cnVlLFxyXG4gICAgfSksXHJcbiAgICAvLyBVc2VyIGxvZ2luIHdpdGggRW1haWwgUElOXHJcbiAgICBDcmVkZW50aWFsc1Byb3ZpZGVyKHtcclxuICAgICAgaWQ6IFwiZW1haWwtcGluXCIsXHJcbiAgICAgIG5hbWU6IFwiRW1haWwgUElOXCIsXHJcbiAgICAgIGNyZWRlbnRpYWxzOiB7XHJcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6IFwiRW1haWxcIiwgdHlwZTogXCJlbWFpbFwiIH0sXHJcbiAgICAgICAgcGluOiB7IGxhYmVsOiBcIlBJTlwiLCB0eXBlOiBcInRleHRcIiB9LFxyXG4gICAgICAgIGlzTmV3VXNlcjogeyBsYWJlbDogXCJJcyBOZXcgVXNlclwiLCB0eXBlOiBcInRleHRcIiB9LCAvLyBcInRydWVcIiBvciBcImZhbHNlXCJcclxuICAgICAgfSxcclxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5waW4pIHJldHVybiBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGVtYWlsID0gY3JlZGVudGlhbHMuZW1haWwudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgY29uc3QgcGluID0gY3JlZGVudGlhbHMucGluLnRyaW0oKTtcclxuXHJcbiAgICAgICAgLy8gRmluZCB1c2VyXHJcbiAgICAgICAgbGV0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHsgd2hlcmU6IHsgZW1haWwgfSB9KTtcclxuXHJcbiAgICAgICAgaWYgKGNyZWRlbnRpYWxzLmlzTmV3VXNlciA9PT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5ldyB1c2VyIHJlZ2lzdHJhdGlvbiBpcyBhZG1pbmlzdHJhdGl2ZWx5IHJlc3RyaWN0ZWQuXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIXVzZXIpIHRocm93IG5ldyBFcnJvcihcIlVzZXIgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgICAgaWYgKCF1c2VyLnBpbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gUElOIHNldCBmb3IgdGhpcyBhY2NvdW50LiBQbGVhc2UgY29udGFjdCBhZG1pbi5cIik7XHJcbiAgICAgICAgICBpZiAodXNlci5waW4gIT09IHBpbikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBQSU5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaWQ6IHVzZXIuaWQsXHJcbiAgICAgICAgICBuYW1lOiB1c2VyLm5hbWUsXHJcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcclxuICAgICAgICAgIGltYWdlOiB1c2VyLmltYWdlIHx8IHVzZXIuYXZhdGFyLFxyXG4gICAgICAgICAgcGluOiB1c2VyLnBpbiwgLy8gSW5jbHVkZSBQSU4gZm9yIGFkbWluIHZpZXcgaWYgbmVlZGVkIGluIHNlc3Npb25cclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBjYWxsYmFja3M6IHtcclxuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyLCBhY2NvdW50IH0pIHtcclxuICAgICAgaWYgKHVzZXIpIHtcclxuICAgICAgICB0b2tlbi51c2VySWQgPSB1c2VyLmlkO1xyXG4gICAgICAgIHRva2VuLnJvbGUgPSBcInVzZXJcIjtcclxuICAgICAgICB0b2tlbi5pc0FkbWluID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIEVuZm9yY2UgMS11c2VyLTEtZGV2aWNlOiBidW1wIHNlc3Npb25WZXJzaW9uIG9uIGVhY2ggZnJlc2ggc2lnbi1pbi5cclxuICAgICAgICAvLyBPbGQgdG9rZW5zIHdpbGwgYmVjb21lIGludmFsaWQgd2hlbiB0aGVpciBzZXNzaW9uVmVyc2lvbiBtaXNtYXRjaGVzLlxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgcHJpc21hLnVzZXIudXBkYXRlKHtcclxuICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXIuaWQgfSxcclxuICAgICAgICAgICAgZGF0YTogeyBzZXNzaW9uVmVyc2lvbjogeyBpbmNyZW1lbnQ6IDEgfSwgbGFzdExvZ2luQXQ6IG5ldyBEYXRlKCkgfSxcclxuICAgICAgICAgICAgc2VsZWN0OiB7IHNlc3Npb25WZXJzaW9uOiB0cnVlIH0sXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHRva2VuLnNlc3Npb25WZXJzaW9uID0gdXBkYXRlZC5zZXNzaW9uVmVyc2lvbjtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgIC8vIElmIERCIGlzIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlLCBmYWxsIGJhY2sgdG8gZXhpc3RpbmcgdG9rZW4gYmVoYXZpb3IuXHJcbiAgICAgICAgICB0b2tlbi5zZXNzaW9uVmVyc2lvbiA9IHRva2VuLnNlc3Npb25WZXJzaW9uID8/IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0b2tlbjtcclxuICAgIH0sXHJcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xyXG4gICAgICBpZiAoc2Vzc2lvbi51c2VyKSB7XHJcbiAgICAgICAgc2Vzc2lvbi51c2VyLmlkID0gdG9rZW4udXNlcklkO1xyXG4gICAgICAgIHNlc3Npb24udXNlci5yb2xlID0gdG9rZW4ucm9sZTtcclxuICAgICAgICBzZXNzaW9uLnVzZXIuaXNBZG1pbiA9IHRva2VuLmlzQWRtaW47XHJcblxyXG4gICAgICAgIC8vIFZhbGlkYXRlIHNlc3Npb25WZXJzaW9uIGFnYWluc3QgREIgZm9yIHNpbmdsZS1kZXZpY2UgZW5mb3JjZW1lbnQuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHJvdyA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xyXG4gICAgICAgICAgICB3aGVyZTogeyBpZDogdG9rZW4udXNlcklkIH0sXHJcbiAgICAgICAgICAgIHNlbGVjdDogeyBzZXNzaW9uVmVyc2lvbjogdHJ1ZSB9LFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBjb25zdCBkYlYgPSByb3c/LnNlc3Npb25WZXJzaW9uID8/IDA7XHJcbiAgICAgICAgICBjb25zdCB0b2tWID0gTnVtYmVyLmlzRmluaXRlKHRva2VuLnNlc3Npb25WZXJzaW9uKSA/IHRva2VuLnNlc3Npb25WZXJzaW9uIDogTnVtYmVyKHRva2VuLnNlc3Npb25WZXJzaW9uID8/IDApO1xyXG4gICAgICAgICAgaWYgKHRva1YgIT09IGRiVikge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgIC8vIElmIERCIHJlYWQgZmFpbHMsIGRvbid0IGhhcmQtbG9jayB1c2VycyBvdXQuXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzZXNzaW9uO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIHBhZ2VzOiB7XHJcbiAgICBzaWduSW46IFwiL3NpZ25pblwiLFxyXG4gIH0sXHJcbn07XHJcbiJdLCJuYW1lcyI6WyJHb29nbGVQcm92aWRlciIsIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJQcmlzbWFBZGFwdGVyIiwicHJpc21hIiwiYXV0aE9wdGlvbnMiLCJhZGFwdGVyIiwic2VjcmV0IiwicHJvY2VzcyIsImVudiIsIk5FWFRBVVRIX1NFQ1JFVCIsInNlc3Npb24iLCJzdHJhdGVneSIsIm1heEFnZSIsInByb3ZpZGVycyIsImNsaWVudElkIiwiR09PR0xFX0NMSUVOVF9JRCIsImNsaWVudFNlY3JldCIsIkdPT0dMRV9DTElFTlRfU0VDUkVUIiwiYWxsb3dEYW5nZXJvdXNFbWFpbEFjY291bnRMaW5raW5nIiwiaWQiLCJuYW1lIiwiY3JlZGVudGlhbHMiLCJlbWFpbCIsImxhYmVsIiwidHlwZSIsInBpbiIsImlzTmV3VXNlciIsImF1dGhvcml6ZSIsInRyaW0iLCJ0b0xvd2VyQ2FzZSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJFcnJvciIsImltYWdlIiwiYXZhdGFyIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJhY2NvdW50IiwidXNlcklkIiwicm9sZSIsImlzQWRtaW4iLCJ1cGRhdGVkIiwidXBkYXRlIiwiZGF0YSIsInNlc3Npb25WZXJzaW9uIiwiaW5jcmVtZW50IiwibGFzdExvZ2luQXQiLCJEYXRlIiwic2VsZWN0Iiwicm93IiwiZGJWIiwidG9rViIsIk51bWJlciIsImlzRmluaXRlIiwicGFnZXMiLCJzaWduSW4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.js\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5CAll%20Projects%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();