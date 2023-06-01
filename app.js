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
      const phoneNumber = String(body.get("phoneNumber"));
      console.log(phoneNumber)
      body.forEach((value, key, parent) => {
        console.log(value, key);
      });
      const text = body.get("text");
      let { data: phoneNumbers, error } = await supabase
        .from("account")
        .select("phone_number");
      console.log(phoneNumbers);
      const isResgistered = Boolean(
        phoneNumbers.filter((number) => number.phone_number == phoneNumber).length
      );
        console.log({isResgistered})
      if (text == "") {
        console.log({ phoneNumbers, phoneNumber });
        if (isResgistered) {
          ctx.response.body = `CON Good day 
                                Welcome back ${phoneNumber}, what would you like to do today?
                                1. Transfer Money
                                2. Check balance
                                3. Pay Bills
                                4. Fund Account
                                5. Settings`;
        } else {
          ctx.response.body = `CON Welcome to 1naira
                                1. Create an account`;
        }
        // console.log(phoneNumbers);
      } else if (text == "1" && isResgistered) {
        // First Screen (Logged in)
        ctx.response.body = `CON Transfer to
                              1. One Naira Account
                              2. Other Bank Account`;
      } else if (text == "1*1" && isResgistered) {
        // Transfer Funds
        // Select current users pin
        const { data: pin, error } = await supabase
          .from("account")
          .select("pin")
          .eq("phone_number", phoneNumber);

        console.log({ pin: pin[0].pin, error });
        //Check if pin exists
        if (pin[0].pin === null) {
          ctx.response.body = `CON Create a pin
                                1. Create pin`;
        } else {
          ctx.response.body = `CON Enter account Number
                                 
        `;
        }
      } else if (
        text.split("*")[3].length == 4 &&
        text.split("*").length >= 5 &&
        isResgistered
      ) {
        if (text.split("*")[3] == text.split("*")[4]) {
          const { data, error } = await supabase
            .from("account")
            .update({ pin: text.split("*")[4] })
            .eq("phone_number", phoneNumber);
            console.log({data,error})
          ctx.response.body = `CON Pin saved`;
        } else {
          ctx.response.body = `Pins don't match`;
        }
      } else if (text == "1*1*1" && isResgistered) {
        //Choose pin
        ctx.response.body = `CON Choose 4 Digit Pin`;
      } else if (/1\*1\*1\*[0-9]{4}/i.test(text) && isResgistered) {
        ctx.response.body = `CON Type pin again`;
        // /1\*1\*[0-9]{9}/i.test(text)
      } else if ( text.split('*')[2] >= 9 && text.split('*').length <= 3 && isResgistered) {
        ctx.response.body = `CON Confirm Account Number
                              ${
                                text.match(/1\*1\*[0-9]{9}/i)[0].split("*")[2]
                              }
                              1. Continue`;
      }
      else if (/1\*1\*[0-9]{9}\*1/i.test(text) && isResgistered) {
        ctx.response.body= `CON Enter amount to send`
      } 
      else if (/1\*1\*[0-9]{11}\*1\*[0-9]{2}/i.test(text) && text.split('*').length < 6 && isResgistered) {
        ctx.response.body = `CON Enter Pin to send ${text.split('*')[4]} to ${text.split('*')[2]}`
        // console.log(`Sent ${text.split('*')[4]} to ${text.split('*')[2]}`)
      }
      else if (/1\*1\*[0-9]{11}\*1\*[0-9]{2}/i.test(text) && text.split('*').length >= 6 && isResgistered) {
        const { data: pin, error } = await supabase
        .from("account")
        .select("pin")
        .eq("phone_number", phoneNumber);
        if(text.split("*")[5] == String(pin[0].pin)){
          console.log('sending')
        }else{
          console.log('Wrong Pin')
        }
      }
      else if (text == "1") {
        ctx.response.body = `CON Enter Name:`;
      } else if (
        text == "1*1" &&
        !phoneNumbers.filter((number) => number.phone_number == phoneNumber)
      ) {
        ctx.response.body = `CON `;
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

  router.get("/getAll", async (ctx) => {
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
