import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { load } from "https://deno.land/std/dotenv/mod.ts";

const env = await load();
const supabaseUrl = "https://recdhklrrpqdbxuanydk.supabase.co";
const supabaseKey = env["SERVICE_KEY"];
const supabase = createClient(supabaseUrl, supabaseKey);

// session_id gets a unique session ID
// service_code gets your USSD code
// phone_number gets the phone number thats currently accessing the USSD
// text carries the user response as they use the USSD application
const router = new Router();
(async () => {
  //   app.use((ctx) => {
  //     ctx.response.body = "Hello World!";
  //   });
  router.post("/", async (ctx, next) => {

    console.log(ctx.request.url.searchParams.get("name"));
    const params = ctx.request.url.searchParams;

    params.forEach((value, key, parent) => {
      console.log(value, key);
    });

    var text = params.get("text");
    console.log({text})
    if (Boolean(text == "")) {
        console.log("If passed")
        ctx.response.body = "CON Good day";
      }
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
