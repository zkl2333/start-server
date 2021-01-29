const AV = require("leanengine");
const axios = require("axios");
const cheerio = require("cheerio");

async function getSiteDateFromAxios(url) {
  try {
    let res = await axios({ method: "get", url });
    if (res?.status === 200) {
      const $ = cheerio.load(res.data);
      try {
        const siteData = {
          url: url,
          title: $("title").text() || "",
          description: $("meta[name='description']").attr("content") || "",
          icon: $("link[rel*='icon']").eq(0).attr("href") || "/favicon.ico",
        };
        return siteData;
      } catch (error) {
        console.error(error);
        throw new Error("cheerio 解析失败");
      }
    } else {
      console.log(res);
      throw new AV.Cloud.Error("url 响应非 200", { code: res?.status });
    }
  } catch (error) {
    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          error.message = "请求错误(400)";
          break;
        case 401:
          error.message = "未授权，请重新登录(401)";
          break;
        case 403:
          error.message = "拒绝访问(403)";
          break;
        case 404:
          error.message = "请求出错(404)";
          break;
        case 408:
          error.message = "请求超时(408)";
          break;
        case 500:
          error.message = "服务器错误(500)";
          break;
        case 501:
          error.message = "服务未实现(501)";
          break;
        case 502:
          error.message = "网络错误(502)";
          break;
        case 503:
          error.message = "服务不可用(503)";
          break;
        case 504:
          error.message = "网络超时(504)";
          break;
        case 505:
          error.message = "HTTP版本不受支持(505)";
          break;
        default:
          error.message = `连接出错(${error.response.status})!`;
      }
      throw new AV.Cloud.Error("axios 获取失败 " + error.message, { code: error.response.status });
    } else {
      throw new AV.Cloud.Error("axios 获取失败 " + error.message, { code: 500 });
    }
  }
}

async function getSite(url) {
  const query = new AV.Query("site");
  query.equalTo("url", url);
  let site;
  site = await query.first();
  if (site) {
    console.log(`查询成功 url: ${site.get("url")} id：${site.id}`);
    if ((new Date() - site.getUpdatedAt()) / 1000 / 60 > 10) {
      console.log(`需要更新 url: ${site.get("url")} id：${site.id}`);
      const siteData = await getSiteDateFromAxios(url);
      Object.keys(siteData).map((key) => {
        site.set(key, siteData[key]);
      });
      return saveSite(site);
    } else {
      return site;
    }
  } else {
    const siteData = await getSiteDateFromAxios(url);
    const Site = AV.Object.extend("site");
    const site = new Site();
    Object.keys(siteData).map((key) => {
      site.set(key, siteData[key]);
    });
    return saveSite(site);
  }
}

function saveSite(site) {
  // 将对象保存到云端
  return site.save().then((site) => {
    // 成功保存之后，执行其他逻辑
    console.log(`保存成功 url: ${site.get("url")} id：${site.id}`);
    return site;
  });
}

/**
 * A simple cloud function.
 */
AV.Cloud.define("siteInfo", async (request) => {
  try {
    const site = await getSite(request.params.request.url);
    return site;
  } catch (error) {
    throw error;
  }
});

AV.Cloud.run("siteInfo", {
  request: { url: "https://www.zkl2444.com" },
}).then(function (res) {
  try {
    console.log(res.toJSON() || res);
  } catch (error) {
    console.log(res);
  }
});
