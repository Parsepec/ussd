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
  router.add(["POST", "GET"], "/", async (ctx, next) => {
    // console.log(ctx.request.url.searchParams.get("name"));
    if (ctx.request.method == "GET") {
      ctx.response.body = "Hello";
    } else {
      const params = ctx.request.url.searchParams;
      const body = await ctx.request.body().value;
      const phoneNumber = body.get("phone_number");
      const text = body.get("text");
      let { data: phoneNumbers, error } = await supabase
        .from("account")
        .select("phone_number");

      if (text == "") {
        console.log({ phoneNumbers, phoneNumber });
        if (
          phoneNumbers.filter((number) => number.phone_number == phoneNumber)
        ) {
          ctx.response.body = `CON Good day 
                                Welcome back ${phoneNumber}, what would you like to do today?
                                1. Transfer Money
                                2. Check balance
                                3. Pay Bills
                                4. Settings`;
        } else {
          ctx.response.body = `CON Welcome to 1naira
                                1. Create an account`;
        }
        // console.log(phoneNumbers);
      } else if (
        text == "1" &&
        phoneNumbers.filter((number) => number.phone_number == phoneNumber)
      ) {
      } else if (text == "1") {
        ctx.response.body = `CON Enter Name:`;
      } else if (/1\*1\*[a-z]*/i.test(text)) {
        ctx.response.body = `END ${
          text.match(/1\*1\*[a-z]*/i)[0].split("*")[2]
        }`;
      }
    }
  });
  router.post("/addUser", async (ctx) => {
    const { name, phone_number, balance } = await ctx.request.body().value;
    const { data, error } = await supabase
      .from("account")
      .insert([{ name, phone_number, balance }]);
    // let { data: account, error } = await supabase.from("account").select("*");
    console.log({ data, error });
  });

  router.get("getAll", async (ctx) => {
    let { data: account, error } = await supabase.from("account").select("*");
    console.log({ account });
  });
  const app = new Application();
  const port = 3002;
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.addEventListener("listen", () => {
    console.log(`Listening on localhost:${port}`);
  });
  await app.listen(`127.0.0.1:${port}`);
})();
