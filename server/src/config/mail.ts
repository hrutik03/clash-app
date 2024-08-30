import nodemailer from "nodemailer";
export const transporter = nodemailer.createTransport({
  // host: process.env.SMTP_HOST,
  service: "gmail",
  port: 465,
  secure: true, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(to);

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: to,
    subject: subject,
    html: body,
  });

  console.log(info.messageId);
};
