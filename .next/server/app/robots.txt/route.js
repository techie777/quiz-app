"use strict";(()=>{var e={};e.id=3703,e.ids=[3703],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},61928:(e,o,t)=>{t.r(o),t.d(o,{originalPathname:()=>w,patchFetch:()=>c,requestAsyncStorage:()=>p,routeModule:()=>n,serverHooks:()=>d,staticGenerationAsyncStorage:()=>u});var l={};t.r(l),t.d(l,{GET:()=>i});var a=t(49303),r=t(88716),s=t(60670);function i(){let e=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";return new Response(`User-agent: *
Allow: /
Allow: /category/*
Allow: /quiz/*
Allow: /daily-current-affairs
Allow: /current-affairs
Allow: /daily/*
Allow: /govt-exams/*
Allow: /govt-jobs-alerts
Allow: /notes
Allow: /previous-years-papers
Allow: /about
Allow: /privacy
Allow: /copyright

# Block admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /profile
Disallow: /upload
Disallow: /_next/
Disallow: /static/

# Block temporary and development files
Disallow: /temp/
Disallow: /test/
Disallow: /*.json$
Disallow: /*?*$
Disallow: /*.pdf$

# Allow specific query parameters for filtering
Allow: /daily-current-affairs?date=*
Allow: /daily-current-affairs?month=*
Allow: /daily-current-affairs?category=*
Allow: /category/*?difficulty=*
Allow: /category/*?page=*

# Sitemap location
Sitemap: ${e}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1

# Additional rules for specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: YandexBot
Allow: /
`,{headers:{"Content-Type":"text/plain","Cache-Control":"public, max-age=86400, s-maxage=86400"}})}let n=new a.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/robots.txt/route",pathname:"/robots.txt",filename:"route",bundlePath:"app/robots.txt/route"},resolvedPagePath:"C:\\Users\\TECHIE777\\Desktop\\quiz-app\\src\\app\\robots.txt\\route.js",nextConfigOutput:"",userland:l}),{requestAsyncStorage:p,staticGenerationAsyncStorage:u,serverHooks:d}=n,w="/robots.txt/route";function c(){return(0,s.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:u})}},49303:(e,o,t)=>{e.exports=t(30517)}};var o=require("../../webpack-runtime.js");o.C(e);var t=e=>o(o.s=e),l=o.X(0,[8948],()=>t(61928));module.exports=l})();