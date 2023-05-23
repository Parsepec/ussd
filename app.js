import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { Database, Table } from "npm:st.db";
const db = new Database("db.json");
const router = new Router();

db.on("ready", () => {
  const table_1 = new Table("profile", db);
  table_1.set("name", "Mohamed Abdelkarim");
  table_1.set("age", 17);
});

(async () => {
  //   app.use((ctx) => {
  //     ctx.response.body = "Hello World!";
  //   });
  router.post("/", async (ctx, next) => {
    ctx.response.body = "Hello World!";
    console.log(ctx.request)
    const { value } = ctx.request.body({ type: "json" });
    const { name } = await value;
    console.log(name);
  });
  const app = new Application();
  const port = 3000;
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.addEventListener("listen", () => {
    console.log(`Listening on localhost:${port}`);
  });
  await app.listen(`127.0.0.1:${port}`);
})();
