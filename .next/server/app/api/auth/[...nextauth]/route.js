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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/google */ \"(rsc)/./node_modules/next-auth/providers/google.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n\n\n\n\n\n// Only include Google provider if real credentials are configured\nconst googleId = process.env.GOOGLE_CLIENT_ID ?? \"\";\nconst googleSecret = process.env.GOOGLE_CLIENT_SECRET ?? \"\";\nconst hasGoogleCreds = googleId && !googleId.startsWith(\"your-\") && googleSecret && !googleSecret.startsWith(\"your-\");\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_2__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma),\n    session: {\n        strategy: \"jwt\",\n        maxAge: 30 * 24 * 60 * 60,\n        updateAge: 24 * 60 * 60\n    },\n    providers: [\n        // Google OAuth\n        (0,next_auth_providers_google__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            clientId: process.env.GOOGLE_CLIENT_ID,\n            clientSecret: process.env.GOOGLE_CLIENT_SECRET\n        }),\n        // User login with Email PIN\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"email-pin\",\n            name: \"Email PIN\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                pin: {\n                    label: \"PIN\",\n                    type: \"text\"\n                },\n                isNewUser: {\n                    label: \"Is New User\",\n                    type: \"text\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.pin) return null;\n                const email = credentials.email.trim().toLowerCase();\n                const pin = credentials.pin.trim();\n                // Find user\n                let user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.findUnique({\n                    where: {\n                        email\n                    }\n                });\n                if (credentials.isNewUser === \"true\") {\n                    throw new Error(\"New user registration is administratively restricted.\");\n                } else {\n                    if (!user) throw new Error(\"User not found\");\n                    if (!user.pin) throw new Error(\"No PIN set for this account. Please contact admin.\");\n                    if (user.pin !== pin) throw new Error(\"Invalid PIN\");\n                }\n                return {\n                    id: user.id,\n                    name: user.name,\n                    email: user.email,\n                    image: user.image || user.avatar,\n                    pin: user.pin\n                };\n            }\n        }),\n        // Admin login (kept separate for management)\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            id: \"admin-login\",\n            name: \"Admin Login\",\n            credentials: {\n                username: {\n                    label: \"Username\",\n                    type: \"text\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.username || !credentials?.password) return null;\n                const admin = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminAccount.findUnique({\n                    where: {\n                        username: credentials.username\n                    }\n                });\n                if (!admin) return null;\n                if (admin.status !== \"active\") return null;\n                const valid = await bcryptjs__WEBPACK_IMPORTED_MODULE_4__[\"default\"].compare(credentials.password, admin.passwordHash);\n                if (!valid) return null;\n                // Log the login\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminActivityLog.create({\n                    data: {\n                        adminId: admin.id,\n                        action: \"login\",\n                        details: \"Admin logged in\"\n                    }\n                });\n                return {\n                    id: admin.id,\n                    name: admin.displayName || admin.username,\n                    email: `admin:${admin.username}`,\n                    role: admin.role,\n                    adminId: admin.id,\n                    username: admin.username\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user, account }) {\n            if (user) {\n                token.userId = user.id;\n                if (account?.provider === \"admin-login\") {\n                    token.role = user.role;\n                    token.adminId = user.adminId;\n                    token.username = user.username;\n                    token.isAdmin = true;\n                } else {\n                    token.role = \"user\";\n                    token.isAdmin = false;\n                }\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.userId;\n                session.user.role = token.role;\n                session.user.isAdmin = token.isAdmin;\n                if (token.isAdmin) {\n                    session.user.adminId = token.adminId;\n                    session.user.username = token.username;\n                    try {\n                        const admin = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.adminAccount.findUnique({\n                            where: {\n                                id: token.adminId\n                            },\n                            select: {\n                                role: true,\n                                status: true,\n                                displayName: true,\n                                username: true\n                            }\n                        });\n                        if (admin?.status !== \"active\") {\n                            session.user.isAdmin = false;\n                        } else {\n                            session.user.role = admin.role;\n                            session.user.username = admin.username;\n                            session.user.name = admin.displayName || admin.username;\n                            const permRow = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.setting.findUnique({\n                                where: {\n                                    key: `adminPerms:${token.adminId}`\n                                },\n                                select: {\n                                    value: true\n                                }\n                            });\n                            session.user.permissions = permRow?.value || \"{}\";\n                        }\n                    } catch  {\n                        session.user.permissions = \"{}\";\n                    }\n                }\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/signin\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQXdEO0FBQ1U7QUFDUjtBQUNwQjtBQUNSO0FBRTlCLGtFQUFrRTtBQUNsRSxNQUFNSyxXQUFXQyxRQUFRQyxHQUFHLENBQUNDLGdCQUFnQixJQUFJO0FBQ2pELE1BQU1DLGVBQWVILFFBQVFDLEdBQUcsQ0FBQ0csb0JBQW9CLElBQUk7QUFDekQsTUFBTUMsaUJBQWlCTixZQUFZLENBQUNBLFNBQVNPLFVBQVUsQ0FBQyxZQUFZSCxnQkFBZ0IsQ0FBQ0EsYUFBYUcsVUFBVSxDQUFDO0FBRXRHLE1BQU1DLGNBQWM7SUFDekJDLFNBQVNaLHdFQUFhQSxDQUFDQywrQ0FBTUE7SUFDN0JZLFNBQVM7UUFDUEMsVUFBVTtRQUNWQyxRQUFRLEtBQUssS0FBSyxLQUFLO1FBQ3ZCQyxXQUFXLEtBQUssS0FBSztJQUN2QjtJQUNBQyxXQUFXO1FBQ1QsZUFBZTtRQUNmbkIsc0VBQWNBLENBQUM7WUFDYm9CLFVBQVVkLFFBQVFDLEdBQUcsQ0FBQ0MsZ0JBQWdCO1lBQ3RDYSxjQUFjZixRQUFRQyxHQUFHLENBQUNHLG9CQUFvQjtRQUNoRDtRQUNBLDRCQUE0QjtRQUM1QlQsMkVBQW1CQSxDQUFDO1lBQ2xCcUIsSUFBSTtZQUNKQyxNQUFNO1lBQ05DLGFBQWE7Z0JBQ1hDLE9BQU87b0JBQUVDLE9BQU87b0JBQVNDLE1BQU07Z0JBQVE7Z0JBQ3ZDQyxLQUFLO29CQUFFRixPQUFPO29CQUFPQyxNQUFNO2dCQUFPO2dCQUNsQ0UsV0FBVztvQkFBRUgsT0FBTztvQkFBZUMsTUFBTTtnQkFBTztZQUNsRDtZQUNBLE1BQU1HLFdBQVVOLFdBQVc7Z0JBQ3pCLElBQUksQ0FBQ0EsYUFBYUMsU0FBUyxDQUFDRCxhQUFhSSxLQUFLLE9BQU87Z0JBRXJELE1BQU1ILFFBQVFELFlBQVlDLEtBQUssQ0FBQ00sSUFBSSxHQUFHQyxXQUFXO2dCQUNsRCxNQUFNSixNQUFNSixZQUFZSSxHQUFHLENBQUNHLElBQUk7Z0JBRWhDLFlBQVk7Z0JBQ1osSUFBSUUsT0FBTyxNQUFNOUIsK0NBQU1BLENBQUM4QixJQUFJLENBQUNDLFVBQVUsQ0FBQztvQkFBRUMsT0FBTzt3QkFBRVY7b0JBQU07Z0JBQUU7Z0JBRTNELElBQUlELFlBQVlLLFNBQVMsS0FBSyxRQUFRO29CQUNwQyxNQUFNLElBQUlPLE1BQU07Z0JBQ2xCLE9BQU87b0JBQ0wsSUFBSSxDQUFDSCxNQUFNLE1BQU0sSUFBSUcsTUFBTTtvQkFDM0IsSUFBSSxDQUFDSCxLQUFLTCxHQUFHLEVBQUUsTUFBTSxJQUFJUSxNQUFNO29CQUMvQixJQUFJSCxLQUFLTCxHQUFHLEtBQUtBLEtBQUssTUFBTSxJQUFJUSxNQUFNO2dCQUN4QztnQkFFQSxPQUFPO29CQUNMZCxJQUFJVyxLQUFLWCxFQUFFO29CQUNYQyxNQUFNVSxLQUFLVixJQUFJO29CQUNmRSxPQUFPUSxLQUFLUixLQUFLO29CQUNqQlksT0FBT0osS0FBS0ksS0FBSyxJQUFJSixLQUFLSyxNQUFNO29CQUNoQ1YsS0FBS0ssS0FBS0wsR0FBRztnQkFDZjtZQUNGO1FBQ0Y7UUFDQSw2Q0FBNkM7UUFDN0MzQiwyRUFBbUJBLENBQUM7WUFDbEJxQixJQUFJO1lBQ0pDLE1BQU07WUFDTkMsYUFBYTtnQkFDWGUsVUFBVTtvQkFBRWIsT0FBTztvQkFBWUMsTUFBTTtnQkFBTztnQkFDNUNhLFVBQVU7b0JBQUVkLE9BQU87b0JBQVlDLE1BQU07Z0JBQVc7WUFDbEQ7WUFDQSxNQUFNRyxXQUFVTixXQUFXO2dCQUN6QixJQUFJLENBQUNBLGFBQWFlLFlBQVksQ0FBQ2YsYUFBYWdCLFVBQVUsT0FBTztnQkFDN0QsTUFBTUMsUUFBUSxNQUFNdEMsK0NBQU1BLENBQUN1QyxZQUFZLENBQUNSLFVBQVUsQ0FBQztvQkFDakRDLE9BQU87d0JBQUVJLFVBQVVmLFlBQVllLFFBQVE7b0JBQUM7Z0JBQzFDO2dCQUNBLElBQUksQ0FBQ0UsT0FBTyxPQUFPO2dCQUNuQixJQUFJQSxNQUFNRSxNQUFNLEtBQUssVUFBVSxPQUFPO2dCQUN0QyxNQUFNQyxRQUFRLE1BQU14Qyx3REFBYyxDQUFDb0IsWUFBWWdCLFFBQVEsRUFBRUMsTUFBTUssWUFBWTtnQkFDM0UsSUFBSSxDQUFDRixPQUFPLE9BQU87Z0JBRW5CLGdCQUFnQjtnQkFDaEIsTUFBTXpDLCtDQUFNQSxDQUFDNEMsZ0JBQWdCLENBQUNDLE1BQU0sQ0FBQztvQkFDbkNDLE1BQU07d0JBQUVDLFNBQVNULE1BQU1uQixFQUFFO3dCQUFFNkIsUUFBUTt3QkFBU0MsU0FBUztvQkFBa0I7Z0JBQ3pFO2dCQUVBLE9BQU87b0JBQ0w5QixJQUFJbUIsTUFBTW5CLEVBQUU7b0JBQ1pDLE1BQU1rQixNQUFNWSxXQUFXLElBQUlaLE1BQU1GLFFBQVE7b0JBQ3pDZCxPQUFPLENBQUMsTUFBTSxFQUFFZ0IsTUFBTUYsUUFBUSxDQUFDLENBQUM7b0JBQ2hDZSxNQUFNYixNQUFNYSxJQUFJO29CQUNoQkosU0FBU1QsTUFBTW5CLEVBQUU7b0JBQ2pCaUIsVUFBVUUsTUFBTUYsUUFBUTtnQkFDMUI7WUFDRjtRQUNGO0tBQ0Q7SUFDRGdCLFdBQVc7UUFDVCxNQUFNQyxLQUFJLEVBQUVDLEtBQUssRUFBRXhCLElBQUksRUFBRXlCLE9BQU8sRUFBRTtZQUNoQyxJQUFJekIsTUFBTTtnQkFDUndCLE1BQU1FLE1BQU0sR0FBRzFCLEtBQUtYLEVBQUU7Z0JBQ3RCLElBQUlvQyxTQUFTRSxhQUFhLGVBQWU7b0JBQ3ZDSCxNQUFNSCxJQUFJLEdBQUdyQixLQUFLcUIsSUFBSTtvQkFDdEJHLE1BQU1QLE9BQU8sR0FBR2pCLEtBQUtpQixPQUFPO29CQUM1Qk8sTUFBTWxCLFFBQVEsR0FBR04sS0FBS00sUUFBUTtvQkFDOUJrQixNQUFNSSxPQUFPLEdBQUc7Z0JBQ2xCLE9BQU87b0JBQ0xKLE1BQU1ILElBQUksR0FBRztvQkFDYkcsTUFBTUksT0FBTyxHQUFHO2dCQUNsQjtZQUNGO1lBQ0EsT0FBT0o7UUFDVDtRQUNBLE1BQU0xQyxTQUFRLEVBQUVBLE9BQU8sRUFBRTBDLEtBQUssRUFBRTtZQUM5QixJQUFJMUMsUUFBUWtCLElBQUksRUFBRTtnQkFDaEJsQixRQUFRa0IsSUFBSSxDQUFDWCxFQUFFLEdBQUdtQyxNQUFNRSxNQUFNO2dCQUM5QjVDLFFBQVFrQixJQUFJLENBQUNxQixJQUFJLEdBQUdHLE1BQU1ILElBQUk7Z0JBQzlCdkMsUUFBUWtCLElBQUksQ0FBQzRCLE9BQU8sR0FBR0osTUFBTUksT0FBTztnQkFDcEMsSUFBSUosTUFBTUksT0FBTyxFQUFFO29CQUNqQjlDLFFBQVFrQixJQUFJLENBQUNpQixPQUFPLEdBQUdPLE1BQU1QLE9BQU87b0JBQ3BDbkMsUUFBUWtCLElBQUksQ0FBQ00sUUFBUSxHQUFHa0IsTUFBTWxCLFFBQVE7b0JBQ3RDLElBQUk7d0JBQ0YsTUFBTUUsUUFBUSxNQUFNdEMsK0NBQU1BLENBQUN1QyxZQUFZLENBQUNSLFVBQVUsQ0FBQzs0QkFDakRDLE9BQU87Z0NBQUViLElBQUltQyxNQUFNUCxPQUFPOzRCQUFDOzRCQUMzQlksUUFBUTtnQ0FBRVIsTUFBTTtnQ0FBTVgsUUFBUTtnQ0FBTVUsYUFBYTtnQ0FBTWQsVUFBVTs0QkFBSzt3QkFDeEU7d0JBQ0EsSUFBSUUsT0FBT0UsV0FBVyxVQUFVOzRCQUM5QjVCLFFBQVFrQixJQUFJLENBQUM0QixPQUFPLEdBQUc7d0JBQ3pCLE9BQU87NEJBQ0w5QyxRQUFRa0IsSUFBSSxDQUFDcUIsSUFBSSxHQUFHYixNQUFNYSxJQUFJOzRCQUM5QnZDLFFBQVFrQixJQUFJLENBQUNNLFFBQVEsR0FBR0UsTUFBTUYsUUFBUTs0QkFDdEN4QixRQUFRa0IsSUFBSSxDQUFDVixJQUFJLEdBQUdrQixNQUFNWSxXQUFXLElBQUlaLE1BQU1GLFFBQVE7NEJBQ3ZELE1BQU13QixVQUFVLE1BQU01RCwrQ0FBTUEsQ0FBQzZELE9BQU8sQ0FBQzlCLFVBQVUsQ0FBQztnQ0FDOUNDLE9BQU87b0NBQUU4QixLQUFLLENBQUMsV0FBVyxFQUFFUixNQUFNUCxPQUFPLENBQUMsQ0FBQztnQ0FBQztnQ0FDNUNZLFFBQVE7b0NBQUVJLE9BQU87Z0NBQUs7NEJBQ3hCOzRCQUNBbkQsUUFBUWtCLElBQUksQ0FBQ2tDLFdBQVcsR0FBR0osU0FBU0csU0FBUzt3QkFDL0M7b0JBQ0YsRUFBRSxPQUFNO3dCQUNObkQsUUFBUWtCLElBQUksQ0FBQ2tDLFdBQVcsR0FBRztvQkFDN0I7Z0JBQ0Y7WUFDRjtZQUNBLE9BQU9wRDtRQUNUO0lBQ0Y7SUFDQXFELE9BQU87UUFDTEMsUUFBUTtJQUNWO0FBQ0YsRUFBRSIsInNvdXJjZXMiOlsid2VicGFjazovL3F1aXp3ZWIvLi9zcmMvbGliL2F1dGguanM/ODdiZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR29vZ2xlUHJvdmlkZXIgZnJvbSBcIm5leHQtYXV0aC9wcm92aWRlcnMvZ29vZ2xlXCI7XHJcbmltcG9ydCBDcmVkZW50aWFsc1Byb3ZpZGVyIGZyb20gXCJuZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzXCI7XHJcbmltcG9ydCB7IFByaXNtYUFkYXB0ZXIgfSBmcm9tIFwiQG5leHQtYXV0aC9wcmlzbWEtYWRhcHRlclwiO1xyXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiQC9saWIvcHJpc21hXCI7XHJcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XHJcblxyXG4vLyBPbmx5IGluY2x1ZGUgR29vZ2xlIHByb3ZpZGVyIGlmIHJlYWwgY3JlZGVudGlhbHMgYXJlIGNvbmZpZ3VyZWRcclxuY29uc3QgZ29vZ2xlSWQgPSBwcm9jZXNzLmVudi5HT09HTEVfQ0xJRU5UX0lEID8/IFwiXCI7XHJcbmNvbnN0IGdvb2dsZVNlY3JldCA9IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfU0VDUkVUID8/IFwiXCI7XHJcbmNvbnN0IGhhc0dvb2dsZUNyZWRzID0gZ29vZ2xlSWQgJiYgIWdvb2dsZUlkLnN0YXJ0c1dpdGgoXCJ5b3VyLVwiKSAmJiBnb29nbGVTZWNyZXQgJiYgIWdvb2dsZVNlY3JldC5zdGFydHNXaXRoKFwieW91ci1cIik7XHJcblxyXG5leHBvcnQgY29uc3QgYXV0aE9wdGlvbnMgPSB7XHJcbiAgYWRhcHRlcjogUHJpc21hQWRhcHRlcihwcmlzbWEpLFxyXG4gIHNlc3Npb246IHsgXHJcbiAgICBzdHJhdGVneTogXCJqd3RcIixcclxuICAgIG1heEFnZTogMzAgKiAyNCAqIDYwICogNjAsIC8vIDMwIGRheXNcclxuICAgIHVwZGF0ZUFnZTogMjQgKiA2MCAqIDYwLCAvLyAyNCBob3Vyc1xyXG4gIH0sXHJcbiAgcHJvdmlkZXJzOiBbXHJcbiAgICAvLyBHb29nbGUgT0F1dGhcclxuICAgIEdvb2dsZVByb3ZpZGVyKHtcclxuICAgICAgY2xpZW50SWQ6IHByb2Nlc3MuZW52LkdPT0dMRV9DTElFTlRfSUQsXHJcbiAgICAgIGNsaWVudFNlY3JldDogcHJvY2Vzcy5lbnYuR09PR0xFX0NMSUVOVF9TRUNSRVQsXHJcbiAgICB9KSxcclxuICAgIC8vIFVzZXIgbG9naW4gd2l0aCBFbWFpbCBQSU5cclxuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xyXG4gICAgICBpZDogXCJlbWFpbC1waW5cIixcclxuICAgICAgbmFtZTogXCJFbWFpbCBQSU5cIixcclxuICAgICAgY3JlZGVudGlhbHM6IHtcclxuICAgICAgICBlbWFpbDogeyBsYWJlbDogXCJFbWFpbFwiLCB0eXBlOiBcImVtYWlsXCIgfSxcclxuICAgICAgICBwaW46IHsgbGFiZWw6IFwiUElOXCIsIHR5cGU6IFwidGV4dFwiIH0sXHJcbiAgICAgICAgaXNOZXdVc2VyOiB7IGxhYmVsOiBcIklzIE5ldyBVc2VyXCIsIHR5cGU6IFwidGV4dFwiIH0sIC8vIFwidHJ1ZVwiIG9yIFwiZmFsc2VcIlxyXG4gICAgICB9LFxyXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcclxuICAgICAgICBpZiAoIWNyZWRlbnRpYWxzPy5lbWFpbCB8fCAhY3JlZGVudGlhbHM/LnBpbikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgZW1haWwgPSBjcmVkZW50aWFscy5lbWFpbC50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBjb25zdCBwaW4gPSBjcmVkZW50aWFscy5waW4udHJpbSgpO1xyXG5cclxuICAgICAgICAvLyBGaW5kIHVzZXJcclxuICAgICAgICBsZXQgdXNlciA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBlbWFpbCB9IH0pO1xyXG5cclxuICAgICAgICBpZiAoY3JlZGVudGlhbHMuaXNOZXdVc2VyID09PSBcInRydWVcIikge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmV3IHVzZXIgcmVnaXN0cmF0aW9uIGlzIGFkbWluaXN0cmF0aXZlbHkgcmVzdHJpY3RlZC5cIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICghdXNlcikgdGhyb3cgbmV3IEVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XHJcbiAgICAgICAgICBpZiAoIXVzZXIucGluKSB0aHJvdyBuZXcgRXJyb3IoXCJObyBQSU4gc2V0IGZvciB0aGlzIGFjY291bnQuIFBsZWFzZSBjb250YWN0IGFkbWluLlwiKTtcclxuICAgICAgICAgIGlmICh1c2VyLnBpbiAhPT0gcGluKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIFBJTlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBpZDogdXNlci5pZCxcclxuICAgICAgICAgIG5hbWU6IHVzZXIubmFtZSxcclxuICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxyXG4gICAgICAgICAgaW1hZ2U6IHVzZXIuaW1hZ2UgfHwgdXNlci5hdmF0YXIsXHJcbiAgICAgICAgICBwaW46IHVzZXIucGluLCAvLyBJbmNsdWRlIFBJTiBmb3IgYWRtaW4gdmlldyBpZiBuZWVkZWQgaW4gc2Vzc2lvblxyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIC8vIEFkbWluIGxvZ2luIChrZXB0IHNlcGFyYXRlIGZvciBtYW5hZ2VtZW50KVxyXG4gICAgQ3JlZGVudGlhbHNQcm92aWRlcih7XHJcbiAgICAgIGlkOiBcImFkbWluLWxvZ2luXCIsXHJcbiAgICAgIG5hbWU6IFwiQWRtaW4gTG9naW5cIixcclxuICAgICAgY3JlZGVudGlhbHM6IHtcclxuICAgICAgICB1c2VybmFtZTogeyBsYWJlbDogXCJVc2VybmFtZVwiLCB0eXBlOiBcInRleHRcIiB9LFxyXG4gICAgICAgIHBhc3N3b3JkOiB7IGxhYmVsOiBcIlBhc3N3b3JkXCIsIHR5cGU6IFwicGFzc3dvcmRcIiB9LFxyXG4gICAgICB9LFxyXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcclxuICAgICAgICBpZiAoIWNyZWRlbnRpYWxzPy51c2VybmFtZSB8fCAhY3JlZGVudGlhbHM/LnBhc3N3b3JkKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBjb25zdCBhZG1pbiA9IGF3YWl0IHByaXNtYS5hZG1pbkFjY291bnQuZmluZFVuaXF1ZSh7XHJcbiAgICAgICAgICB3aGVyZTogeyB1c2VybmFtZTogY3JlZGVudGlhbHMudXNlcm5hbWUgfSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoIWFkbWluKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBpZiAoYWRtaW4uc3RhdHVzICE9PSBcImFjdGl2ZVwiKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBjb25zdCB2YWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKGNyZWRlbnRpYWxzLnBhc3N3b3JkLCBhZG1pbi5wYXNzd29yZEhhc2gpO1xyXG4gICAgICAgIGlmICghdmFsaWQpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAvLyBMb2cgdGhlIGxvZ2luXHJcbiAgICAgICAgYXdhaXQgcHJpc21hLmFkbWluQWN0aXZpdHlMb2cuY3JlYXRlKHtcclxuICAgICAgICAgIGRhdGE6IHsgYWRtaW5JZDogYWRtaW4uaWQsIGFjdGlvbjogXCJsb2dpblwiLCBkZXRhaWxzOiBcIkFkbWluIGxvZ2dlZCBpblwiIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBpZDogYWRtaW4uaWQsXHJcbiAgICAgICAgICBuYW1lOiBhZG1pbi5kaXNwbGF5TmFtZSB8fCBhZG1pbi51c2VybmFtZSxcclxuICAgICAgICAgIGVtYWlsOiBgYWRtaW46JHthZG1pbi51c2VybmFtZX1gLFxyXG4gICAgICAgICAgcm9sZTogYWRtaW4ucm9sZSxcclxuICAgICAgICAgIGFkbWluSWQ6IGFkbWluLmlkLFxyXG4gICAgICAgICAgdXNlcm5hbWU6IGFkbWluLnVzZXJuYW1lLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIGNhbGxiYWNrczoge1xyXG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIsIGFjY291bnQgfSkge1xyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIHRva2VuLnVzZXJJZCA9IHVzZXIuaWQ7XHJcbiAgICAgICAgaWYgKGFjY291bnQ/LnByb3ZpZGVyID09PSBcImFkbWluLWxvZ2luXCIpIHtcclxuICAgICAgICAgIHRva2VuLnJvbGUgPSB1c2VyLnJvbGU7XHJcbiAgICAgICAgICB0b2tlbi5hZG1pbklkID0gdXNlci5hZG1pbklkO1xyXG4gICAgICAgICAgdG9rZW4udXNlcm5hbWUgPSB1c2VyLnVzZXJuYW1lO1xyXG4gICAgICAgICAgdG9rZW4uaXNBZG1pbiA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRva2VuLnJvbGUgPSBcInVzZXJcIjtcclxuICAgICAgICAgIHRva2VuLmlzQWRtaW4gPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRva2VuO1xyXG4gICAgfSxcclxuICAgIGFzeW5jIHNlc3Npb24oeyBzZXNzaW9uLCB0b2tlbiB9KSB7XHJcbiAgICAgIGlmIChzZXNzaW9uLnVzZXIpIHtcclxuICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSB0b2tlbi51c2VySWQ7XHJcbiAgICAgICAgc2Vzc2lvbi51c2VyLnJvbGUgPSB0b2tlbi5yb2xlO1xyXG4gICAgICAgIHNlc3Npb24udXNlci5pc0FkbWluID0gdG9rZW4uaXNBZG1pbjtcclxuICAgICAgICBpZiAodG9rZW4uaXNBZG1pbikge1xyXG4gICAgICAgICAgc2Vzc2lvbi51c2VyLmFkbWluSWQgPSB0b2tlbi5hZG1pbklkO1xyXG4gICAgICAgICAgc2Vzc2lvbi51c2VyLnVzZXJuYW1lID0gdG9rZW4udXNlcm5hbWU7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBhZG1pbiA9IGF3YWl0IHByaXNtYS5hZG1pbkFjY291bnQuZmluZFVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgd2hlcmU6IHsgaWQ6IHRva2VuLmFkbWluSWQgfSxcclxuICAgICAgICAgICAgICBzZWxlY3Q6IHsgcm9sZTogdHJ1ZSwgc3RhdHVzOiB0cnVlLCBkaXNwbGF5TmFtZTogdHJ1ZSwgdXNlcm5hbWU6IHRydWUgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChhZG1pbj8uc3RhdHVzICE9PSBcImFjdGl2ZVwiKSB7XHJcbiAgICAgICAgICAgICAgc2Vzc2lvbi51c2VyLmlzQWRtaW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzZXNzaW9uLnVzZXIucm9sZSA9IGFkbWluLnJvbGU7XHJcbiAgICAgICAgICAgICAgc2Vzc2lvbi51c2VyLnVzZXJuYW1lID0gYWRtaW4udXNlcm5hbWU7XHJcbiAgICAgICAgICAgICAgc2Vzc2lvbi51c2VyLm5hbWUgPSBhZG1pbi5kaXNwbGF5TmFtZSB8fCBhZG1pbi51c2VybmFtZTtcclxuICAgICAgICAgICAgICBjb25zdCBwZXJtUm93ID0gYXdhaXQgcHJpc21hLnNldHRpbmcuZmluZFVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgICB3aGVyZTogeyBrZXk6IGBhZG1pblBlcm1zOiR7dG9rZW4uYWRtaW5JZH1gIH0sXHJcbiAgICAgICAgICAgICAgICBzZWxlY3Q6IHsgdmFsdWU6IHRydWUgfSxcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICBzZXNzaW9uLnVzZXIucGVybWlzc2lvbnMgPSBwZXJtUm93Py52YWx1ZSB8fCBcInt9XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICBzZXNzaW9uLnVzZXIucGVybWlzc2lvbnMgPSBcInt9XCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzZXNzaW9uO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIHBhZ2VzOiB7XHJcbiAgICBzaWduSW46IFwiL3NpZ25pblwiLFxyXG4gIH0sXHJcbn07XHJcbiJdLCJuYW1lcyI6WyJHb29nbGVQcm92aWRlciIsIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJQcmlzbWFBZGFwdGVyIiwicHJpc21hIiwiYmNyeXB0IiwiZ29vZ2xlSWQiLCJwcm9jZXNzIiwiZW52IiwiR09PR0xFX0NMSUVOVF9JRCIsImdvb2dsZVNlY3JldCIsIkdPT0dMRV9DTElFTlRfU0VDUkVUIiwiaGFzR29vZ2xlQ3JlZHMiLCJzdGFydHNXaXRoIiwiYXV0aE9wdGlvbnMiLCJhZGFwdGVyIiwic2Vzc2lvbiIsInN0cmF0ZWd5IiwibWF4QWdlIiwidXBkYXRlQWdlIiwicHJvdmlkZXJzIiwiY2xpZW50SWQiLCJjbGllbnRTZWNyZXQiLCJpZCIsIm5hbWUiLCJjcmVkZW50aWFscyIsImVtYWlsIiwibGFiZWwiLCJ0eXBlIiwicGluIiwiaXNOZXdVc2VyIiwiYXV0aG9yaXplIiwidHJpbSIsInRvTG93ZXJDYXNlIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsIkVycm9yIiwiaW1hZ2UiLCJhdmF0YXIiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiYWRtaW4iLCJhZG1pbkFjY291bnQiLCJzdGF0dXMiLCJ2YWxpZCIsImNvbXBhcmUiLCJwYXNzd29yZEhhc2giLCJhZG1pbkFjdGl2aXR5TG9nIiwiY3JlYXRlIiwiZGF0YSIsImFkbWluSWQiLCJhY3Rpb24iLCJkZXRhaWxzIiwiZGlzcGxheU5hbWUiLCJyb2xlIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJhY2NvdW50IiwidXNlcklkIiwicHJvdmlkZXIiLCJpc0FkbWluIiwic2VsZWN0IiwicGVybVJvdyIsInNldHRpbmciLCJrZXkiLCJ2YWx1ZSIsInBlcm1pc3Npb25zIiwicGFnZXMiLCJzaWduSW4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.js\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.js&appDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CTECHIE777%5CDesktop%5Cquiz-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();