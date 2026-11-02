
export default {
  async fetch(request, env) {
    // 读取并清理目标地址
    let raw = String(env.URL || "").trim();

    if (!raw) {
      return new Response("404 Not Found", { status: 404 });
    }

    // 没有协议时默认使用 HTTPS
    if (!/^https?:\/\//i.test(raw)) {
      raw = "https://" + raw;
    }

    let base;

    try {
      base = new URL(raw);

      // 只允许 HTTP / HTTPS
      if (
        !["http:", "https:"].includes(base.protocol) ||
        !base.hostname ||
        base.username ||
        base.password
      ) {
        throw new Error("Invalid URL");
      }
    } catch {
      return new Response("404 Not Found", { status: 404 });
    }

    // 只保留协议和域名，清理误复制的路径、参数和哈希
    const origin = base.origin;

    // 获取用户请求路径和查询参数
    const incoming = new URL(request.url);
    const target = origin + incoming.pathname + incoming.search;

    try {
      // 将请求转发到目标站点
      const proxyRequest = new Request(
        target,
        request
      );

      const response = await fetch(proxyRequest);

      // 上游服务器错误视为目标站点不可用
      if (response.status >= 500) {
        return new Response("404 Not Found", {
          status: 404
        });
      }

      // 原样返回目标站点响应
      return response;

    } catch {
      // DNS、连接失败、超时等情况
      return new Response("404 Not Found", {
        status: 404
      });
    }
  }
};
