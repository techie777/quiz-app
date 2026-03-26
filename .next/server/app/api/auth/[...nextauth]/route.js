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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_TECHIE777_Desktop_quiz_app_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/[...nextauth]/route.js */ \"(rsc)/./src/app/api/auth/[...nextauth]/route.js\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\TECHIE777\\\\Desktop\\\\quiz-app\\\\src\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.js\",\n    nextConfigOutput,\n    userland: C_Users_TECHIE777_Desktop_quiz_app_src_app_api_auth_nextauth_route_js__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkYlNUIuLi5uZXh0YXV0aCU1RCUyRnJvdXRlLmpzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNURUNISUU3NzclNUNEZXNrdG9wJTVDcXVpei1hcHAlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q1RFQ0hJRTc3NyU1Q0Rlc2t0b3AlNUNxdWl6LWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDcUM7QUFDbEg7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9xdWl6d2ViLz9lODQ1Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXFRFQ0hJRTc3N1xcXFxEZXNrdG9wXFxcXHF1aXotYXBwXFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxcWy4uLm5leHRhdXRoXVxcXFxyb3V0ZS5qc1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxURUNISUU3NzdcXFxcRGVza3RvcFxcXFxxdWl6LWFwcFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUuanNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n\n\n\n\n\n// Only include Google provider if real credentials are configured\nconst googleId = process.env.GOOGLE_CLIENT_ID ?? \"\";\nconst googleSecret = process.env.GOOGLE_CLIENT_SECRET ?? \"\";\nconst hasGoogleCreds = googleId && !googleId.startsWith(\"your-\") && googleSecret && !googleSecret.startsWith(\"your-\");\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma),\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60,\n        updateAge: 24 * 60 * 60\n    },\n    providers: [\n        // Google OAuth\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET\n        }),\n        // User login with Email PIN\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"email-pin\",\n            name: \"Email PIN\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                pin: {\n                    label: \"PIN\",\n                    type: \"text\"\n                },\n                isNewUser: {\n                    label: \"Is New User\",\n                    type: \"text\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.pin) return null;\n                const email = credentials.email.trim().toLowerCase();\n                const pin = credentials.pin.trim();\n                // Find user\n                let user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.findUnique({\n                    where: {\n                        email\n                    }\n                });\n                if (credentials.isNewUser === \"true\") {\n                    if (user) throw new Error(\"User already exists\");\n                    // Create new user with PIN\n                    user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.create({\n                        data: {\n                            email,\n                            pin,\n                            name: email.split(\"@\")[0]\n                        }\n                    });\n                } else {\n                    if (!user) throw new Error(\"User not found\");\n                    if (!user.pin) throw new Error(\"No PIN set for this account. Please contact admin.\");\n                    if (user.pin !== pin) throw new Error(\"Invalid PIN\");\n                }\n                return {\n                    id: user.id,\n                    name: user.name,\n                    email: user.email,\n                    image: user.image || user.avatar,\n                    pin: user.pin\n                };\n            }\n        }),\n        // Admin login (kept separate for management)\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"admin-login\",\n            name: \"Admin Login\",\n            credentials: {\n                username: {\n                    label: \"Username\",\n                    type: \"text\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.username || !credentials?.password) return null;\n                const admin = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminAccount.findUnique({\n                    where: {\n                        username: credentials.username\n                    }\n                });\n                if (!admin) return null;\n                if (admin.status !== \"active\") return null;\n                const valid = await bcryptjs__WEBPACK_IMPORTED_MODULE_4__[\"default\"].compare(credentials.password, admin.passwordHash);\n                if (!valid) return null;\n                // Log the login\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminActivityLog.create({\n                    data: {\n                        adminId: admin.id,\n                        action: \"login\",\n                        details: \"Admin logged in\"\n                    }\n                });\n                return {\n                    id: admin.id,\n                    name: admin.displayName || admin.username,\n                    email: `admin:${admin.username}`,\n                    role: admin.role,\n                    adminId: admin.id,\n                    username: admin.username\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user, account }) {\n            if (user) {\n                token.userId = user.id;\n                if (account?.provider === \"admin-login\") {\n                    token.role = user.role;\n                    token.adminId = user.adminId;\n                    token.username = user.username;\n                    token.isAdmin = true;\n                } else {\n                    token.role = \"user\";\n                    token.isAdmin = false;\n                }\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.userId;\n                session.user.role = token.role;\n                session.user.isAdmin = token.isAdmin;\n                if (token.isAdmin) {\n                    session.user.adminId = token.adminId;\n                    session.user.username = token.username;\n                    try {\n                        const admin = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminAccount.findUnique({\n                            where: {\n                                id: token.adminId\n                            },\n                            select: {\n                                role: true,\n                                status: true,\n                                displayName: true,\n                                username: true\n                            }\n                        });\n                        if (admin?.status !== \"active\") {\n                            session.user.isAdmin = false;\n                        } else {\n                            session.user.role = admin.role;\n                            session.user.username = admin.username;\n                            session.user.name = admin.displayName || admin.username;\n                            const permRow = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.setting.findUnique({\n                                where: {\n                                    key: `adminPerms:${token.adminId}`\n                                },\n                                select: {\n                                    value: true\n                                }\n                            });\n                            session.user.permissions = permRow?.value || \"{}\";\n                        }\n                    } catch  {\n                        session.user.permissions = \"{}\";\n                    }\n                }\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/signin\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QU1zQixVQUFVLE1BQU03RCwrQ0FBTUEsQ0FBQzhELE9BQU8sQ0FBQy9CLFVBQVUsQ0FBQztnQ0FDOUNDLE9BQU87b0NBQUUrQixLQUFLLENBQUMsV0FBVyxFQUFFUixNQUFNUCxPQUFPLENBQUMsQ0FBQztnQ0FBQztnQ0FDNUNZLFFBQVE7b0NBQUVJLE9BQU87Z0NBQUs7NEJBQ3hCOzRCQUNBcEQsUUFBUWtCLElBQUksQ0FBQ21DLFdBQVcsR0FBR0osU0FBU0csU0FBUzt3QkFDL0M7b0JBQ0YsRUFBRSxPQUFNO3dCQUNOcEQsUUFBUWtCLElBQUksQ0FBQ21DLFdBQVcsR0FBRztvQkFDN0I7Z0JBQ0Y7WUFDRjtZQUNBLE9BQU9yRDtRQUNUO0lBQ0Y7SUFDQXNELE9BQU87UUFDTEMsUUFBUTtJQUNWO0FBQ0YsRUFBRSIsInNvdXJjZXMiOlsid2VicGFjazovL3F1aXp3ZWIvLi9zcmMvbGliL2F1dGguanM/ODdiZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR29vZ2xlUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvZ29vZ2xlXCI7XHJcbmltcG9ydCBDcmVkZW50aWFsc1Byb3ZpZGVyIGZyb20gXCJuZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzXCI7XHJcbmltcG9ydCB7IFByaXNtYUFkYXB0ZXIgfSBmcm9tIFwiQG5leHQtYXV0aC9wcmlzbWEtYWRhcHRlclwiO1xyXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiQC9saWIvcHJpc21hXCI7XHJcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XHJcblxyXG4vLyBPbmx5IGluY2x1ZGUgR29vZ2xlIHByb3ZpZGVyIGlmIHJlYWwgY3JlZGVudGlhbHMgYXJlIGNvbmZpZ3VyZWRcclxuY29uc3QgZ29vZ2xlSWQgPSBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX0lEID8/IFwiXCI7XHJcbmNvbnN0IGdvb2dsZVNlY3JldCA9IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfU0VDUkVUID8/IFwiXCI7XHJcbmNvbnN0IGhhc0dvb2dsZUNyZWRzID0gZ29vZ2xlSWQgJiYgIWdvb2dsZUlkLnN0YXJ0c1dpdGgoXCJ5b3VyLVwiKSAmJiBnb29nbGVTZWNyZXQgJiYgIWdvb2dsZVNlY3JldC5zdGFydHNXaXRoKFwieW91ci1cIik7XHJcblxyXG5leHBvcnQgY29uc3QgYXV0aE9wdGlvbnMgPSB7XHJcbiAgYWRhcHRlcjogUHJpc21hQWRhcHRlcihwcmlzbWEpLFxyXG4gIHNlc3Npb246IHsgXHJcbiAgICBzdHJhdGVneTogXCJqd3RcIixcclxuICAgIG1heEFnZTogMzAgKiAyNCAqIDYwICogNjAsIC8vIDMwIGRheXNcclxuICAgIHVwZGF0ZUFnZTogMjQgKiA2MCAqIDYwLCAvLyAyNCBob3Vyc1xyXG4gIH0sXHJcbiAgcHJvdmlkZXJzOiBbXHJcbiAgICAvLyBHb29nbGUgT0F1dGhcclxuICAgIEdvb2dsZVByb3ZpZGVyKHtcclxuICAgICAgY2xpZW50SWQ6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQsXHJcbiAgICAgIGNsaWVudFNlY3JldDogcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9TRUNSRVQsXHJcbiAgICB9KSxcclxuICAgIC8vIFVzZXIgbG9naW4gd2l0aCBFbWFpbCBQSU5cclxuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xyXG4gICAgICBpZDogXCJlbWFpbC1waW5cIixcclxuICAgICAgbmFtZTogXCJFbWFpbCBQSU5cIixcclxuICAgICAgY3JlZGVudGlhbHM6IHtcclxuICAgICAgICBlbWFpbDogeyBsYWJlbDogXCJFbWFpbFwiLCB0eXBlOiBcImVtYWlsXCIgfSxcclxuICAgICAgICBwaW46IHsgbGFiZWw6IFwiUElOXCIsIHR5cGU6IFwidGV4dFwiIH0sXHJcbiAgICAgICAgaXNOZXdVc2VyOiB7IGxhYmVsOiBcIklzIE5ldyBVc2VyXCIsIHR5cGU6IFwidGV4dFwiIH0sIC8vIFwidHJ1ZVwiIG9yIFwiZmFsc2VcIlxyXG4gICAgICB9LFxyXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcclxuICAgICAgICBpZiAoIWNyZWRlbnRpYWxzPy5lbWFpbCB8fCAhY3JlZGVudGlhbHM/LnBpbikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgZW1haWwgPSBjcmVkZW50aWFscy5lbWFpbC50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBjb25zdCBwaW4gPSBjcmVkZW50aWFscy5waW4udHJpbSgpO1xyXG5cclxuICAgICAgICAvLyBGaW5kIHVzZXJcclxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBlbWFpbCB9IH0pO1xyXG5cclxuICAgICAgICBpZiAoY3JlZGVudGlhbHMuaXNOZXdVc2VyID09PSBcInRydWVcIikge1xyXG4gICAgICAgICAgaWYgKHVzZXIpIHRocm93IG5ldyBFcnJvcihcIlVzZXIgYWxyZWFkeSBleGlzdHNcIik7XHJcbiAgICAgICAgICAvLyBDcmVhdGUgbmV3IHVzZXIgd2l0aCBQSU5cclxuICAgICAgICAgIHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5jcmVhdGUoe1xyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgZW1haWwsXHJcbiAgICAgICAgICAgICAgcGluLFxyXG4gICAgICAgICAgICAgIG5hbWU6IGVtYWlsLnNwbGl0KFwiQFwiKVswXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIXVzZXIpIHRocm93IG5ldyBFcnJvcihcIlVzZXIgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgICAgaWYgKCF1c2VyLnBpbikgdGhyb3cgbmV3IEVycm9yKFwiTm8gUElOIHNldCBmb3IgdGhpcyBhY2NvdW50LiBQbGVhc2UgY29udGFjdCBhZG1pbi5cIik7XHJcbiAgICAgICAgICBpZiAodXNlci5waW4gIT09IHBpbikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBQSU5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaWQ6IHVzZXIuaWQsXHJcbiAgICAgICAgICBuYW1lOiB1c2VyLm5hbWUsXHJcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcclxuICAgICAgICAgIGltYWdlOiB1c2VyLmltYWdlIHx8IHVzZXIuYXZhdGFyLFxyXG4gICAgICAgICAgcGluOiB1c2VyLnBpbiwgLy8gSW5jbHVkZSBQSU4gZm9yIGFkbWluIHZpZXcgaWYgbmVlZGVkIGluIHNlc3Npb25cclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgICAvLyBBZG1pbiBsb2dpbiAoa2VwdCBzZXBhcmF0ZSBmb3IgbWFuYWdlbWVudClcclxuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xyXG4gICAgICBpZDogXCJhZG1pbi1sb2dpblwiLFxyXG4gICAgICBuYW1lOiBcIkFkbWluIExvZ2luXCIsXHJcbiAgICAgIGNyZWRlbnRpYWxzOiB7XHJcbiAgICAgICAgdXNlcm5hbWU6IHsgbGFiZWw6IFwiVXNlcm5hbWVcIiwgdHlwZTogXCJ0ZXh0XCIgfSxcclxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCJQYXNzd29yZFwiLCB0eXBlOiBcInBhc3N3b3JkXCIgfSxcclxuICAgICAgfSxcclxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8udXNlcm5hbWUgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgY29uc3QgYWRtaW4gPSBhd2FpdCBwcmlzbWEuYWRtaW5BY2NvdW50LmZpbmRVbmlxdWUoe1xyXG4gICAgICAgICAgd2hlcmU6IHsgdXNlcm5hbWU6IGNyZWRlbnRpYWxzLnVzZXJuYW1lIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKCFhZG1pbikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgaWYgKGFkbWluLnN0YXR1cyAhPT0gXCJhY3RpdmVcIikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgY29uc3QgdmFsaWQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShjcmVkZW50aWFscy5wYXNzd29yZCwgYWRtaW4ucGFzc3dvcmRIYXNoKTtcclxuICAgICAgICBpZiAoIXZhbGlkKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gTG9nIHRoZSBsb2dpblxyXG4gICAgICAgIGF3YWl0IHByaXNtYS5hZG1pbkFjdGl2aXR5TG9nLmNyZWF0ZSh7XHJcbiAgICAgICAgICBkYXRhOiB7IGFkbWluSWQ6IGFkbWluLmlkLCBhY3Rpb246IFwibG9naW5cIiwgZGV0YWlsczogXCJBZG1pbiBsb2dnZWQgaW5cIiB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgaWQ6IGFkbWluLmlkLFxyXG4gICAgICAgICAgbmFtZTogYWRtaW4uZGlzcGxheU5hbWUgfHwgYWRtaW4udXNlcm5hbWUsXHJcbiAgICAgICAgICBlbWFpbDogYGFkbWluOiR7YWRtaW4udXNlcm5hbWV9YCxcclxuICAgICAgICAgIHJvbGU6IGFkbWluLnJvbGUsXHJcbiAgICAgICAgICBhZG1pbklkOiBhZG1pbi5pZCxcclxuICAgICAgICAgIHVzZXJuYW1lOiBhZG1pbi51c2VybmFtZSxcclxuICAgICAgICB9O1xyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgXSxcclxuICBjYWxsYmFja3M6IHtcclxuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyLCBhY2NvdW50IH0pIHtcclxuICAgICAgaWYgKHVzZXIpIHtcclxuICAgICAgICB0b2tlbi51c2VySWQgPSB1c2VyLmlkO1xyXG4gICAgICAgIGlmIChhY2NvdW50Py5wcm92aWRlciA9PT0gXCJhZG1pbi1sb2dpblwiKSB7XHJcbiAgICAgICAgICB0b2tlbi5yb2xlID0gdXNlci5yb2xlO1xyXG4gICAgICAgICAgdG9rZW4uYWRtaW5JZCA9IHVzZXIuYWRtaW5JZDtcclxuICAgICAgICAgIHRva2VuLnVzZXJuYW1lID0gdXNlci51c2VybmFtZTtcclxuICAgICAgICAgIHRva2VuLmlzQWRtaW4gPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0b2tlbi5yb2xlID0gXCJ1c2VyXCI7XHJcbiAgICAgICAgICB0b2tlbi5pc0FkbWluID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0b2tlbjtcclxuICAgIH0sXHJcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xyXG4gICAgICBpZiAoc2Vzc2lvbi51c2VyKSB7XHJcbiAgICAgICAgc2Vzc2lvbi51c2VyLmlkID0gdG9rZW4udXNlcklkO1xyXG4gICAgICAgIHNlc3Npb24udXNlci5yb2xlID0gdG9rZW4ucm9sZTtcclxuICAgICAgICBzZXNzaW9uLnVzZXIuaXNBZG1pbiA9IHRva2VuLmlzQWRtaW47XHJcbiAgICAgICAgaWYgKHRva2VuLmlzQWRtaW4pIHtcclxuICAgICAgICAgIHNlc3Npb24udXNlci5hZG1pbklkID0gdG9rZW4uYWRtaW5JZDtcclxuICAgICAgICAgIHNlc3Npb24udXNlci51c2VybmFtZSA9IHRva2VuLnVzZXJuYW1lO1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgYWRtaW4gPSBhd2FpdCBwcmlzbWEuYWRtaW5BY2NvdW50LmZpbmRVbmlxdWUoe1xyXG4gICAgICAgICAgICAgIHdoZXJlOiB7IGlkOiB0b2tlbi5hZG1pbklkIH0sXHJcbiAgICAgICAgICAgICAgc2VsZWN0OiB7IHJvbGU6IHRydWUsIHN0YXR1czogdHJ1ZSwgZGlzcGxheU5hbWU6IHRydWUsIHVzZXJuYW1lOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoYWRtaW4/LnN0YXR1cyAhPT0gXCJhY3RpdmVcIikge1xyXG4gICAgICAgICAgICAgIHNlc3Npb24udXNlci5pc0FkbWluID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc2Vzc2lvbi51c2VyLnJvbGUgPSBhZG1pbi5yb2xlO1xyXG4gICAgICAgICAgICAgIHNlc3Npb24udXNlci51c2VybmFtZSA9IGFkbWluLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgIHNlc3Npb24udXNlci5uYW1lID0gYWRtaW4uZGlzcGxheU5hbWUgfHwgYWRtaW4udXNlcm5hbWU7XHJcbiAgICAgICAgICAgICAgY29uc3QgcGVybVJvdyA9IGF3YWl0IHByaXNtYS5zZXR0aW5nLmZpbmRVbmlxdWUoe1xyXG4gICAgICAgICAgICAgICAgd2hlcmU6IHsga2V5OiBgYWRtaW5QZXJtczoke3Rva2VuLmFkbWluSWR9YCB9LFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0OiB7IHZhbHVlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgc2Vzc2lvbi51c2VyLnBlcm1pc3Npb25zID0gcGVybVJvdz8udmFsdWUgfHwgXCJ7fVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgc2Vzc2lvbi51c2VyLnBlcm1pc3Npb25zID0gXCJ7fVwiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc2Vzc2lvbjtcclxuICAgIH0sXHJcbiAgfSxcclxuICBwYWdlczoge1xyXG4gICAgc2lnbkluOiBcIi9zaWduaW5cIixcclxuICB9LFxyXG59O1xyXG4iXSwibmFtZXMiOlsiR29vZ2xlUHJvdmlkZXIiLCJDcmVkZW50aWFsc1Byb3ZpZGVyIiwiUHJpc21hQWRhcHRlciIsInByaXNtYSIsImJjcnlwdCIsImdvb2dsZUlkIiwicHJvY2VzcyIsImVudiIsIkdPT0dMRV9DTElFTlRfSUQiLCJnb29nbGVTZWNyZXQiLCJHT09HTEVfQ0xJRU5UX1NFQ1JFVCIsImhhc0dvb2dsZUNyZWRzIiwic3RhcnRzV2l0aCIsImF1dGhPcHRpb25zIiwiYWRhcHRlciIsInNlc3Npb24iLCJzdHJhdGVneSIsIm1heEFnZSIsInVwZGF0ZUFnZSIsInByb3ZpZGVycyIsImNsaWVudElkIiwiY2xpZW50U2VjcmV0IiwiaWQiLCJuYW1lIiwiY3JlZGVudGlhbHMiLCJlbWFpbCIsImxhYmVsIiwidHlwZSIsInBpbiIsImlzTmV3VXNlciIsImF1dGhvcml6ZSIsInRyaW0iLCJ0b0xvd2VyQ2FzZSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJFcnJvciIsImNyZWF0ZSIsImRhdGEiLCJzcGxpdCIsImltYWdlIiwiYXZhdGFyIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImFkbWluIiwiYWRtaW5BY2NvdW50Iiwic3RhdHVzIiwidmFsaWQiLCJjb21wYXJlIiwicGFzc3dvcmRIYXNoIiwiYWRtaW5BY3Rpdml0eUxvZyIsImFkbWluSWQiLCJhY3Rpb24iLCJkZXRhaWxzIiwiZGlzcGxheU5hbWUiLCJyb2xlIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJhY2NvdW50IiwidXNlcklkIiwicHJvdmlkZXIiLCJpc0FkbWluIiwic2VsZWN0IiwicGVybVJvdyIsInNldHRpbmciLCJrZXkiLCJ2YWx1ZSIsInBlcm1pc3Npb25zIiwicGFnZXMiLCJzaWduSW4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.js\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.js":
/*!***************************!*\
  !*** ./src/lib/prisma.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBOEM7QUFFOUMsTUFBTUMsa0JBQWtCQztBQUVqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFBSSxJQUFJSCx3REFBWUEsR0FBRztBQUVuRSxJQUFJSSxJQUFxQyxFQUFFO0lBQ3pDSCxnQkFBZ0JFLE1BQU0sR0FBR0E7QUFDM0IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9xdWl6d2ViLy4vc3JjL2xpYi9wcmlzbWEuanM/ZWNlMiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIjtcclxuXHJcbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXM7XHJcblxyXG5leHBvcnQgY29uc3QgcHJpc21hID0gZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA/PyBuZXcgUHJpc21hQ2xpZW50KCk7XHJcblxyXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XHJcbiAgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYTtcclxufVxyXG4iXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsVGhpcyIsInByaXNtYSIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();