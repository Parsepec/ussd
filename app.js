import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { load } from "https://deno.land/std/dotenv/mod.ts";
import { Ngrok } from "https://deno.land/x/ngrok@4.0.1/mod.ts";
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
  router.add(["POST", "GET"], "/", async (ctx, next) => {
    console.log(ctx.request.url.searchParams.get("name"));
    if (ctx.request.method == "GET") {
      ctx.response.body = "Hello";
    } else {
      const params = ctx.request.url.searchParams;
      const body = await ctx.request.body().value;
      console.log(await ctx.request.body().type);
      // const { sessionId, serviceCode, phoneNumber, text } = body;
      const phoneNumber = body.get("phoneNumber");
      const text = body.get("text");
      params.forEach((value, key, parent) => {
        console.log(value, key);
      });
      let { data: phoneNumbers, error } = await supabase
        .from("account")
        .select("phone_number");

      if (Boolean(text == "")) {
        if (phoneNumbers.includes(body.get("phoneNumber"))) {
          ctx.response.body = `CON Good day 
                                Welcome back ${phoneNumber}`;
        } else {
          ctx.response.body = `CON Welcome to 1naira
                                1. Create an account`;
        }
        console.log(phoneNumbers);

        // console.log("If passed");
        // ctx.response.body = "CON Good day";
      }
      if (text == "1") {
        ctx.response.body = `CON Enter Name:`;
      }
      if(/1\*1\*[aA-zZ]/.test(text)){
        ctx.response.body = `END ${text.match(/1\*1\*[aA-zZ]/)}`
      }
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
