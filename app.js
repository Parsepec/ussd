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
      console.log({ phoneNumber: phoneNumber.slice(-10) });
      body.forEach((value, key, parent) => {
        console.log(value, key);
      });
      const text = body.get("text");
      let { data: phoneNumbers, error } = await supabase
        .from("account")
        .select("phone_number,name");
      console.log(phoneNumbers);
      const isResgistered = Boolean(
        phoneNumbers.filter(
          (number) => number.phone_number.slice(-10) == phoneNumber.slice(-10)
        ).length
      );
      console.log({ isResgistered });
      if (text == "") {
        console.log({ phoneNumbers, phoneNumber });
        const { data: name, error } = await supabase
          .from("account")
          .select("name")
          .eq("phone_number", phoneNumber.slice(-10));
        if (isResgistered) {
          ctx.response.body = `CON Welcome back ${name[0].name}, what would you like to do today?
          
                                1. Transfer Money
                                2. Check balance
                                3. Airtime / Data
                                4. Pay Bills
                                5. Fund Account
                                6. Settings`;
        } else {
          ctx.response.body = `CON Welcome to 1naira
                                1. Create an account`;
        }
        // console.log(phoneNumbers);
      } else if (text == "1" && isResgistered) {
        // First Screen (Logged in)
        ctx.response.body = `CON Transfer to
                              1. 1Naira Account
                              2. Other Bank Account`;
      } else if (text == "2") {
        const { data: balance, error } = await supabase
          .from("account")
          .select("balance")
          .eq("phone_number", phoneNumber.slice(-10));
        const bal = balance[0].balance;
        console.log(bal);
        ctx.response.body = `END Your 1Naira Account balance is ₦${bal}.00`;
      } else if (text == "3") {
        ctx.response.body = `CON 
                            1. Buy Airtime
                            2. Buy Data`;
      } else if (text == "5") {
        ctx.response.body = `CON Select Funding Method
        1. Recharge card
        2. Bank Transfer
        00. Main Menu`;
      } else if (text == "6") {
        ctx.response.body = `CON 
                            1. Change pin
                            2. Change Language
                            00. Main Menu`;
      } else if (text == "6*1") {
        ctx.response.body = `CON Enter old pin
`;
      } 
      else if(/6\*1\*[0-9]{4}/i.test(text)){
        const { data: pin, error } = await supabase
        .from("account")
        .select("pin")
        .eq("phone_number", phoneNumber.slice(-10));

      console.log({ pin: pin[0].pin, error });
      //Check if pin exists
      if (pin[0].pin === text.split('*')[2]) {
        ctx.response.body = `CON Enter new Pin
                              `;
      } else {
        ctx.response.body = `END Incorrect Pin
                               
      `;
      }
      }
      else if(/6\*1\*[0-9]{4}\*[0-9]{4}/i.test(text)){
      //Check if pin exists
        ctx.response.body = `CON Enter New Pin again
                              `;
      
      }
      else if(/6\*1\*[0-9]{4}\*[0-9]{4}\*[0-9]{4}/i.test(text)){
        //Check if pin exists
          if(text.split('*')[3] == text.split('*')[4]){
            const { data, error } = await supabase
            .from("account")
            .update({ pin: text.split("*")[4] })
            .eq("phone_number", phoneNumber.slice(-10));
            ctx.response.body = `END Pin Updated
            `;
          }else{
            ctx.response.body = `END Pins don't match
            `;
          }

        
        }
      else if (text == "1*1" && isResgistered) {
        // Transfer Funds
        // Select current users pin
        const { data: pin, error } = await supabase
          .from("account")
          .select("pin")
          .eq("phone_number", phoneNumber.slice(-10));

        console.log({ pin: pin[0].pin, error });
        //Check if pin exists
        if (pin[0].pin === null) {
          ctx.response.body = `CON You are yet to create a pin
                                1. Continue to pin create`;
        } else {
          ctx.response.body = `CON Enter account Number
                                 
        `;
        }
      } else if (text.split("*")[text.split("*").length - 1] == "00") {
        const { data: name, error } = await supabase
          .from("account")
          .select("name")
          .eq("phone_number", phoneNumber.slice(-10));
        ctx.response.body = `CON Welcome back ${name[0].name}, what would you like to do today?
                                1. Transfer Money
                                2. Check balance
                                3. Pay Bills
                                4. Fund Account
                                5. Settings`;
      } else if (text == "1*1*1" && isResgistered) {
        //Choose pin
        ctx.response.body = `CON Choose 4 Digit Pin`;
      } else if (
        /1\*1\*1\*[0-9]{4}/i.test(text) &&
        text.split("*").length == 4 &&
        isResgistered
      ) {
        ctx.response.body = `CON Type pin again`;
        // /1\*1\*[0-9]{9}/i.test(text)
      } else if (
        text.split("*")[2] >= 9 &&
        text.split("*").length <= 3 &&
        isResgistered
      ) {
        if (
          phoneNumbers.filter(
            (number) => number.phone_number.slice(-10) == text.split("*")[2]
          ).length
        ) {
          const { data: name, error } = await supabase
            .from("account")
            .select("name")
            .eq("phone_number", text.split("*")[2]);
          ctx.response.body = `CON Are the account details correct?
          ${name[0].name}
          ${text.split("*")[2]}
          1. Yes
          2. No`;
        } else {
          ctx.response.body = `CON Invalid account number
          00. Main Menu`;
        }
      } else if (
        /1\*1\*[0-9]{10}\*1/i.test(text) &&
        text.split("*").length < 5 &&
        isResgistered
      ) {
        ctx.response.body = `CON Enter amount to send`;
      } else if (
        /1\*1\*[0-9]{10}\*1\*[0-9]{2}/i.test(text) &&
        text.split("*").length < 6 &&
        isResgistered
      ) {
        const { data: balance, bError } = await supabase
          .from("account")
          .select("balance")
          .eq("phone_number", phoneNumber.slice(-10));
        console.log(balance[0].balance);
        if (balance[0].balance >= Number(text.split("*")[4])) {
          const { data: name, error } = await supabase
            .from("account")
            .select("name")
            .eq("phone_number", phoneNumber.slice(-10));
          ctx.response.body = `CON Enter Pin to send ₦${
            text.split("*")[4]
          } to ${name[0].name} ${text.split("*")[2]}`;
        } else {
          ctx.response.body = `END Insufficient funds`;
        }

        // console.log(`Sent ${text.split('*')[4]} to ${text.split('*')[2]}`)
      } else if (
        /1\*1\*[0-9]{10}\*1\*[0-9]{2}/i.test(text) &&
        text.split("*").length >= 6 &&
        isResgistered
      ) {
        const { data: senderBalance, error: balErr } = await supabase
          .from("account")
          .select("balance")
          .eq("phone_number", phoneNumber.slice(-10));

        const { data: receiverBalance, error: rBalErr } = await supabase
          .from("account")
          .select("balance")
          .eq("phone_number", text.split("*")[2]);
        const { data: receiverName, error: rNameErr } = await supabase
          .from("account")
          .select("name")
          .eq("phone_number", text.split("*")[2]);

        const { data: pin, error } = await supabase
          .from("account")
          .select("pin")
          .eq("phone_number", phoneNumber.slice(-10));

        if (text.split("*")[5] == String(pin[0].pin)) {
          const { data, error } = await supabase
            .from("account")
            .update({
              balance: senderBalance[0].balance - Number(text.split("*")[4]),
            })
            .eq("phone_number", phoneNumber.slice(-10));
          const { data: updateAccount, err } = await supabase
            .from("account")
            .update({
              balance: receiverBalance[0].balance + Number(text.split("*")[4]),
            })
            .eq("phone_number", text.split("*")[2]);
          // You sent [Amount] to [Full Name]. Your new balance is
          const { data: receiverBalanceUp, error: rBalErr } = await supabase
            .from("account")
            .select("balance")
            .eq("phone_number", text.split("*")[2]);
          ctx.response.body = `END You Sent ₦${
            text.split("*")[4]
          }.00 to ${receiverName} ${
            text.split("*")[2]
          }. Your new balance is ₦${receiverBalanceUp}.00`;
          console.log("sending");
        } else {
          ctx.response.body = `END Wrong Pin`;
          console.log("Wrong Pin");
        }
      } else if (
        /1\*1\*1\*[0-9]{4}\*[0-9]{4}/i.test(text) &&
        text.split("*").length >= 5 &&
        text.split("*")[3].length == 4 &&
        isResgistered
      ) {
        if (text.split("*")[3] == text.split("*")[4]) {
          const { data, error } = await supabase
            .from("account")
            .update({ pin: text.split("*")[4] })
            .eq("phone_number", phoneNumber.slice(-10));
          console.log({ data, error });
          ctx.response.body = `CON Pin saved`;
        } else {
          ctx.response.body = `END Pins don't match`;
        }
      } else if (text == "1") {
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
    console.log({ data, error });
  });
  router.post("/updateUser", async (ctx) => {
    const { name, phone_number, pin } = await ctx.request.body().value;
    const { data, error } = await supabase
      .from("account")
      .update({ balance: balance + 1000 })
      .eq("name", name);
    console.log({ data, error });
  });

  router.get("/getAll", async (ctx) => {
    let { data: account, error } = await supabase.from("account").select("*");
    console.log({ account });
  });
  const app = new Application();
  const port = 3005;
  app.use(router.routes());
  app.use(router.allowedMethods());
  app.addEventListener("listen", () => {
    console.log(`Listening on localhost:${port}`);
  });
  await app.listen(`127.0.0.1:${port}`);
})();
