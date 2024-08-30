import express, { Application, Request, Response } from "express";
import "dotenv/config";
import ejs, { name } from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import Routes from "./routes/index.js";
const _dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Application = express();

const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set View Engine
app.set("view engine", "ejs");
app.set("views", path.resolve(_dirname, "./views"));

// Routes
app.use("/", Routes);

app.get("/", async (req: Request, res: Response) => {
  // const html = await ejs.renderFile(_dirname + `/views/emails/welcome.ejs`, {
  //   name: "Hrutik Dhumal",
  // });
  // console.log(html);

  // await emailQueue.add(emailQueueName, {
  //   to: "hrutikdhumal2003@gmail.com",
  //   subject: "Testing SMTP",
  //   body: html,
  // });
  // return res.json({
  //   message: "Email Sent",
  // });

  return res.render("emails/email-verify", {
    name: "Hrutik",
    url: "hrrp",
  });
});

// queues
import "./jobs/index.js";
import { emailQueue, emailQueueName } from "./jobs/EmailJob.js";
import { renderEmailEjs } from "./helper.js";

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
