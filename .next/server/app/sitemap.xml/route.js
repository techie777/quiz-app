"use strict";(()=>{var e={};e.id=6717,e.ids=[6717],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63772:(e,r,t)=>{t.r(r),t.d(r,{originalPathname:()=>m,patchFetch:()=>d,requestAsyncStorage:()=>c,routeModule:()=>p,serverHooks:()=>y,staticGenerationAsyncStorage:()=>u});var a={};t.r(a),t.d(a,{GET:()=>s});var i=t(49303),o=t(88716),l=t(60670),n=t(23109);async function s(){let e=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";try{let r=await n._.category.findMany({where:{hidden:!1},select:{id:!0,updatedAt:!0}}),t=await n._.question.findMany({select:{id:!0,updatedAt:!0},distinct:["categoryId"]}),a=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[{url:"",priority:"1.0",changefreq:"daily"},{url:"/about",priority:"0.8",changefreq:"monthly"},{url:"/privacy",priority:"0.5",changefreq:"yearly"},{url:"/copyright",priority:"0.5",changefreq:"yearly"},{url:"/profile",priority:"0.7",changefreq:"weekly"},{url:"/daily-current-affairs",priority:"0.9",changefreq:"daily"},{url:"/current-affairs",priority:"0.9",changefreq:"daily"},{url:"/daily",priority:"0.9",changefreq:"daily"},{url:"/govt-exams",priority:"0.8",changefreq:"weekly"},{url:"/govt-exams/upsc",priority:"0.8",changefreq:"weekly"},{url:"/govt-exams/ssc",priority:"0.8",changefreq:"weekly"},{url:"/govt-exams/rrb",priority:"0.8",changefreq:"weekly"},{url:"/govt-exams/ibp",priority:"0.8",changefreq:"weekly"},{url:"/govt-jobs-alerts",priority:"0.8",changefreq:"daily"},{url:"/notes",priority:"0.7",changefreq:"weekly"},{url:"/previous-years-papers",priority:"0.7",changefreq:"monthly"}].map(r=>`
  <url>
    <loc>${e}${r.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("")}
${r.map(r=>`
  <url>
    <loc>${e}/category/${r.id}</loc>
    <lastmod>${r.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("")}
${t.map(r=>`
  <url>
    <loc>${e}/quiz/${r.id}</loc>
    <lastmod>${r.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("")}
</urlset>`;return new Response(a,{headers:{"Content-Type":"application/xml","Cache-Control":"public, max-age=3600, s-maxage=3600"}})}catch(r){return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${e}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${e}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${e}/privacy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`,{headers:{"Content-Type":"application/xml","Cache-Control":"public, max-age=3600, s-maxage=3600"}})}}let p=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/sitemap.xml/route",pathname:"/sitemap.xml",filename:"route",bundlePath:"app/sitemap.xml/route"},resolvedPagePath:"C:\\Users\\TECHIE777\\Desktop\\quiz-app\\src\\app\\sitemap.xml\\route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:c,staticGenerationAsyncStorage:u,serverHooks:y}=p,m="/sitemap.xml/route";function d(){return(0,l.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:u})}},49303:(e,r,t)=>{e.exports=t(30517)},23109:(e,r,t)=>{t.d(r,{Z:()=>o,_:()=>i});let a=require("@prisma/client"),i=globalThis.prisma??new a.PrismaClient({log:["error"]}),o=i}};var r=require("../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),a=r.X(0,[8948],()=>t(63772));module.exports=a})();